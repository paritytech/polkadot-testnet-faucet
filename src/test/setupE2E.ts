import {
  GenericContainer,
  Wait,
  StartedTestContainer
} from "testcontainers";

import path from "path";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { createRoom, getAccessToken, inviteUser, joinRoom } from "./matrixHelpers";
import { Readable } from "stream";
import { DataSource } from "typeorm";
import { Drip } from "src/db/entity/Drip";
import { migrations } from "src/db/migration/migrations";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export type E2ESetup = {
  matrixContainer: StartedTestContainer;
  dbContainer: StartedTestContainer;
  appContainer: StartedTestContainer;
  matrixSetup: MatrixSetup;
  webEndpoint: string;
}

export type MatrixSetup = {
  botAccessToken: string,
  userAccessToken: string,
  roomId: string;
  matrixUrl: string;
  matrixPort: number;
};

let dataSourceOptions: PostgresConnectionOptions;
let AppDataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (AppDataSource !== null) return AppDataSource;

  AppDataSource = new DataSource(dataSourceOptions);
  await AppDataSource.initialize();
  return AppDataSource;
}

export async function destroyDataSource(): Promise<void> {
  if (AppDataSource === null) return;

  await AppDataSource.destroy();
}

const containterLogsDir = path.join(process.cwd(), "e2e", "containter_logs");
const start = Date.now();

// Taking all output to e2e/*.container.log
function logConsumer(name: string): (stream: Readable) => Promise<void> {
  return async (stream: Readable) => {
    const logsfile = await fs.open(path.join(containterLogsDir, `${name}.log`), "w");
    stream.on("data", line => logsfile.write(`[${Date.now() - start}ms] ${line}`));
    stream.on("err", line => logsfile.write(`[${Date.now() - start}ms] ${line}`));
    stream.on("end", () => {
      logsfile.write("Stream closed\n");
      logsfile.close();
    });
  };
}

export async function setup(): Promise<E2ESetup> {
  await fs.mkdir(containterLogsDir, { recursive: true });

  // doing matrix and db setups in parallel
  const matrixContainerPromise = setupMatrixContainer();
  const matrixSetupPromise = matrixContainerPromise.then(matrixContainer => setupMatrix(matrixContainer));
  matrixContainerPromise.then(() => console.log("Matrix container: up"));
  matrixSetupPromise.then(() => console.log("Matrix setup: is done"));

  const dbContainerPromise = setupDBContainer();
  const dbSetupPromise = dbContainerPromise.then(dbContainer => setupDb(dbContainer));
  dbContainerPromise.then(() => console.log("DB container: up"));
  dbSetupPromise.then(() => console.log("DB setup: done"));

  const [matrixContainer, matrixSetup, dbContainer] = await Promise.all([
    matrixContainerPromise,
    matrixSetupPromise,
    dbContainerPromise,
    dbSetupPromise
  ]);

  const appContainer = await setupAppContainer({
    botAccessToken: matrixSetup.botAccessToken,
    matrixPort: matrixSetup.matrixPort,
    dbPort: dbContainer.getFirstMappedPort()
  });

  console.log("App container is up");

  const webEndpoint = `http://localhost:${appContainer.getFirstMappedPort()}`;

  return {
    matrixContainer,
    dbContainer,
    appContainer,
    matrixSetup,
    webEndpoint
  };
}

export async function teardown(setup: E2ESetup): Promise<void> {
  await setup.appContainer.stop();
  await setup.dbContainer.stop();
  await setup.matrixContainer.stop();
}

async function setupMatrixContainer(): Promise<StartedTestContainer> {
  const image = await GenericContainer.fromDockerfile("e2e", "matrix_container.Dockerfile").build();

  const matrixContainer = image
    .withExposedPorts(8008)
    .withEnvironment({
      SYNAPSE_SERVER_NAME: "parity.io",
      SYNAPSE_REPORT_STATS: "no"
    })
    .withCommand(["run"])
    .withWaitStrategy(Wait.forHealthCheck())
    .withLogConsumer(logConsumer("faucet-test-matrix"))
    .start();

  return matrixContainer;
}

async function setupMatrix(matrixContainer: StartedTestContainer): Promise<MatrixSetup> {
  // Generate users:
  // one admin to create rooms, one faucet bot, one user that will be requesting funds.
  await matrixContainer.exec(["register_new_matrix_user", "--user", "admin", "--password", "admin", "-c", "/data/homeserver.yaml", "--admin"]);
  await matrixContainer.exec(["register_new_matrix_user", "--user", "bot", "--password", "bot", "-c", "/data/homeserver.yaml", "--no-admin"]);
  await matrixContainer.exec(["register_new_matrix_user", "--user", "user", "--password", "user", "-c", "/data/homeserver.yaml", "--no-admin"]);

  const matrixPort = matrixContainer.getFirstMappedPort();
  const matrixUrl = `http://localhost:${matrixPort}`;

  // Retrieve access tokens (by logging in).
  const adminAccessToken = await getAccessToken(matrixUrl, { user: "admin", password: "admin" });
  const botAccessToken = await getAccessToken(matrixUrl, { user: "bot", password: "bot" });
  const userAccessToken = await getAccessToken(matrixUrl, { user: "user", password: "user" });

  // Create the faucet room and invite interested parties.
  const roomId = await createRoom(matrixUrl, { roomAliasName: "faucet", accessToken: adminAccessToken });

  await inviteUser(matrixUrl, { roomId, userId: "@bot:parity.io", accessToken: adminAccessToken });
  await inviteUser(matrixUrl, { roomId, userId: "@user:parity.io", accessToken: adminAccessToken });

  await joinRoom(matrixUrl, { roomId, accessToken: botAccessToken });
  await joinRoom(matrixUrl, { roomId, accessToken: userAccessToken });

  return { botAccessToken, userAccessToken, roomId, matrixUrl, matrixPort };
}

async function setupDBContainer(): Promise<StartedTestContainer> {
  return await new GenericContainer("bitnami/postgresql:15")
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRESQL_PASSWORD: "postgres",
      POSTGRESQL_DATABASE: "faucet",
      POSTGRESQL_EXTRA_FLAGS: "-c log_statement=all"
    })
    .withWaitStrategy(Wait.forListeningPorts())
    .withLogConsumer(logConsumer("faucet-test-db"))
    .start();
}

async function setupDb(dbContainer: StartedTestContainer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    exec("yarn migrations:run", {
      env: {
        ...process.env,
        SMF_CONFIG_DB_HOST: "localhost",
        SMF_CONFIG_DB_PORT: String(dbContainer.getFirstMappedPort()),
        SMF_CONFIG_DB_USERNAME: "postgres",
        SMF_CONFIG_DB_PASSWORD: "postgres",
        SMF_CONFIG_DB_DATABASE_NAME: "faucet"
      }
    }, (err) => {
      err === null ? resolve() : reject(err);
    });
  });

  dataSourceOptions = {
    type: "postgres",
    host: "localhost",
    port: dbContainer.getFirstMappedPort(),
    username: "postgres",
    password: "postgres",
    database: "faucet",
    synchronize: false,
    logging: ["error", "warn"],
    entities: [Drip],
    subscribers: [],
    migrations
  };

  void await getDataSource();
}

async function setupAppContainer(params: {
  botAccessToken: string,
  matrixPort: number,
  dbPort: number
}): Promise<StartedTestContainer> {
  const appContainer = new GenericContainer("polkadot-testnet-faucet")
    .withExposedPorts(5555)
    .withEnvironment({
      SMF_CONFIG_NETWORK: "e2e",

      SMF_CONFIG_MATRIX_ACCESS_TOKEN: params.botAccessToken,
      SMF_CONFIG_MATRIX_BOT_USER_ID: "@bot:parity.io",
      SMF_CONFIG_FAUCET_IGNORE_LIST: "",
      SMF_CONFIG_MATRIX_SERVER: `http://host.docker.internal:${params.matrixPort}`,
      SMF_CONFIG_DEPLOYED_REF: "local",
      SMF_CONFIG_FAUCET_ACCOUNT_MNEMONIC: "//Alice",
      SMF_CONFIG_PORT: "5555",

      SMF_CONFIG_DB_HOST: "host.docker.internal",
      SMF_CONFIG_DB_PORT: String(params.dbPort),
      SMF_CONFIG_DB_USERNAME: "postgres",
      SMF_CONFIG_DB_PASSWORD: "postgres",
      SMF_CONFIG_DB_DATABASE_NAME: "faucet",

      // Public testing secret, will accept all tokens.
      SMF_CONFIG_RECAPTCHA_SECRET: "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
    })
    .withWaitStrategy(Wait.forListeningPorts())
    .withExtraHosts([{ host: "host.docker.internal", ipAddress: "host-gateway" }])
    .withLogConsumer(logConsumer("faucet-test-app"));

  return await appContainer.start();
}
