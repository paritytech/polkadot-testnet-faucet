import { until, validatedFetch } from "@eng-automation/js";
import { ApiPromise } from "@polkadot/api";
import { createTestKeyring } from "@polkadot/keyring";
import { WsProvider } from "@polkadot/rpc-provider";
import { BN } from "@polkadot/util";
import { randomAsU8a } from "@polkadot/util-crypto";
import Joi from "joi";

import { getLatestMessage, postMessage } from "./test/matrixHelpers";
import { E2ESetup, setup, teardown } from "./test/setupE2E";

const randomAddress = () => createTestKeyring().addFromSeed(randomAsU8a(32)).address;

describe("Faucet E2E", () => {
  const PARACHAIN_ID = 1000; // From the zombienet config.
  let roomId: string;
  let userAccessToken: string;
  let matrixUrl: string;
  let webEndpoint: string;
  let e2eSetup: E2ESetup;

  const polkadotApi = new ApiPromise({
    // Zombienet relaychain node.
    provider: new WsProvider("ws://127.0.0.1:9933"),
    types: { Address: "AccountId", LookupSource: "AccountId" },
  });

  const parachainApi = new ApiPromise({
    // Zombienet parachain node.
    provider: new WsProvider("ws://127.0.0.1:9934"),
    types: { Address: "AccountId", LookupSource: "AccountId" },
  });

  const getUserBalance = async (userAddress: string, api: ApiPromise = polkadotApi) => {
    const { data } = await api.query.system.account(userAddress);
    return data.free.toBn();
  };

  beforeAll(async () => {
    e2eSetup = await setup();
    roomId = e2eSetup.matrixSetup.roomId;
    userAccessToken = e2eSetup.matrixSetup.userAccessToken;
    matrixUrl = e2eSetup.matrixSetup.matrixUrl;
    webEndpoint = e2eSetup.webEndpoint;

    await polkadotApi.isReady;
    await parachainApi.isReady;
  });

  afterAll(async () => {
    await polkadotApi.disconnect();
    await parachainApi.disconnect();
    if (e2eSetup) teardown(e2eSetup);
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
    expect(botMessage.body).toMatch(/^The faucet has (999.*|100.*) UNITs remaining.$/);
  });

  test("The bot drips to a given address", async () => {
    const userAddress = randomAddress();
    const initialBalance = await getUserBalance(userAddress);

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
    await until(
      async () => (await getUserBalance(userAddress)).gt(initialBalance),
      1000,
      15,
      "balance did not increase.",
    );
  });

  test("The bot teleports to a given address", async () => {
    const userAddress = randomAddress();
    const initialBalance = await getUserBalance(userAddress, parachainApi);

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

    await until(
      async () => (await getUserBalance(userAddress, parachainApi)).gt(initialBalance),
      1000,
      40,
      "balance did not increase.",
    );
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

  test("The web endpoint responds to a balance query", async () => {
    const result = await validatedFetch<{
      balance: string;
    }>(`${webEndpoint}/balance`, Joi.object({ balance: Joi.string() }), {});

    expect("balance" in result).toBeTruthy();
    expect(new BN(result.balance).gtn(0)).toBeTruthy();
  });

  test("The web endpoint drips to a given address", async () => {
    const userAddress = randomAddress();
    const initialBalance = await getUserBalance(userAddress);

    const result = await validatedFetch<{
      hash: string;
    }>(`${webEndpoint}/drip/web`, Joi.object({ hash: Joi.string() }), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userAddress, recaptcha: "anything goes" }),
      },
    });

    expect(result.hash).toBeTruthy();
    await until(
      async () => (await getUserBalance(userAddress)).gt(initialBalance),
      500,
      15,
      "balance did not increase.",
    );
  });

  test("The web endpoint teleports to a given address", async () => {
    const userAddress = randomAddress();
    const initialBalance = await getUserBalance(userAddress, parachainApi);

    const result = await validatedFetch<{
      hash: string;
    }>(`${webEndpoint}/drip/web`, Joi.object({ hash: Joi.string() }), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userAddress, recaptcha: "anything goes", parachain_id: "1000" }),
      },
    });

    expect(result.hash).toBeTruthy();
    await until(
      async () => (await getUserBalance(userAddress, parachainApi)).gt(initialBalance),
      1000,
      40,
      "balance did not increase.",
    );
  });

  test("The web endpoint fails on wrong parachain", async () => {
    const userAddress = randomAddress();

    const promise = validatedFetch<{
      hash: string;
    }>(`${webEndpoint}/drip/web`, Joi.object({ hash: Joi.string() }), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userAddress, recaptcha: "anything goes", parachain_id: "100" }),
      },
    });
    await expect(promise).rejects.toThrow();
    await expect(promise).rejects.toMatchObject({
      message: expect.stringMatching("Parachain invalid. Be sure to set a value between 1000 and 9999"),
    });
  });
});
