import "reflect-metadata";
import { config } from "#src/config";
import { logger } from "#src/logger";
import { getNetworkData } from "#src/papi/index";

import { startBot } from "./bot/index.js";
import { AppDataSource } from "./db/dataSource.js";
import polkadotActions from "./dripper/polkadot/PolkadotActions.js";
import { startServer } from "./server/index.js";

// How long to wait for the first successful chain interaction (faucet balance
// fetch) before giving up. A healthy RPC answers in a couple of seconds; if this
// elapses the endpoint is almost certainly down or incompatible.
//
// Kept below the k8s probes' initialDelaySeconds (60s in the substrate-faucet
// chart) so this descriptive error is logged and the process exits on its own
// terms *before* the liveness/readiness probes start restarting the pod.
const CHAIN_READY_TIMEOUT_MS = 45_000;

(async () => {
  await AppDataSource.initialize();
  // Waiting for bot to start first.
  // Thus, listening to port on the server side can be treated as "ready" signal.
  await startBot();

  const networkName = config.Get("NETWORK");
  const { rpcEndpoint } = getNetworkData(networkName).data;
  logger.info(`⏳ Connecting to chain "${networkName}" via ${rpcEndpoint} …`);

  let readyTimer: ReturnType<typeof setTimeout>;
  const readyTimeout = new Promise<never>((_, reject) => {
    readyTimer = setTimeout(() => {
      reject(
        new Error(
          `RPC connection timed out after ${CHAIN_READY_TIMEOUT_MS / 1000}s: could not fetch the faucet ` +
            `balance from "${rpcEndpoint}" (network "${networkName}"). The endpoint is likely down or ` +
            `incompatible with the Polkadot API. Check the rpcEndpoint in src/papi/chains/${networkName}.ts ` +
            `and SMF_CONFIG_NETWORK.`,
        ),
      );
    }, CHAIN_READY_TIMEOUT_MS);
  });

  try {
    await Promise.race([polkadotActions.isReady, readyTimeout]);
  } finally {
    clearTimeout(readyTimer!);
  }
  logger.info(`✅ Chain connection established (${networkName})`);

  startServer();
})().catch((e) => {
  logger.error("💥 Faucet failed to start:", e);
  process.exit(1);
});
