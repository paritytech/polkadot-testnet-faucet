import { FaucetTests } from "./faucet.js";

const chains = [{ name: "Trappist Parachain", id: -1 }];

const tests = new FaucetTests({
  faucetName: "Trappist Faucet",
  chains,
  url: "/trappist",
  expectTransactionLink: false,
});
tests.runTests();
