import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Westend", id: -1 },
  { name: "Collectives", id: 1001 },
  { name: "BridgeHub", id: 1002 },
  { name: "People", id: 1004 },
];

const tests = new FaucetTests({ faucetName: "Westend Faucet", chains, url: "/westend", expectTransactionLink: true });
tests.runTests();
