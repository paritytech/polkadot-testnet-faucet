import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Paseo Relay", id: -1 },
  { name: "AssetHub", id: 1000 },
  { name: "Collectives", id: 1001 },
  { name: "BridgeHub", id: 1002 },
  { name: "People", id: 1004 },
];

const tests = new FaucetTests({ faucetName: "Paseo Faucet", chains, url: "/", expectTransactionLink: false });
tests.runTests();
