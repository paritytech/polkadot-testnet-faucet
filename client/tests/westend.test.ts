import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Westend Relay Chain", id: -1 },
  { name: "Westmint", id: 1000 },
  { name: "Collectives", id: 1001 },
];

const tests = new FaucetTests({ faucetName: "Westend Faucet", chains, url: "/westend", expectTransactionLink: true });
tests.runTests();
