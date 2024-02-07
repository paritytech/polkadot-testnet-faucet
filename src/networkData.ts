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

const parityWhitelist = [/^.*:parity.io$/, /^.*:web3.foundation$/];

const rococo: NetworkData = {
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
  matrixWhitelistPatterns: parityWhitelist,
};

const westend: NetworkData = {
  balanceCap: 100,
  chains: [
    { name: "Westend Relay Chain", id: -1 },
    { name: "Westmint", id: 1000 },
    { name: "Collectives", id: 1001 },
  ],
  currency: "WND",
  decimals: 12,
  dripAmount: "10",
  explorer: "https://westend.subscan.io",
  networkName: "Westend",
  rpcEndpoint: "wss://westend-rpc.polkadot.io/",
  matrixWhitelistPatterns: parityWhitelist,
};

const versi: NetworkData = {
  balanceCap: 1000,
  chains: [],
  currency: "VRS",
  decimals: 12,
  dripAmount: "100",
  explorer: null,
  networkName: "Versi",
  rpcEndpoint: "wss://versi-rpc-node-0.parity-versi.parity.io/",
  matrixWhitelistPatterns: parityWhitelist,
};

const trappist: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "HOP",
  decimals: 12,
  dripAmount: "10",
  explorer: null,
  networkName: "Trappist",
  rpcEndpoint: "wss://rococo-trappist-rpc.polkadot.io/",
  matrixWhitelistPatterns: parityWhitelist,
};

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

const e2e: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "UNIT",
  decimals: 12,
  dripAmount: "10",
  explorer: null,
  networkName: "Rococo",
  rpcEndpoint: "ws://host.docker.internal:9933/",
  matrixWhitelistPatterns: parityWhitelist,
};

export const networks: Record<string, NetworkData> = { rococo, versi, westend, e2e, trappist, paseo };

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
