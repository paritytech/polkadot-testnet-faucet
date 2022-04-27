import bignum from 'bignum';
import { ConfigManager } from 'confmgr/lib';
import log4js from 'log4js';

const config = ConfigManager.getInstance('envConfig.yml').getConfig();
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
  return parsedAmount < MAX_ALLOWED_DRIP_FLOAT
    ? BigInt(parsedAmount * 10 ** decimals)
    : BigInt(new bignum(amount).mul(bignum.pow(10, decimals)).toString());
}
