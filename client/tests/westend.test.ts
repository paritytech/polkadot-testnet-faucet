import { FaucetTests } from "./faucet.js";

const chains = [{ name: "Westend", id: -1 }];

const tests = new FaucetTests({
  faucetName: "Westend Faucet",
  chains,
  url: "/westend",
  expectTransactionLink: true,
  teleportEnabled: false,
});

tests.runTests();
