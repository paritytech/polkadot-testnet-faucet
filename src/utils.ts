import { concatBytes, hexToBytes } from "@noble/hashes/utils";
import { config } from "#src/config";
import { getNetworkData } from "#src/papi/index";
import { AccountId } from "polkadot-api";

export function isAccountPrivileged(sender: string): boolean {
  const networkName = config.Get("NETWORK");
  const networkData = getNetworkData(networkName);

  return networkData.data.matrixWhitelistPatterns.some((pattern) => pattern.test(sender));
}

// copypaste from https://github.com/paritytech/revive-remix/blob/2eca8b351f96734ffc94adc63b94f3587bd8d67d/libs/remix-ui/helper/src/lib/remix-ui-helper.ts#L93
export function ethAddressToSS58(address: string, prefix: number): string {
  // Remove '0x' prefix
  const ethAddress = address.slice(2);
  const ethAddressBytes = hexToBytes(ethAddress);
  // Pad the address to 32 bytes with `0xEE`
  const paddedAddress = concatBytes(ethAddressBytes, new Uint8Array(32 - ethAddressBytes.length).fill(prefix));
  return AccountId().dec(paddedAddress);
}
