import { ApiPromise } from "@polkadot/api";
import { createTestKeyring } from "@polkadot/keyring";
import { HttpProvider } from "@polkadot/rpc-provider";
import { BN } from "@polkadot/util";
import { randomAsU8a } from "@polkadot/util-crypto";
import axios from "axios";
import { until } from "opstooling-js";

const randomAddress = () => createTestKeyring().addFromSeed(randomAsU8a(32)).address;

describe("Faucet E2E", () => {
  const matrix = axios.create({ baseURL: "http://localhost:8008" });
  const webEndpoint = axios.create({ baseURL: "http://localhost:5555" });
  const PARACHAIN_ID = 1000; // From the zombienet config.
  let roomId: string;
  let userAccessToken: string;

  const polkadotApi = new ApiPromise({
    // Zombienet relaychain node.
    provider: new HttpProvider("http://localhost:9944"),
    types: { Address: "AccountId", LookupSource: "AccountId" },
  });

  const parachainApi = new ApiPromise({
    // Zombienet parachain node.
    provider: new HttpProvider("http://localhost:9945"),
    types: { Address: "AccountId", LookupSource: "AccountId" },
  });

  const login = async (user: string, password: string): Promise<string> => {
    const result = await matrix.post("_matrix/client/v3/login", { type: "m.login.password", user, password });
    return result.data.access_token;
  };

  const postMessage = async (body: string) => {
    await matrix.post(`/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${userAccessToken}`, {
      msgtype: "m.text",
      body,
    });
  };

  const getLatestMessage = async (): Promise<{ sender: string; body: string }> => {
    const latestMessage = await matrix.get(
      `/_matrix/client/v3/rooms/${roomId}/messages?dir=b&limit=1&access_token=${userAccessToken}`,
    );
    const chunk = latestMessage.data.chunk[0];
    return { sender: chunk.sender, body: chunk.content.body };
  };

  const getUserBalance = async (userAddress: string, api: ApiPromise = polkadotApi) => {
    const { data } = await api.query.system.account(userAddress);
    return data.free.toBn();
  };

  beforeAll(async () => {
    userAccessToken = await login("user", "user");
    await polkadotApi.isReady;
    await parachainApi.isReady;
    /*
    We should have already joined the room, but we repeat it to retrieve the room id.
    We cannot send a message to a room via alias.
    */
    const room = await matrix.post(`/_matrix/client/v3/join/%23faucet:parity.io?access_token=${userAccessToken}`, {});
    roomId = room.data.room_id;
  });

  test("The bot responds to the !balance message", async () => {
    await postMessage("!balance");

    await until(async () => (await getLatestMessage()).sender === "@bot:parity.io", 500, 10, "Bot did not reply.");
    const botMessage = await getLatestMessage();
    expect(botMessage.body).toMatch(/^The faucet has (999.*|100.*) UNITs remaining.$/);
  });

  test("The bot drips to a given address", async () => {
    const userAddress = randomAddress();
    const initialBalance = await getUserBalance(userAddress);

    await postMessage(`!drip ${userAddress}`);

    await until(async () => (await getLatestMessage()).sender === "@bot:parity.io", 500, 10, "Bot did not reply.");
    const botMessage = await getLatestMessage();
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

    await postMessage(`!drip ${userAddress}:${PARACHAIN_ID}`);

    await until(async () => (await getLatestMessage()).sender === "@bot:parity.io", 500, 10, "Bot did not reply.");
    const botMessage = await getLatestMessage();
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

    await postMessage(`!drip ${userAddress}:123`);

    await until(async () => (await getLatestMessage()).sender === "@bot:parity.io", 500, 10, "Bot did not reply.");
    const botMessage = await getLatestMessage();
    expect(botMessage.body).toContain("Parachain invalid. Be sure to set a value between 1000 and 9999");
  });

  test("The web endpoint responds to a balance query", async () => {
    const result = await webEndpoint.get("/balance");

    expect(result.status).toEqual(200);
    expect("balance" in result.data).toBeTruthy();
    expect(new BN(result.data.balance).gtn(0)).toBeTruthy();
  });

  test("The web endpoint drips to a given address", async () => {
    const userAddress = randomAddress();
    const initialBalance = await getUserBalance(userAddress);

    const result = await webEndpoint.post("/drip/web", { address: userAddress, recaptcha: "anything goes" });

    expect(result.status).toEqual(200);
    expect("hash" in result.data).toBeTruthy();
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

    const result = await webEndpoint.post("/drip/web", {
      address: userAddress,
      recaptcha: "anything goes",
      parachain_id: "1000",
    });

    expect(result.status).toEqual(200);
    expect("hash" in result.data).toBeTruthy();
    await until(
      async () => (await getUserBalance(userAddress, parachainApi)).gt(initialBalance),
      1000,
      40,
      "balance did not increase.",
    );
  });

  test("The web endpoint fails on wrong parachain", async () => {
    const userAddress = randomAddress();

    const promise = webEndpoint.post("/drip/web", {
      address: userAddress,
      recaptcha: "anything goes",
      parachain_id: "100",
    });
    await expect(promise).rejects.toThrow();
    await expect(promise).rejects.toMatchObject({
      response: { data: { error: "Parachain invalid. Be sure to set a value between 1000 and 9999" } },
    });
  });
});
