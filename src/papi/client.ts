import { config } from "#src/config";
import fs from "fs";
import { createClient, PolkadotClient } from "polkadot-api";
import { withLogsRecorder } from "polkadot-api/logs-provider";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider, JsonRpcProvider } from "polkadot-api/ws-provider/node";

import { getNetworkData } from "./chains";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

let provider: JsonRpcProvider = getWsProvider(networkData.data.rpcEndpoint);

// Sync appends aren't ideal, but otherwise, we wouldn't be able to export client,
// without wrapping it in a promise. For debug, good enough.
fs.writeFileSync("papi-debug-inner.log", "");
fs.writeFileSync("papi-debug-outer.log", "");

provider = withLogsRecorder((msg) => {
  fs.appendFileSync("papi-debug-inner.log", `${msg}\n`);
}, provider);

provider = withLogsRecorder((msg) => {
  fs.appendFileSync("papi-debug-outer.log", `${msg}\n`);
}, withPolkadotSdkCompat(provider));

export const client: PolkadotClient = createClient(provider);
