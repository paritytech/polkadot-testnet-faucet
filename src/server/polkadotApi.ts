import "@polkadot/api-augment";
import { ApiPromise } from "@polkadot/api";
import { HttpProvider } from "@polkadot/rpc-provider";

import { config } from "./config";

const rpcEndpointUrl = config.Get("RPC_ENDPOINT");
const injectedTypes = JSON.parse(config.Get("INJECTED_TYPES")) as Record<string, string>;

const provider = new HttpProvider(rpcEndpointUrl);
const types = injectedTypes;
const polkadotApi = new ApiPromise({ provider, types });

export default polkadotApi;
