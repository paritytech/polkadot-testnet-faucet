import "@polkadot/api-augment";
import { initialize } from "avail-js-sdk";

// const networkName = config.Get("NETWORK");
// const networkData = getNetworkData(networkName);

// const provider = new WsProvider(networkData.rpcEndpoint);
// const polkadotApi = new ApiPromise({ provider });
export const AvailApi = async () => {
  console.log("creating new API instance");
  return await initialize("ws://127.0.0.1:9944");
};
export default AvailApi;
