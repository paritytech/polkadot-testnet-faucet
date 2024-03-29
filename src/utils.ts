import { config } from "src/config";
import { getNetworkData } from "src/networkData";

export function isAccountPrivileged(sender: string): boolean {
  const networkName = config.Get("NETWORK");
  const networkData = getNetworkData(networkName);

  return networkData.matrixWhitelistPatterns.some((pattern) => pattern.test(sender));
}
