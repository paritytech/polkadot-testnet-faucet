import { ApiPromise } from "@polkadot/api";
import { HttpProvider } from "@polkadot/rpc-provider";
import axios from "axios";
import { until } from "opstooling-js";

describe("Faucet E2E", () => {
  const userAddress = "1useDmpdQRgaCmkmLFihuw1Q4tXTfNKaeJ6iPaMLcyqdkoS"; // Random address.
  const matrix = axios.create({ baseURL: "http://localhost:8008" });
  let roomId: string;
  let userAccessToken: string;

  const polkadotApi = new ApiPromise({
    provider: new HttpProvider("http://localhost:9933"),
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

  const getUserBalance = async () => {
    const { data } = await polkadotApi.query.system.account(userAddress);
    return data.free.toBn();
  };

  beforeAll(async () => {
    userAccessToken = await login("user", "user");
    await polkadotApi.isReady;
    /*
    We should have already joined the room, but we repeat it to retrieve the room id.
    We cannot send a message to a room via alias.
    */
    const room = await matrix.post(`/_matrix/client/v3/join/%23faucet:localhost?access_token=${userAccessToken}`, {});
    roomId = room.data.room_id;
  });

  test("The bot responds to the !balance message", async () => {
    await postMessage("!balance");

    await until(async () => (await getLatestMessage()).sender === "@bot:localhost", 500, 10, "Bot did not reply.");
    const botMessage = await getLatestMessage();
    expect(botMessage.body).toEqual("The faucet has 10000 UNITs remaining.");
  });

  test("The bots drips to a given address", async () => {
    expect((await getUserBalance()).eqn(0)).toBeTruthy();

    await postMessage(`!drip ${userAddress}`);

    await until(async () => (await getLatestMessage()).sender === "@bot:localhost", 500, 10, "Bot did not reply.");
    const botMessage = await getLatestMessage();
    expect(botMessage.body).toContain("Sent @user:localhost 10 UNITs.");
    await until(async () => (await getUserBalance()).gtn(0), 500, 15, "balance did not increase.");
  });
});
