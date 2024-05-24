import { until, validatedFetch } from "@eng-automation/js";
import { matrixHelpers } from "@eng-automation/testing";
import { e2e_parachain, e2e_relaychain } from "@polkadot-api/descriptors";
import crypto from "crypto";
import Joi from "joi";
import { AccountId, createClient } from "polkadot-api";
import { WebSocketProvider } from "polkadot-api/ws-provider/node";
import { filter, firstValueFrom, mergeMap, pairwise, race, skip, throwError } from "rxjs";
import { Repository } from "typeorm";

import { Drip } from "src/db/entity/Drip";
import { drip } from "src/test/webhookHelpers";

import { destroyDataSource, E2ESetup, getDataSource, setup, teardown } from "./test/setupE2E";

const randomAddress = () => AccountId().dec(crypto.randomBytes(32));
const sha256 = (x: string) => crypto.createHash("sha256").update(x, "utf8").digest("hex");

const { getLatestMessage, postMessage } = matrixHelpers;

describe("Faucet E2E", () => {
  const PARACHAIN_ID = 1000; // From the zombienet config.
  let roomId: string;
  let userAccessToken: string;
  let matrixUrl: string;
  let webEndpoint: string;
  let e2eSetup: E2ESetup;
  let dripRepository: Repository<Drip>;

  const relaychainClient = createClient(WebSocketProvider("ws://127.0.0.1:9933"));
  const relayChainApi = relaychainClient.getTypedApi(e2e_relaychain);

  const parachainClient = createClient(WebSocketProvider("ws://127.0.0.1:9934"));
  const parachainApi = parachainClient.getTypedApi(e2e_parachain);

  type SomeApi = typeof relayChainApi | typeof parachainApi;

  const expectBalanceIncrease = async (useraddress: string, api: SomeApi, blocksNum: number) =>
    await firstValueFrom(
      race([
        api.query.System.Account.watchValue(useraddress, "best")
          .pipe(pairwise())
          .pipe(filter(([oldValue, newValue]) => newValue.data.free > oldValue.data.free)),
        api.query.System.Number.watchValue("best").pipe(
          skip(blocksNum),
          mergeMap(() =>
            throwError(() => new Error(`Balance of ${useraddress} did not increase in ${blocksNum} blocks`)),
          ),
        ),
      ]),
    );

  beforeAll(async () => {
    e2eSetup = await setup();
    roomId = e2eSetup.matrixSetup.roomId;
    userAccessToken = e2eSetup.matrixSetup.userAccessToken;
    matrixUrl = e2eSetup.matrixSetup.matrixUrl;
    webEndpoint = e2eSetup.webEndpoint;

    const AppDataSource = await getDataSource();
    dripRepository = AppDataSource.getRepository(Drip);

    console.log("beforeAll: done");
  }, 100_000);

  afterAll(async () => {
    relaychainClient.destroy();
    parachainClient.destroy();
    await destroyDataSource();
    if (e2eSetup) teardown(e2eSetup);
  });

  afterEach(async () => {
    await dripRepository.clear();
  });

  test("The bot responds to the !balance message", async () => {
    await postMessage(matrixUrl, { roomId, accessToken: userAccessToken, body: "!balance" });

    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      20,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });

    // We're expecting the balance to be between 100000 and 999000 in these tests
    // [0-9]{6,7} ensures that we aren't getting fractions
    expect(botMessage.body).toMatch(/^The faucet has [0-9]{6,7} UNITs remaining.$/);
  });

  test("The bot drips to a given address", async () => {
    const userAddress = randomAddress();

    await postMessage(matrixUrl, { roomId, accessToken: userAccessToken, body: `!drip ${userAddress}` });

    await expectBalanceIncrease(userAddress, relayChainApi, 7);
    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      20,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });
    expect(botMessage.body).toContain("Sent @user:parity.io 10 UNITs.");
  });

  test("The bot teleports to a given address", async () => {
    const userAddress = randomAddress();

    await postMessage(matrixUrl, {
      roomId,
      accessToken: userAccessToken,
      body: `!drip ${userAddress}:${PARACHAIN_ID}`,
    });

    await expectBalanceIncrease(userAddress, parachainApi, 12);

    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      200,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });
    expect(botMessage.body).toContain("Sent @user:parity.io 10 UNITs.");
  }, 100_000);

  test("The bot fails on invalid chain id", async () => {
    const userAddress = randomAddress();

    await postMessage(matrixUrl, { roomId, accessToken: userAccessToken, body: `!drip ${userAddress}:123` });

    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      10,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });
    expect(botMessage.body).toContain("Parachain invalid. Be sure to set a value between 1000 and 9999");
  });

  test("The bot failed due to insufficient balance", async () => {
    const userAddress = randomAddress();

    await postMessage(matrixUrl, { roomId, accessToken: userAccessToken, body: `!drip ${userAddress} 100000000` });

    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      10,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });
    expect(botMessage.body).toMatch(/^Can't send 100000000 UNITs, as balance is only [0-9]{6,7} UNITs.$/);
  });

  test("The web endpoint responds to a balance query", async () => {
    const result = await validatedFetch<{
      balance: string;
    }>(`${webEndpoint}/balance`, Joi.object({ balance: Joi.string() }), {});

    expect("balance" in result).toBeTruthy();
    expect(BigInt(result.balance) > 0n).toBeTruthy();
  });

  test("The web endpoint drips to a given address", async () => {
    const userAddress = randomAddress();

    const dripPromise = drip(webEndpoint, userAddress);
    await expectBalanceIncrease(userAddress, relayChainApi, 7);

    const result = await dripPromise;
    expect(result.hash).toBeTruthy();
  });

  test("The web endpoint teleports to a given address", async () => {
    const userAddress = randomAddress();

    const result = await drip(webEndpoint, userAddress, "1000");

    expect(result.hash).toBeTruthy();

    await expectBalanceIncrease(userAddress, parachainApi, 7);
  });

  test("The web endpoint fails on wrong parachain", async () => {
    const userAddress = randomAddress();

    const promise = drip(webEndpoint, userAddress, "100");
    await expect(promise).rejects.toThrow();
    await expect(promise).rejects.toMatchObject({
      message: expect.stringMatching("Parachain invalid. Be sure to set a value between 1000 and 9999"),
    });
  });

  test("Faucet drips to a user that has requested a drip 30h ago", async () => {
    const userAddress = randomAddress();

    const oldDrip = new Drip();
    oldDrip.addressSha256 = sha256(userAddress);
    oldDrip.timestamp = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    dripRepository.insert(oldDrip);

    const result = await drip(webEndpoint, userAddress);

    expect(result.hash).toBeTruthy();
  });

  test("Web faucet doesn't drip to address that has requested a drip 5h ago", async () => {
    const userAddress = randomAddress();

    const oldDrip = new Drip();
    oldDrip.addressSha256 = sha256(userAddress);
    oldDrip.timestamp = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    await dripRepository.insert(oldDrip);

    await expect(drip(webEndpoint, userAddress)).rejects.toThrow(
      "Requester has reached their daily quota. Only request once per day",
    );
  });
});
