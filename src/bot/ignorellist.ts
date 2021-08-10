import { decodeAddress } from '@polkadot/keyring';
import { logger } from 'src/utils';

export function isIgnored (account: string): boolean {
  let decodedAddress: string;
  try {
    decodedAddress = decodeAddress(account).toString();
  } catch (e) {
    logger.warn(`${account} is not in the proper format.`);
    return false;
  }
  const ignoreList: string[] = (process.env.FAUCET_IGNORE_LIST ?? '').replace(/\s/g, '').split(',') ?? [];

  return ignoreList.includes(decodedAddress);
}
