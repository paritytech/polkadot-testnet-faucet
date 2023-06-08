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
	networkName: "Frequency Rococo",
	currency: "XRQCY",
	chains: [{ name: "Frequency Rococo Chain", id: -1 }],
	getChainName: function (id: number): string | null {
		const index = this.chains.findIndex((ch) => ch.id === id);
		if (index < 0) {
			return null;
		}
		return this.chains[index].name;
	}
};
