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
}

export const Rococo: NetworkData = {
  networkName: "Rococo",
  currency: "ROC",
  chains: [
    { name: "Rococo Relay Chain", id: -1 },
    { name: "Rockmine", id: 1000 },
    { name: "Contracts", id: 1002 },
    { name: "Encointer Lietaer", id: 1003 },
    { name: "Bridgehub", id: 1013 },
  ],
  endpoint: faucetUrl("https://rococo-faucet.parity-testnet.parity.io/drip/web"),
  explorer: "https://rococo.subscan.io",
};

export const Westend: NetworkData = {
  networkName: "Westend",
  currency: "WND",
  chains: [
    { name: "Westend Relay Chain", id: -1 },
    { name: "Westmint", id: 1000 },
    { name: "Collectives", id: 1001 },
  ],
  endpoint: faucetUrl("https://westend-faucet.polkadot.io/drip/web"),
  explorer: "https://westend.subscan.io",
};

export const Trappist: NetworkData = {
  networkName: "Trappist",
  currency: "HOP",
  chains: [{ name: "Trappist rococo parachain", id: -1 }],
  endpoint: faucetUrl("https://trappist-faucet.polkadot.io/drip/web"),
  explorer: null,
};

export const Networks: { network: NetworkData; url: string }[] = [
  { network: Rococo, url: (base as string) || "/" },
  { network: Westend, url: `${base as string}/westend` },
  { network: Trappist, url: `${base as string}/trappist` },
];

export function getChainName(network: NetworkData, id: number): string | null {
  const index = network.chains.findIndex((ch) => ch.id === id);
  if (index < 0) {
    return null;
  }
  return network.chains[index].name;
}
