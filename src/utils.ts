import bignum from 'bignum';
import log4js from 'log4js';

import { faucetConfig } from './faucetConfig';

const config = faucetConfig('server');
const decimals = config.Get('BACKEND', 'NETWORK_DECIMALS') as number;
const MAX_ALLOWED_DRIP_FLOAT = 9999999.9;

export const logger = log4js.getLogger();
logger.level = 'debug';

export function isAccountPrivileged(sender: string): boolean {
  return (
    sender.endsWith(':matrix.parity.io') || sender.endsWith(':web3.foundation')
  );
}

export function convertAmountToBn(amount: string): bigint {
  const parsedAmount = Number(amount);

  // at some point (~after 9999999.9), JS starts to calculate decimals incorrectly
  // so here we are using bignum library, which can do multiplications of large numbers correctly
  // the only caveat is that we can't keep float decimals of user-input for bignum,
  // so the user input large number with decimals will be floored,
  // that's why we want to keep this ability and use native multiplications until 9999999.9
  return parsedAmount < MAX_ALLOWED_DRIP_FLOAT
    ? BigInt(parsedAmount * 10 ** decimals) // will convert float numbers correctly
    : BigInt(new bignum(amount).mul(bignum.pow(10, decimals)).toString()); // float decimals will be floored
}
