// TODO: merge this with networkData.ts from client/

export interface ChainData {
  name: string;
  id: number;
}

export interface NetworkData {
  networkName: string;
  currency: string;
  chains: ChainData[];
  explorer: string | null;
  rpcEndpoint: string;
  decimals: number;
  dripAmount: string;
  balanceCap: number;
  matrixWhitelistPatterns: RegExp[];
}

// the server connects to a locally running Frequency chain.
const localhost: NetworkData = {
  balanceCap: 1000,
  chains: [{ name: "Localhost", id: 1000 }],
  currency: "UNIT",
  decimals: 8,
  dripAmount: "10",
  explorer: "",
  networkName: "Localhost",
  rpcEndpoint: "ws://127.0.0.1:9944",
  matrixWhitelistPatterns: [],
};

// the server connects to the specified Frequency Paseo RPC endpoint
const frequencyPaseo: NetworkData = {
  balanceCap: 1000,
  chains: [{ name: "Frequency Paseo Testnet", id: -1 }],
  currency: "XRQCY",
  decimals: 8,
  dripAmount: "5000",
  explorer: null,
  networkName: "Frequency Paseo Testnet",
  rpcEndpoint: "wss://0.rpc.testnet.amplica.io",
  matrixWhitelistPatterns: [],
};

// the server connects to a Polkadot Paseo testnet RPC endpoint
const paseo: NetworkData = {
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

export const networks: Record<string, NetworkData> = {
  paseo,
  frequencyPaseo,
  localhost,
};

export function getNetworkData(networkName: string): NetworkData {
  if (!Object.keys(networks).includes(networkName)) {
    throw new Error(
      `Unknown NETWORK in env: ${networkName}; valid networks are: [${Object.keys(networks).join(", ")}]`,
    );
  }
  // networkName value is valdated one line before, safe to use as index
  // eslint-disable-next-line security/detect-object-injection
  return networks[networkName] as NetworkData;
}
