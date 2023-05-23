import { derived, writable,  } from "svelte/store";
import { Rococo, type NetworkData } from "./networkData";

// If we want to have a new network we need to change this hardcoded value.
export const testnet = writable<NetworkData>(Rococo);

export const testnetName = derived(testnet, $net => $net.networkName);
