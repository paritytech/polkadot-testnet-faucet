import { FaucetTests } from "./faucet.js";

const chains = [{ name: "Frequency Paseo Testnet", id: -1 }];

const tests = new FaucetTests({
	faucetName: "Frequency Faucet",
	chains,
	url: "/",
	expectTransactionLink: false
});
tests.runTests();
