import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Paseo Relay", id: -1 },
  { name: "AssetHub", id: 1000 },
  { name: "Passet Hub: smart contracts", id: 1111 },
  { name: "BridgeHub", id: 1002 },
  { name: "People", id: 1004 },
  { name: "Coretime", id: 1005 },
];

const tests = new FaucetTests({
  faucetName: "Paseo Faucet",
  chains,
  url: "/",
  expectTransactionLink: false,
  teleportEnabled: true,
});
tests.runTests();
