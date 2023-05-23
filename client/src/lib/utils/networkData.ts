export interface ChainData {
	name: string;
	id: number;
}

export interface NetworkData {
	networkName: string;
	currency: string;
	chains: ChainData[];
	getChainName(id: number): string | null;
}

export const Rococo: NetworkData = {
	networkName: "Rococo",
	currency: "$ROC",
	chains: [
		{ name: "Relay Chain", id: -1 },
		{ name: "Rockmine", id: 1000 },
		{ name: "Contracts", id: 1002 },
		{ name: "Encointer Lietaer", id: 1003 },
		{ name: "Bridgehub", id: 1013 }
	],
	getChainName: function (id: number): string | null {
		const index = this.chains.findIndex((ch) => ch.id === id);
		if (index < 0) {
			return null;
		}
		return this.chains[index].name;
	}
};
