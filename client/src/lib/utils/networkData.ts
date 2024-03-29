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
	networkName: "Frequency",
	currency: "XRQCY",
	chains: [{ name: "Frequency Rococo Testnet", id: -1 }],
	endpoint: faucetUrl(PUBLIC_FAUCET_URL),
	explorer: null
};

export const Westend: NetworkData = {
	networkName: "Westend",
	currency: "WND",
	chains: [
		{ name: "Westend Relay", id: -1 },
		{ name: "AssetHub", id: 1000 },
		{ name: "Collectives", id: 1001 },
		{ name: "BridgeHub", id: 1002 },
		{ name: "People", id: 1004 }
	],
	endpoint: faucetUrl("https://westend-faucet.polkadot.io/drip/web"),
	explorer: "https://westend.subscan.io"
};

export const Paseo: NetworkData = {
	networkName: "Paseo",
	currency: "PAS",
	chains: [{ name: "Paseo Relay", id: -1 }],
	endpoint: faucetUrl("https://paseo-faucet.parity-testnet.parity.io/drip/web"),
	explorer: null
};

export const Trappist: NetworkData = {
	networkName: "Trappist",
	currency: "HOP",
	chains: [{ name: "Trappist rococo parachain", id: -1 }],
	endpoint: faucetUrl("https://trappist-faucet.parity-testnet.parity.io/drip/web"),
	explorer: null
};

export const Networks: { network: NetworkData; url: string }[] = [
	{ network: Rococo, url: "https://faucet.polkadot.io" },
	{ network: Paseo, url: "https://faucet.polkadot.io/paseo" },
	{ network: Westend, url: "https://faucet.polkadot.io/westend" },
	{ network: Trappist, url: "https://faucet.polkadot.io/trappist" }
];

export function getChainName(network: NetworkData, id: number): string | null {
	const index = network.chains.findIndex((ch) => ch.id === id);
	if (index < 0) {
		return null;
	}
	return network.chains[index].name;
}
