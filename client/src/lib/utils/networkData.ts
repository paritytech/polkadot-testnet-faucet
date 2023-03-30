export interface ChainData {
	name: string;
	id: number;
}

interface NetworkData {
	networkName: string;
	chains: ChainData[];
	getChainName(id: number): string | null;
}

export const Rococo: NetworkData = {
	networkName: "Rococo",
	chains: [
		{ name: "Relay Chain", id: -1 },
		{ name: "One", id: 1 },
		{ name: "Two", id: 2 },
		{ name: "Three", id: 3000 }
	],
	getChainName: function (id: number): string | null {
		const index = this.chains.findIndex((ch) => ch.id === id);
		if (index < 0) {
			return null;
		}
		return this.chains[index].name;
	}
};
