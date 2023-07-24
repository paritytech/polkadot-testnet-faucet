import { BigFloat } from "bigfloat.js";

import { config } from "../../config";
import { getNetworkData } from "../../networkData";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

export function convertAmountToBn(amount: string): bigint {
  const parsedAmount = new BigFloat(amount);

  return BigInt(parsedAmount.mul(new BigFloat(10).pow(new BigFloat(networkData.decimals))).toString());
}

export function convertBnAmountToNumber(amount: bigint): number {
  return Number(amount) / 10 ** networkData.decimals;
}

export function formatAmount(amount: bigint): string {
  const numberAmount = Number(amount) / 10 ** networkData.decimals;
  return String(Math.floor(numberAmount));
}
