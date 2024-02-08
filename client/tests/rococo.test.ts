import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Rococo Relay", id: -1 },
  { name: "AssetHub", id: 1000 },
  { name: "Contracts", id: 1002 },
  { name: "Encointer Lietaer", id: 1003 },
  { name: "Coretime", id: 1005 },
  { name: "Bridgehub", id: 1013 },
];

const tests = new FaucetTests({ faucetName: "Rococo Faucet", chains, url: "/", expectTransactionLink: true });
tests.runTests();
