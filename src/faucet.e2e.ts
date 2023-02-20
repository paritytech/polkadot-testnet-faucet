import { ApiPromise } from "@polkadot/api";
import { HttpProvider } from "@polkadot/rpc-provider";
import axios, { AxiosInstance } from "axios";
import { until } from "opstooling-js";
import { GenericContainer, DockerComposeEnvironment } from "testcontainers";
import path from "path";
import { Wait } from "testcontainers";

describe("Faucet E2E", () => {
  const userAddress = "1useDmpdQRgaCmkmLFihuw1Q4tXTfNKaeJ6iPaMLcyqdkoS"; // Random address.
  let polkadotApi: ApiPromise
  let matrix: AxiosInstance
  let roomId: string;
  let userAccessToken: string;
  let adminAccessToken: string;
  let botAccessToken: string;

  const login = async (user: string, password: string): Promise<string> => {
    const result = await matrix.post("_matrix/client/v3/login", { type: "m.login.password", user, password });
    return result.data.access_token;
  };

  const prepareRoom = async (): Promise<string> => {
    const result = await matrix.post(`/_matrix/client/v3/createRoom??access_token=${adminAccessToken}`, {
      "room_alias_name": "faucet"
    });
    const roomId = result.data.room_id
    await matrix.post(`/_matrix/client/v3/rooms/${roomId}/invite?access_token=${adminAccessToken}`, {
      "user_id": "@bot:localhost"
    });
    await matrix.post(`/_matrix/client/v3/rooms/${roomId}/invite?access_token=${adminAccessToken}`, {
      "user_id": "@user:localhost"
    });
    return roomId
  }

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
    console.log("A")
    const composeFilePath = path.resolve(__dirname, "../e2e");



    const environment = await new DockerComposeEnvironment(composeFilePath, "docker-compose.yml")
      .withWaitStrategy("e2e-polkadot", Wait.forLogMessage("Running JSON-RPC HTTP server"))
      .withWaitStrategy("e2e-matrix", Wait.forLogMessage("Setting up server"))
      .up();


    const matrixContainer = environment.getContainer("e2e-matrix")
    const polkadotContainer = environment.getContainer("e2e-polkadot")

    await matrixContainer.exec(["e2e-matrix register_new_matrix_user --user admin --password admin -c /data/homeserver.yaml --admin"])
    await matrixContainer.exec(["e2e-matrix register_new_matrix_user --user bot --password bot -c /data/homeserver.yaml --admin"])
    await matrixContainer.exec(["e2e-matrix register_new_matrix_user --user user --password user -c /data/homeserver.yaml --admin"])
    matrix = axios.create({ baseURL: `http://localhost:${matrixContainer.getMappedPort(8008)}` });

    polkadotApi = new ApiPromise({
      provider: new HttpProvider(`http://localhost:${polkadotContainer.getMappedPort(9933)}`),
      types: { Address: "AccountId", LookupSource: "AccountId" },
    });

    const botImage = await GenericContainer.fromDockerfile(path.resolve(__dirname, ".."), "bot_injected.Dockerfile")
      .build();

    const botContainer = await botImage
      .start();

    const serverImage = await GenericContainer.fromDockerfile(path.resolve(__dirname, ".."), "server_injected.Dockerfile")
      .build();

    const serverContainer = await serverImage
      .start();
  }, 60_000)

  // beforeAll(async () => {
  //   adminAccessToken = await login("admin", "admin")
  //   botAccessToken = await login("bot", "bot")
  //   userAccessToken = await login("user", "user");
  //   roomId = await prepareRoom()
  // })
  //
  // beforeAll(async () => await polkadotApi.isReady);

  test("testcontainers", async () => {

  })

  // test("The bot responds to the !balance message", async () => {
  //   await postMessage("!balance");
  //
  //   await until(async () => (await getLatestMessage()).sender === "@bot:localhost", 500, 10, "Bot did not reply.");
  //   const botMessage = await getLatestMessage();
  //   expect(botMessage.body).toEqual("The faucet has 10000 UNITs remaining.");
  // });
  //
  // test("The bots drips to a given address", async () => {
  //   expect((await getUserBalance()).eqn(0)).toBeTruthy();
  //
  //   await postMessage(`!drip ${userAddress}`);
  //
  //   await until(async () => (await getLatestMessage()).sender === "@bot:localhost", 500, 10, "Bot did not reply.");
  //   const botMessage = await getLatestMessage();
  //   expect(botMessage.body).toContain("Sent @user:localhost 10 UNITs.");
  //   await until(async () => (await getUserBalance()).gtn(0), 500, 15, "balance did not increase.");
  // });
});
