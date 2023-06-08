import { base } from "$app/paths";
import { PUBLIC_FAUCET_ROCOCO_URL, PUBLIC_FAUCET_WESTEND_URL } from "$env/static/public";

export interface ChainData {
	name: string;
	id: number;
}

export interface NetworkData {
	networkName: string;
	currency: string;
	chains: ChainData[];
	endpoint: string;
	explorer: string;
	getChainName(id: number): string | null;
}

export const Rococo: NetworkData = {
	networkName: "Rococo",
	currency: "$ROC",
	chains: [
		{ name: "Rococo Relay Chain", id: -1 },
		{ name: "Rockmine", id: 1000 },
		{ name: "Contracts", id: 1002 },
		{ name: "Encointer Lietaer", id: 1003 },
		{ name: "Bridgehub", id: 1013 }
	],
	endpoint: PUBLIC_FAUCET_ROCOCO_URL,
	explorer: "https://rococo.subscan.io",
	getChainName: function (id: number): string | null {
		const index = this.chains.findIndex((ch) => ch.id === id);
		if (index < 0) {
			return null;
		}
		return this.chains[index].name;
	}
};

export const Westend: NetworkData = {
	networkName: "Westend",
	currency: "$WND",
	chains: [
		{ name: "Westend Relay Chain", id: -1 },
		{ name: "Westmint", id: 1000 },
		{ name: "Collectives", id: 1001 }
	],
	endpoint: PUBLIC_FAUCET_WESTEND_URL,
	explorer: "https://westend.subscan.io",
	getChainName: function (id: number): string | null {
		const index = this.chains.findIndex((ch) => ch.id === id);
		if (index < 0) {
			return null;
		}
		return this.chains[index].name;
	}
};

export const Networks: { network: NetworkData; url: string }[] = [
	{ network: Rococo, url: base || "/" },
	{ network: Westend, url: `${base}/westend` }
];
