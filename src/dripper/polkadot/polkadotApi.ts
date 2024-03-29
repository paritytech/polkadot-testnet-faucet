import "@polkadot/api-augment";
import { initialize } from "avail-js-sdk";

export const AvailApi = async () => {
  console.log("creating new API instance");
  return await initialize("ws://127.0.0.1:9944");
};
export default AvailApi;
