import { config } from "#src/config";
import fs from "fs";
import { createClient, PolkadotClient } from "polkadot-api";
import { withLogsRecorder } from "polkadot-api/logs-provider";
import { JsonRpcProvider, WebSocketProvider } from "polkadot-api/ws-provider/node";

import { getNetworkData } from "./chains";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

let provider: JsonRpcProvider = WebSocketProvider(networkData.data.rpcEndpoint);

if (process.env.PAPI_DEBUG) {
  // Sync appends aren't ideal, but otherwise, we wouldn't be able to export client,
  // without wrapping it in a promise. For debug, good enough.
  fs.writeFileSync("papi-debug.log", "");
  provider = withLogsRecorder((msg) => {
    fs.appendFileSync("papi-debug.log", `${msg}\n`);
  }, provider);
}

export const client: PolkadotClient = createClient(provider);
