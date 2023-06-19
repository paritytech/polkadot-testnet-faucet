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
}

const rococo: NetworkData = {
  balanceCap: 100,
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
};

const wococo: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "WOOK",
  decimals: 12,
  dripAmount: "10",
  explorer: null,
  networkName: "Wococo",
  rpcEndpoint: "wss://wococo-rpc-node-0.parity-testnet.parity.io/",
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
  dripAmount: "1",
  explorer: "https://westend.subscan.io",
  networkName: "Westend",
  rpcEndpoint: "wss://westend-rpc.polkadot.io/",
};

const versi: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "VRS",
  decimals: 12,
  dripAmount: "100",
  explorer: null,
  networkName: "Versi",
  rpcEndpoint: "wss://versi-rpc-node-0.parity-versi.parity.io/",
};

const e2e: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "UNIT",
  decimals: 12,
  dripAmount: "10",
  explorer: "",
  networkName: "Rococo",
  rpcEndpoint: "ws://host.docker.internal:9933/",
};

export const networks: Record<string, NetworkData> = { rococo, versi, westend, wococo, e2e };

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
