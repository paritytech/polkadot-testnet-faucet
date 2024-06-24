import { FaucetTests } from "./faucet.js";

const chains = [{ name: "Paseo Relay", id: -1 }];

const tests = new FaucetTests({ faucetName: "Paseo Faucet", chains, url: "/", expectTransactionLink: false });
tests.runTests();
