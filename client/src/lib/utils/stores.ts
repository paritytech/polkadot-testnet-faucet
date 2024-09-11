import { derived, writable } from "svelte/store";

import { type NetworkData, Paseo } from "./networkData";

// Defaults to Paseo, being updated in Faucet.svelte
export const testnet = writable<NetworkData>(Paseo);

export const testnetName = derived(testnet, ($net) => $net.networkName);

interface FaucetOperation {
  success: boolean;
  hash: string;
  error?: string;
}

export const operation = writable<FaucetOperation>();
