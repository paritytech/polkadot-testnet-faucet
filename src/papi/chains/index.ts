import { Binary, PolkadotClient } from "polkadot-api";

import e2e from "./e2e";
import paseo from "./paseo";
import versi from "./versi";
import westend from "./westend";

export interface ChainData {
  name: string;
  id: number;
}

export const networks: Record<string, { data: NetworkData; api: NetworkApi }> = {
  versi,
  westend,
  e2e,
  paseo,
};

export interface NetworkApi {
  getTeleportTx(params: {
    dripAmount: bigint;
    address: Binary;
    parachain_id: number;
    client: PolkadotClient;
    nonce: number;
  }): Promise<string>;

  getTransferTokensTx(params: {
    dripAmount: bigint;
    address: string;
    client: PolkadotClient;
    nonce: number;
  }): Promise<string>;

  getBalance(address: string, client: PolkadotClient): Promise<bigint>;

  watchBalance(address: string, client: PolkadotClient, callback: (value: bigint) => void): void;

  healthcheck(client: PolkadotClient): Promise<void>;

  getNonce(address: string, client: PolkadotClient): Promise<number>;
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
  // Should be 0xEE for all our currenly supported chains, but could be different for other chains
  ethToSS58FillPrefix: number;
}

export function getNetworkData(networkName: string): { data: NetworkData; api: NetworkApi } {
  // networkName value is valdated one line before, safe to use as index
  // eslint-disable-next-line security/detect-object-injection
  const network = networks[networkName];
  if (!network) {
    throw new Error(
      `Unknown NETWORK in env: ${networkName}; valid networks are: [${Object.keys(networks).join(", ")}]`,
    );
  }
  return network;
}
