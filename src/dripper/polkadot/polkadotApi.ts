import "@polkadot/api-augment";
import { initialize } from "avail-js-sdk";

export const AvailApi = async () => await initialize("ws://127.0.0.1:9944");
export default AvailApi;
