import { writable } from "svelte/store";

import { type NetworkData, Paseo } from "./networkData";

// Defaults to Paseo, being updated in Faucet.svelte
export const testnet = writable<NetworkData>(Paseo);

export const embed = writable<boolean>(false);

interface FaucetOperation {
  success: boolean;
  hash: string;
  blockHash?: string;
  error?: string;
}

export const operation = writable<FaucetOperation>();
