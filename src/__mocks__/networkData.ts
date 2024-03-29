// eslint-disable-next-line unused-imports/no-unused-vars-ts
export const getNetworkData = jest.fn((networkName: string) => {
  if (process.env.SMF_CONFIG_NETWORK == "paseo") {
    return {
      balanceCap: 500,
      chains: [],
      currency: "PAS",
      decimals: 10,
      dripAmount: "100",
      explorer: null,
      networkName: "Paseo",
      rpcEndpoint: "wss://paseo.rpc.amforc.com/",
      matrixWhitelistPatterns: [
        /^@erin:parity\.io$/,
        /^@mak:parity\.io$/,
        /^@alexbird:parity\.io$/,
        /^@pierre:parity\.io$/,
        /^@hectorest06:matrix\.org$/,
        /^@tbaut:matrix\.org$/,
        /^@al3mart:matrix\.org$/,
        /^@purpletentacle:matrix\.org$/,
        /^@carlosala:matrix\.org$/,
      ],
    };
  } else {
    return {
      balanceCap: 1000,
      chains: [
        { name: "Rococo Relay Chain", id: -1 },
        { name: "Rockmine", id: 1000 },
        { name: "Contracts", id: 1002 },
        { name: "Encointer Lietaer", id: 1003 },
        { name: "Bridgehub", id: 1013 },
      ],
      currency: "ROC",
      decimals: 12,
      dripAmount: "100",
      explorer: "https://rococo.subscan.io",
      networkName: "Rococo",
      rpcEndpoint: "wss://rococo-rpc.polkadot.io/",
      matrixWhitelistPatterns: [/^.*:parity.io$/, /^.*:web3.foundation$/],
    };
  }
});
