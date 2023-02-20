import { BigFloat } from "bigfloat.js";
import { BlockList, isIPv4, isIPv6 } from "node:net";

import { config } from "./config";

const decimals = config.Get("NETWORK_DECIMALS");

export function convertAmountToBn(amount: string): bigint {
  const parsedAmount = new BigFloat(amount);

  return BigInt(parsedAmount.mul(new BigFloat(10).pow(new BigFloat(decimals))).toString());
}

export function isExternalIP(ip: string) {
  if (!isIPv4(ip) && !isIPv6(ip)) {
    throw new Error(`Unrecognized format of IP: '${ip}'`);
  }

  // We're not blocking anything, just using it to check IPs against this list.
  const reservedList = new BlockList();
  // Taken from https://en.wikipedia.org/wiki/Reserved_IP_addresses
  reservedList.addRange("127.0.0.0", "127.255.255.255");
  reservedList.addRange("::ffff:127.0.0.0", "::ffff:127.255.255.255", "ipv6");
  reservedList.addRange("192.168.0.0", "192.168.255.255");
  reservedList.addRange("::ffff:192.168.0.0", "::ffff:192.168.255.255", "ipv6");
  reservedList.addRange("172.16.0.0", "172.31.255.255");
  reservedList.addRange("::ffff:172.16.0.0", "::ffff:172.31.255.255", "ipv6");
  return !reservedList.check(ip, isIPv4(ip) ? "ipv4" : "ipv6");
}
