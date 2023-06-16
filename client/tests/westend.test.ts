import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Westend Relay Chain", id: -1 },
  { name: "Westmint", id: 1000 },
  { name: "Collectives", id: 1001 },
];

const tests = new FaucetTests("/westend", "PUBLIC_FAUCET_WESTEND_URL", "Westend Faucet", chains);
tests.runTests();
