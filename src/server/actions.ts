import { ApiPromise, WsProvider } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import dotenv from 'dotenv';

import { getEnvVariable, logger } from '../utils';
import errorCounter from './ErrorCounter';
import { envVars } from './serverEnvVars';

dotenv.config();

const mnemonic = getEnvVariable('FAUCET_ACCOUNT_MNEMONIC', envVars) as string;
const url = getEnvVariable('RPC_ENDPOINT', envVars) as string;
const injectedTypes = JSON.parse(getEnvVariable('INJECTED_TYPES', envVars) as string) as Record<string, string>;
const decimals = getEnvVariable('NETWORK_DECIMALS', envVars) as number;

export default class Actions {
  api: ApiPromise | undefined;
  account: KeyringPair | undefined;

  constructor () {
    this.createApi().then(() => {
      // once the api is initialized, we can create and account
      // if we don't wait we'll get an error "@polkadot/wasm-crypto has not been initialized"
      const keyring = new Keyring({ type: 'sr25519' });
      this.account = keyring.addFromMnemonic(mnemonic);
    }).catch(e => {
      logger.error(e);
      errorCounter.plusOne();
    });
  }

  async createApi (): Promise<void> {
    const provider = new WsProvider(url);
    try {
      this.api = await ApiPromise.create({ provider, types: injectedTypes });
    } catch (e) {
      logger.error(e);
      errorCounter.plusOne();
    }
  }

  async sendTokens (address: string, amount: string): Promise<string | null> {
    try {
      if (!this.api?.isReady) {
        throw new Error('api not ready');
      }

      if (!this.account) {
        throw new Error('account not ready');
      }

      const dripAmount = Number(amount) * 10 ** decimals;
      const transfer = this.api.tx.balances.transfer(address, dripAmount);
      const hash = await transfer.signAndSend(this.account);
      return hash.toHex();
    } catch (e) {
      logger.error('An error occured when sending tokens', e);
      errorCounter.plusOne();
      return null;
    }
  }

  async getBalance (): Promise<string> {
    if (!this.api?.isReady) {
      throw new Error('api not ready');
    }

    if (!this.account) {
      throw new Error('account not ready');
    }

    const { data: balances } = await this.api.query.system.account(this.account.address);
    return balances.free.toString();
  }
}
