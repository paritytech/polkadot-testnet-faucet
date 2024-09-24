import { derived, writable } from "svelte/store";

import { type NetworkData, Frequency } from "./networkData";

// If we want to have a new network we need to change this hardcoded value.
export const testnet = writable<NetworkData>(Frequency);

export const testnetName = derived(testnet, ($net) => $net.networkName);

interface FaucetOperation {
	success: boolean;
	hash: string;
	error?: string;
}

export const operation = writable<FaucetOperation>();
