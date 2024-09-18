import "reflect-metadata";
import { runtimeRestarter } from "@eng-automation/js";

import { startBot } from "./bot";
import { AppDataSource } from "./db/dataSource";
import polkadotActions from "./dripper/polkadot/PolkadotActions";
import polkadotApi from "./dripper/polkadot/polkadotApi";
import { logger } from "./logger";
import { startServer } from "./server";

(async () => {
  await AppDataSource.initialize();
  // Waiting for bot to start first.
  // Thus, listening to port on the server side can be treated as "ready" signal.
  await startBot();
  await polkadotActions.isReady;
  void runtimeRestarter({
    metadata: {
      getMetadataVersion: async () => (await polkadotApi.rpc.state.getMetadata()).version.toString(),
      onMetadataChange: () => process.exit(0),
    },
    runtime: {
      getRuntimeVersionHash: async () => (await polkadotApi.rpc.state.getRuntimeVersion()).hash.toString(),
      onRuntimeChange: () => process.exit(0),
    },
    log: logger.info,
  });
  startServer();
})().catch((e) => {
  console.error("Start failed:", e);
  process.exit(1);
});
