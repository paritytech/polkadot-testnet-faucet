import "@polkadot/api-augment";
import { initialize } from "avail-js-sdk";

export const AvailApi = async () => await initialize("wss://rpc-goldberg.sandbox.avail.tools");
export default AvailApi;
