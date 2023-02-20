import { ApiPromise } from "@polkadot/api";
import { HttpProvider } from "@polkadot/rpc-provider";
import axios, { AxiosInstance } from "axios";
import { until } from "opstooling-js";
import { GenericContainer, DockerComposeEnvironment, TestContainers, Network } from "testcontainers";
import path from "path";
import { Wait } from "testcontainers";
import { BotConfigSpec, ServerConfigSpec } from "./faucetConfig";

describe("Faucet E2E", () => {
  const userAddress = "1useDmpdQRgaCmkmLFihuw1Q4tXTfNKaeJ6iPaMLcyqdkoS"; // Random address.
  let polkadotApi: ApiPromise;
  let matrix: AxiosInstance;
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
    const roomId = result.data.room_id;
    await matrix.post(`/_matrix/client/v3/rooms/${roomId}/invite?access_token=${adminAccessToken}`, {
      "user_id": "@bot:localhost"
    });
    await matrix.post(`/_matrix/client/v3/rooms/${roomId}/invite?access_token=${adminAccessToken}`, {
      "user_id": "@user:localhost"
    });
    return roomId;
  };

  const postMessage = async (body: string) => {
    await matrix.post(`/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${userAccessToken}`, {
      msgtype: "m.text",
      body
    });
  };

  const getLatestMessage = async (): Promise<{ sender: string; body: string }> => {
    const latestMessage = await matrix.get(
      `/_matrix/client/v3/rooms/${roomId}/messages?dir=b&limit=1&access_token=${userAccessToken}`
    );
    const chunk = latestMessage.data.chunk[0];
    return { sender: chunk.sender, body: chunk.content.body };
  };

  const getUserBalance = async () => {
    const { data } = await polkadotApi.query.system.account(userAddress);
    return data.free.toBn();
  };

  beforeAll(async () => {
    const infrastructure = await new DockerComposeEnvironment(path.resolve(__dirname, "../e2e"), "docker-compose.yml")
      .withWaitStrategy("e2e-polkadot", Wait.forLogMessage("Running JSON-RPC HTTP server"))
      .withWaitStrategy("e2e-matrix", Wait.forLogMessage("Setting up server"))
      .up();

    const matrixContainer = infrastructure.getContainer("e2e-matrix");
    const polkadotContainer = infrastructure.getContainer("e2e-polkadot");

    // Expose Matrix and Polkadot ports from host to the containers so that the bot&server containers can connect.
    await TestContainers.exposeHostPorts(matrixContainer.getMappedPort(8008), polkadotContainer.getMappedPort(9933));

    await matrixContainer.exec(["e2e-matrix", "register_new_matrix_user", "--user", "admin", "--password", "admin", "-c", "/data/homeserver.yaml", "--admin"]);
    await matrixContainer.exec(["e2e-matrix", "register_new_matrix_user", "--user", "bot", "--password", "bot", "-c", "/data/homeserver.yaml", "--admin"]);
    await matrixContainer.exec(["e2e-matrix", "register_new_matrix_user", "--user", "user", "--password", "user", "-c", "/data/homeserver.yaml", "--admin"]);
    matrix = axios.create({ baseURL: `http://localhost:${matrixContainer.getMappedPort(8008)}` });

    polkadotApi = new ApiPromise({
      provider: new HttpProvider(`http://localhost:${polkadotContainer.getMappedPort(9933)}`),
      types: { Address: "AccountId", LookupSource: "AccountId" }
    });

    const faucetBotNetwork = await new Network().start();

    const serverImage = await GenericContainer.fromDockerfile(path.resolve(__dirname, ".."), "server_injected.Dockerfile")
      .build();

    const serverEnv: Record<string, string> = {
      SMF_BACKEND_FAUCET_ACCOUNT_MNEMONIC: "//Alice",
      SMF_BACKEND_FAUCET_BALANCE_CAP: "100",
      SMF_BACKEND_INJECTED_TYPES: "{ \"Address\": \"AccountId\", \"LookupSource\": \"AccountId\" }",
      SMF_BACKEND_NETWORK_DECIMALS: "12",
      SMF_BACKEND_PORT: "5555",
      // SMF_BACKEND_RPC_ENDPOINT: `http://host.testcontainers.internal:${polkadotContainer.getMappedPort(9933)}/`,
      SMF_BACKEND_RPC_ENDPOINT: `http://host.testcontainers.internal:9933}/`,
      SMF_BACKEND_DEPLOYED_REF: "local",
      SMF_BACKEND_DEPLOYED_TIME: "local"
    };

    const serverContainer = await serverImage
      .withEnvironment(serverEnv)
      .withNetwork(faucetBotNetwork)
      .withExposedPorts()
      .withWaitStrategy(Wait.forLogMessage("✅ server config validated"))
      .start();

    const botImage = await GenericContainer.fromDockerfile(path.resolve(__dirname, ".."), "bot_injected.Dockerfile")
      .build();

    const botEnv: Record<string, string> = {
      SMF_BOT_BACKEND_URL: `http://faucet-server:${Number(serverEnv.SMF_BACKEND_PORT)}`, // Connected because it's the same docker-compose.yml.
      SMF_BOT_DRIP_AMOUNT: "10",
      SMF_BOT_MATRIX_ACCESS_TOKEN: botAccessToken,
      SMF_BOT_MATRIX_BOT_USER_ID: "@bot:localhost",
      SMF_BOT_NETWORK_DECIMALS: "12",
      SMF_BOT_NETWORK_UNIT: "UNIT",
      SMF_BOT_FAUCET_IGNORE_LIST: "",
      // SMF_BOT_MATRIX_SERVER: `http://host.testcontainers.internal:${matrixContainer.getMappedPort(8008)}`,
      SMF_BOT_MATRIX_SERVER: `http://host.testcontainers.internal:8008}`,
      SMF_BOT_DEPLOYED_REF: "local",
      SMF_BOT_DEPLOYED_TIME: "local"
    };

    const botContainer = await botImage
      .withEnvironment(botEnv)
      .withNetwork(faucetBotNetwork)
      .withWaitStrategy(Wait.forLogMessage("✅ bot config validated"))
      .start();

    adminAccessToken = await login("admin", "admin");
    botAccessToken = await login("bot", "bot");
    userAccessToken = await login("user", "user");
    roomId = await prepareRoom()
    await polkadotApi.isReady
  }, 600_000);

  afterAll(async () => {
    // TODO: stop the containers and remove the network
  })

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
