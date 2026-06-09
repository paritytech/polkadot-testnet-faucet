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
  /** Para id of the faucet's home chain (Asset Hub). A drip to this id is a local transfer, not a teleport. */
  hubChainId: number;
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
  hubChainId: 1000,
  chains: [
    { name: "Asset Hub", id: 1000 },
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
  hubChainId: 1000,
  chains: [
    { name: "Asset Hub", id: 1000 },
    { name: "Paseo Relay", id: 0 },
    { name: "BridgeHub", id: 1002 },
    { name: "People", id: 1004 },
    { name: "Coretime", id: 1005 },
    { name: "Asset Hub Next", id: 1500 },
    { name: "People Next", id: 1502 },
  ],
  endpoint: faucetUrl("https://paseo-faucet.parity-testnet.parity.io/drip/web"),
  explorer: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fasset-hub-paseo-rpc.n.dwellir.com#/explorer/query",
  teleportEnabled: true,
  genesis: "0xd6eec26135305a8ad257a20d003357284c8aa03d0bdb2b357ab0a22371e11ef2",
  decimals: 10,
  balanceCap: 5500,
  ss58Prefix: 0,
};

export const Summit: NetworkData = {
  faucetTitle: "Summit Faucet",
  dropdownTitle: "Summit",
  networkName: "Summit",
  currency: "SUM",
  dripAmount: "5000",
  hubChainId: 1500,
  chains: [
    { name: "Asset Hub", id: 1500 },
    { name: "Summit Relay", id: 0 },
    { name: "Bulletin", id: 1501 },
    { name: "People", id: 1502 },
  ],
  endpoint: faucetUrl("https://summit-faucet.parity-testnet.parity.io/drip/web"),
  explorer: null,
  teleportEnabled: true,
  genesis: "0xf388dc6d6cdf6fb77eac3c4a91f31bc0c8642b142f1a757512ab7849f9f70660",
  decimals: 10,
  balanceCap: 5500,
  ss58Prefix: 0,
};

export const Networks: { network: NetworkData; url: string }[] = [
  { network: Paseo, url: (base as string) || "/" },
  { network: Westend, url: `${base as string}/westend` },
  { network: Summit, url: `${base as string}/summit` },
];

export function getChainName(network: NetworkData, id: number): string | null {
  const index = network.chains.findIndex((ch) => ch.id === id);
  if (index < 0) {
    return null;
  }
  return network.chains[index].name;
}
