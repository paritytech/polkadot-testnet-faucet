import "@polkadot/api-augment";
import { ApiPromise } from "@polkadot/api";
import { WsProvider } from "@polkadot/rpc-provider";

import { config } from "../../config";
import { getNetworkData } from "../../networkData";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const provider = new WsProvider(networkData.rpcEndpoint);
const polkadotApi = new ApiPromise({ provider });

export default polkadotApi;
