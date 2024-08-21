import "reflect-metadata";
// @ts-expect-error temporary module to inspect OOMs
import nodeOomHeapdump from "node-oom-heapdump";

import { startBot } from "./bot/index";
import { AppDataSource } from "./db/dataSource";
import polkadotActions from "./dripper/polkadot/PolkadotActions";
import { startServer } from "./server";

(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  nodeOomHeapdump({ path: "heapdump" });
  await AppDataSource.initialize();
  // Waiting for bot to start first.
  // Thus, listening to port on the server side can be treated as "ready" signal.
  await startBot();
  await polkadotActions.isReady;
  startServer();
})().catch((e) => {
  console.error("Start failed:", e);
  process.exit(1);
});
