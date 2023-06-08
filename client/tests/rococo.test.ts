import { FaucetTests } from "./faucet.js";

const chains = [
	{ name: "Relay Chain", id: -1 },
	{ name: "Rockmine", id: 1000 },
	{ name: "Contracts", id: 1002 },
	{ name: "Encointer Lietaer", id: 1003 },
	{ name: "Bridgehub", id: 1013 }
];

const test = new FaucetTests("/", "PUBLIC_FAUCET_ROCOCO_URL", "Rococo Faucet", chains);
test.runTests();
