import { FaucetTests } from "./faucet.js";

const chains = [
  { name: "Hub (smart contracts)", id: -1 },
  { name: "Paseo Relay", id: 0 },
  { name: "BridgeHub", id: 1002 },
  { name: "People", id: 1004 },
  { name: "Coretime", id: 1005 },
];

const tests = new FaucetTests({
  faucetName: "Testnet Faucet",
  chains,
  url: "/",
  expectTransactionLink: false,
  teleportEnabled: true,
});
tests.runTests();
