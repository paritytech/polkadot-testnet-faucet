import { PUBLIC_FAUCET_URL } from "$env/static/public";

export interface ChainData {
	name: string;
	id: number;
	endpoint?: string;
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

export const Frequency: NetworkData = {
	networkName: "Frequency",
	currency: "XRQCY",
	chains: [{ name: "Frequency Paseo Testnet", id: -1 }],
	endpoint: faucetUrl("https://faucet-api-paseo.liberti.social/drip/web"),
	explorer: null
};

export const Paseo: NetworkData = {
	networkName: "Paseo",
	currency: "PAS",
	chains: [{ name: "Paseo Relay", id: -1 }],
	endpoint: faucetUrl("https://paseo-faucet.parity-testnet.parity.io/drip/web"),
	explorer: null
};

export const Networks: { network: NetworkData; url: string }[] = [
	{ network: Frequency, url: "/" },
	{ network: Paseo, url: "https://faucet.polkadot.io/paseo" }
];

export function getChainName(network: NetworkData, id: number): string | null {
	const index = network.chains.findIndex((ch) => ch.id === id);
	if (index < 0) {
		return null;
	}
	return network.chains[index].name;
}
