import { config } from "#src/config";
import { getNetworkData } from "#src/papi/index";

export function isAccountPrivileged(sender: string): boolean {
  const networkName = config.Get("NETWORK");
  const networkData = getNetworkData(networkName);

  return networkData.data.matrixWhitelistPatterns.some((pattern) => pattern.test(sender));
}
