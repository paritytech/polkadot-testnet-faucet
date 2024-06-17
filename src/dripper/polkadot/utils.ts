import { config } from "#src/config";
import { getNetworkData } from "#src/papi/index";
import { BigFloat } from "bigfloat.js";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

export function convertAmountToBn(amount: string): bigint {
  const parsedAmount = new BigFloat(amount);

  return BigInt(parsedAmount.mul(new BigFloat(10).pow(new BigFloat(networkData.data.decimals))).toString());
}

export function convertBnAmountToNumber(amount: bigint): number {
  return Number(amount / 10n ** BigInt(networkData.data.decimals));
}

export function formatAmount(amount: bigint): string {
  const numberAmount = Number(amount / 10n ** BigInt(networkData.data.decimals));
  return String(Math.floor(numberAmount));
}
