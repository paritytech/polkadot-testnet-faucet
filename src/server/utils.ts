import { BigFloat } from "bigfloat.js";

import { config } from "./config";

const decimals = config.Get("NETWORK_DECIMALS");

export function convertAmountToBn(amount: string): bigint {
  const parsedAmount = new BigFloat(amount);

  return BigInt(parsedAmount.mul(new BigFloat(10).pow(new BigFloat(decimals))).toString());
}
