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
  networkHeaderName: String;
  networkName: string;
  currency: string;
  chains: ChainData[];
  endpoint: string;
  explorer: string | null;
}

export const Avail: NetworkData = {
  networkHeaderName: "Avail",
  networkName: "Avail DA",
  currency: "AVL",
  chains: [{ name: "Goldberg", id: -1 }],
  endpoint: faucetUrl("https://faucet.avail.tools/drip/web"),
  explorer: "https://avail-testnet.subscan.io/",
};

export const Networks: { network: NetworkData; url: string }[] = [{ network: Avail, url: (base as string) || "/" }];

export function getChainName(network: NetworkData, id: number): string | null {
  const index = network.chains.findIndex((ch) => ch.id === id);
  if (index < 0) {
    return null;
  }
  return network.chains[index].name;
}
