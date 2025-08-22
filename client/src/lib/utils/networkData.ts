import { base } from "$app/paths";
import { PUBLIC_FAUCET_URL } from "$env/static/public";

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
  networkName: string;
  currency: string;
  chains: ChainData[];
  endpoint: string;
  explorer: string | null;
  teleportEnabled: boolean;
}

export const Westend: NetworkData = {
  networkName: "Westend",
  currency: "WND",
  chains: [
    { name: "Westend Relay", id: 0 },
    { name: "AssetHub", id: -1 },
    { name: "Collectives", id: 1001 },
    { name: "BridgeHub", id: 1002 },
    { name: "People", id: 1004 },
    { name: "Coretime", id: 1005 },
  ],
  endpoint: faucetUrl("https://westend-faucet.polkadot.io/drip/web"),
  explorer: "https://assethub-westend.subscan.io",
  teleportEnabled: true,
};

export const Paseo: NetworkData = {
  networkName: "Paseo",
  currency: "PAS",
  chains: [
    { name: "Paseo Relay", id: 0 },
    { name: "AssetHub", id: -1 },
    { name: "Passet Hub: smart contracts", id: 1111 },
    { name: "BridgeHub", id: 1002 },
    { name: "People", id: 1004 },
    { name: "Coretime", id: 1005 },
  ],
  endpoint: faucetUrl("https://paseo-faucet.parity-testnet.parity.io/drip/web"),
  explorer: null,
  teleportEnabled: true,
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
