import { FaucetTests } from "./faucet.js";

  const chains = [
    { name: "Westend Relay", id: 0 },
    { name: "AssetHub", id: -1 },
    { name: "Collectives", id: 1001 },
    { name: "BridgeHub", id: 1002 },
    { name: "People", id: 1004 },
    { name: "Coretime", id: 1005 },
  ];

const tests = new FaucetTests({
  faucetName: "Westend Faucet",
  chains,
  url: "/westend",
  expectTransactionLink: true,
  teleportEnabled: true,
});

tests.runTests();
