import { until, validatedFetch } from "@eng-automation/js";
import { ApiPromise } from "@polkadot/api";
import { WsProvider } from "@polkadot/rpc-provider";
import { AccountId, createClient } from "@polkadot-api/client";
import { getChain } from "@polkadot-api/node-polkadot-provider";
import { WebSocketProvider } from "@polkadot-api/ws-provider/node";
import { RandomProvider } from "@prosopo/captcha-contract";
import crypto from "crypto";
import Joi from "joi";
import { filter, firstValueFrom, mergeMap, pairwise, race, skipWhile, throwError } from "rxjs";
import { Repository } from "typeorm";

import { Drip } from "src/db/entity/Drip";
import parachainDescriptors from "src/test/codegen/parachain";
import relaychainDescriptors from "src/test/codegen/relaychain";
import { drip } from "src/test/webhookHelpers";

import { getLatestMessage, postMessage } from "./test/matrixHelpers";
import { destroyDataSource, E2ESetup, getDataSource, setup, teardown } from "./test/setupE2E";
import { procaptchaGetRandomProvider, ProcaptchaTestSetup } from "./test/setupE2EProcaptcha";

const randomAddress = () => AccountId().dec(crypto.randomBytes(32));
const sha256 = (x: string) => crypto.createHash("sha256").update(x, "utf8").digest("hex");

describe("Faucet E2E", () => {
  const PARACHAIN_ID = 1000; // From the zombienet config.
  const PROSOPO_SITE_KEY = "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM"; // procaptcha demo account (zero address)
  let roomId: string;
  let userAccessToken: string;
  let matrixUrl: string;
  let webEndpoint: string;
  let e2eSetup: E2ESetup;
  let dripRepository: Repository<Drip>;
  let procaptchaDetails: ProcaptchaTestSetup;

  /**
   * For faster debugging, make all the providers the same and run a single
   * substrate-contracts-node in manual seal (dev) mode instead of using zombienet.
   * ```bash
   *     substrate-contracts-node --dev --rpc-port 9988 --rpc-cors all --unsafe-rpc-external --rpc-methods unsafe
   * ```
   * This won't pass the tests as XCM will not exist, but it will make development easier.
   */

  const relaychainClient = createClient(
    getChain({
      provider: WebSocketProvider("ws://127.0.0.1:9923"),
      keyring: [],
    }),
  );
  const relayChainApi = relaychainClient.getTypedApi(relaychainDescriptors);

  const parachainClient = createClient(
    getChain({
      provider: WebSocketProvider("ws://127.0.0.1:9934"),
      keyring: [],
    }),
  );

  const parachainApi = parachainClient.getTypedApi(parachainDescriptors);

  type SomeApi = typeof relayChainApi | typeof parachainApi;

  const rococoContractsApi = new ApiPromise({
    // Zombienet parachain node.
    provider: new WsProvider("ws://127.0.0.1:9988"),
    types: { Address: "AccountId", LookupSource: "AccountId" },
  });

  const expectBalanceIncrease = async (useraddress: string, api: SomeApi, blocksNum: number) => {
    const startBlock = await api.query.System.Number.getValue({ at: "best" });
    return await firstValueFrom(
      race([
        api.query.System.Account.watchValue(useraddress, "best")
          .pipe(pairwise())
          .pipe(filter(([oldValue, newValue]) => newValue.data.free > oldValue.data.free)),
        api.query.System.Number.watchValue("best")
          .pipe(skipWhile((blockNumber) => blockNumber - startBlock < blocksNum))
          .pipe(mergeMap(() => throwError(() => new Error(`Balance did not increase in ${blocksNum} blocks`)))),
      ]),
    );
  };

  beforeAll(async () => {
    e2eSetup = await setup(rococoContractsApi, PROSOPO_SITE_KEY);

    roomId = e2eSetup.matrixSetup.roomId;
    userAccessToken = e2eSetup.matrixSetup.userAccessToken;
    matrixUrl = e2eSetup.matrixSetup.matrixUrl;
    webEndpoint = e2eSetup.webEndpoint;
    procaptchaDetails = e2eSetup.procaptchaDetails;

    const AppDataSource = await getDataSource();
    dripRepository = AppDataSource.getRepository(Drip);

    console.log("beforeAll: done");
  }, 900_000);

  afterAll(async () => {
    relaychainClient.destroy();
    parachainClient.destroy();
    await rococoContractsApi.disconnect();
    await destroyDataSource();
    if (e2eSetup) await teardown(e2eSetup);
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

    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      10,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });
    expect(botMessage.body).toContain("Sent @user:parity.io 10 UNITs.");
    await expectBalanceIncrease(userAddress, relayChainApi, 3);
  });

  test("The bot teleports to a given address", async () => {
    const userAddress = randomAddress();

    await postMessage(matrixUrl, {
      roomId,
      accessToken: userAccessToken,
      body: `!drip ${userAddress}:${PARACHAIN_ID}`,
    });

    await until(
      async () =>
        (await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken })).sender === "@bot:parity.io",
      500,
      10,
      "Bot did not reply.",
    );
    const botMessage = await getLatestMessage(matrixUrl, { roomId, accessToken: userAccessToken });
    expect(botMessage.body).toContain("Sent @user:parity.io 10 UNITs.");
    await expectBalanceIncrease(userAddress, parachainApi, 3);
  });

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

    const randomProvider: RandomProvider = await procaptchaGetRandomProvider(
      procaptchaDetails.contract,
      procaptchaDetails.siteKey,
      procaptchaDetails.testAccount,
    );
    const result = await drip(webEndpoint, userAddress, undefined, randomProvider);

    expect(result.hash).toBeTruthy();
    await expectBalanceIncrease(userAddress, relayChainApi, 3);
  });

  test("The web endpoint teleports to a given address", async () => {
    const userAddress = randomAddress();
    const randomProvider: RandomProvider = await procaptchaGetRandomProvider(
      procaptchaDetails.contract,
      procaptchaDetails.siteKey,
      procaptchaDetails.testAccount,
    );
    const result = await drip(webEndpoint, userAddress, "1000", randomProvider);

    expect(result.hash).toBeTruthy();

    await expectBalanceIncrease(userAddress, parachainApi, 3);
  });

  test("The web endpoint fails on wrong parachain", async () => {
    const userAddress = randomAddress();
    const randomProvider: RandomProvider = await procaptchaGetRandomProvider(
      procaptchaDetails.contract,
      procaptchaDetails.siteKey,
      procaptchaDetails.testAccount,
    );
    const promise = drip(webEndpoint, userAddress, "100", randomProvider);
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
    await dripRepository.insert(oldDrip);
    const randomProvider: RandomProvider = await procaptchaGetRandomProvider(
      procaptchaDetails.contract,
      procaptchaDetails.siteKey,
      procaptchaDetails.testAccount,
    );
    const result = await drip(webEndpoint, userAddress, undefined, randomProvider);

    expect(result.hash).toBeTruthy();
  });

  test("Web faucet doesn't drip to address that has requested a drip 5h ago", async () => {
    const userAddress = randomAddress();

    const oldDrip = new Drip();
    oldDrip.addressSha256 = sha256(userAddress);
    oldDrip.timestamp = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    await dripRepository.insert(oldDrip);
    const randomProvider: RandomProvider = await procaptchaGetRandomProvider(
      procaptchaDetails.contract,
      procaptchaDetails.siteKey,
      procaptchaDetails.testAccount,
    );
    await expect(drip(webEndpoint, userAddress, undefined, randomProvider)).rejects.toThrow(
      "Requester has reached their daily quota. Only request once per day",
    );
  });
});
