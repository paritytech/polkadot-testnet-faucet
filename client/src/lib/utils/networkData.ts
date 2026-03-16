import { base } from "$app/paths";
import { PUBLIC_FAUCET_URL } from "$env/static/public";
import { AccountId, getSs58AddressInfo } from "polkadot-api";

/** Re-encode an SS58 address to a specific network prefix */
export function toNetworkAddress(address: string, prefix: number): string {
  const info = getSs58AddressInfo(address);
  if (!info.isValid) return address;
  if (info.ss58Format === prefix) return address;
  return AccountId(prefix).dec(info.publicKey);
}

export interface ChainData {
  name: string;
  id: number;
}

function faucetUrl(defaultUrl: string): string {
  if (PUBLIC_FAUCET_URL !== "") {
    return PUBLIC_FAUCET_URL;
  }

  return defaultUrl;
}

export interface NetworkData {
  faucetTitle: string;
  dropdownTitle: string;
  networkName: string;
  currency: string;
  dripAmount: string;
  chains: ChainData[];
  endpoint: string;
  explorer: string | null;
  teleportEnabled: boolean;
  genesis: `0x${string}`;
  decimals: number;
  balanceCap: number;
  ss58Prefix: number;
}

export const Westend: NetworkData = {
  faucetTitle: "Westend Faucet",
  dropdownTitle: "Westend",
  networkName: "Westend",
  currency: "WND",
  dripAmount: "10",
  chains: [
    { name: "Hub (smart contracts)", id: -1 },
    { name: "Westend Relay", id: 0 },
    { name: "Collectives", id: 1001 },
    { name: "BridgeHub", id: 1002 },
    { name: "People", id: 1004 },
    { name: "Coretime", id: 1005 },
  ],
  endpoint: faucetUrl("https://westend-faucet.polkadot.io/drip/web"),
  explorer: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fwestend-asset-hub-rpc.polkadot.io#/explorer/query",
  teleportEnabled: true,
  genesis: "0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9",
  decimals: 12,
  balanceCap: 100,
  ss58Prefix: 42,
};

export const Paseo: NetworkData = {
  faucetTitle: "Testnet Faucet",
  dropdownTitle: "Polkadot testnet (Paseo)",
  networkName: "Paseo",
  currency: "PAS",
  dripAmount: "5000",
  chains: [
    { name: "Hub (smart contracts)", id: -1 },
    { name: "Paseo Relay", id: 0 },
    { name: "BridgeHub", id: 1002 },
    { name: "People", id: 1004 },
    { name: "Coretime", id: 1005 },
  ],
  endpoint: faucetUrl("https://paseo-faucet.parity-testnet.parity.io/drip/web"),
  explorer: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fasset-hub-paseo-rpc.n.dwellir.com#/explorer/query",
  teleportEnabled: true,
  genesis: "0xd6eec26135305a8ad257a20d003357284c8aa03d0bdb2b357ab0a22371e11ef2",
  decimals: 10,
  balanceCap: 5500,
  ss58Prefix: 0,
};

export const Networks: { network: NetworkData; url: string }[] = [
  { network: Paseo, url: (base as string) || "/" },
  { network: Westend, url: `${base as string}/westend` },
];

export function getChainName(network: NetworkData, id: number): string | null {
  const index = network.chains.findIndex((ch) => ch.id === id);
  if (index < 0) {
    return null;
  }
  return network.chains[index].name;
}
