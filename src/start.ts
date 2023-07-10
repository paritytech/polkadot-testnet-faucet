import { startBot } from "./bot";
import polkadotActions from "./dripper/polkadot/PolkadotActions";
import { startServer } from "./server";

(async () => {
  // Waiting for bot to start first.
  // Thus, listening to port on the server side can be treated as "ready" signal.
  await startBot();
  await polkadotActions.isReady;
  startServer();
})().catch((e) => {
  console.error("Start failed:", e);
  process.exit(1);
});
