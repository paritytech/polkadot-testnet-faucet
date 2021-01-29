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

const rpcTimeout = (service: string) => {
  const timeout = 10000;
  return setTimeout(() => {
    // log an error in console and in prometheus if the timeout is reached
    logger.error(`⭕ Oops, ${service} took more than ${timeout}ms to answer`);
    errorCounter.plusOne('rpcTimeout');
  }, timeout);
};

export default class Actions {
  // api: ApiPromise | undefined;
  account: KeyringPair | undefined;

  constructor () {
    this.getConnectedApiInstance().then((api) => {
      logger.info('🤖 Beep bop - Creating the bot\'s account');

      // once the api is initialized, we can create and account
      // if we don't wait we'll get an error "@polkadot/wasm-crypto has not been initialized"
      const keyring = new Keyring({ type: 'sr25519' });
      this.account = keyring.addFromMnemonic(mnemonic);

      this.disconnectApi(api);
    }).catch((e) => {
      logger.error(e);
      errorCounter.plusOne('other');
    });
  }

  async getConnectedApiInstance (): Promise<ApiPromise> {
    // do not autoconnect
    const provider = new WsProvider(url, false);

    const api = new ApiPromise({ provider, types: injectedTypes });

    // commented out as to not spam, but useful for debugging
    // to make sure we connect only once.

    // api.on('connected', () => {
    //   logger.info('--> api connected');
    // });

    // api.on('disconnected', () => {
    //   logger.info('<-- api disconnected');
    // });

    await api.connect();
    await api.isReady;
    return api;
  }

  async sendTokens (address: string, amount: string): Promise<string | null> {
    try {
      const api = await this.getConnectedApiInstance();

      if (!this.account) {
        throw new Error('account not ready');
      }

      logger.info('💸 sending tokens');

      const dripAmount = Number(amount) * 10 ** decimals;
      const transfer = api.tx.balances.transfer(address, dripAmount);

      // start a counter and log a timeout error if we didn't get an answer in time
      const dripTimeout = rpcTimeout('drip');
      const hash = await transfer.signAndSend(this.account);

      // we got and answer reset the timeout
      clearTimeout(dripTimeout);

      this.disconnectApi(api);
      return hash.toHex();
    } catch (e) {
      logger.error('⭕ An error occured when sending tokens', e);
      errorCounter.plusOne('other');
      return null;
    }
  }

  async getBalance (): Promise<string> {
    try {
      const api = await this.getConnectedApiInstance();

      if (!this.account) {
        throw new Error('account not ready');
      }

      logger.info('💰 checking balance');

      // start a counter and log a timeout error if we didn't get an answer in time
      const balanceTimeout = rpcTimeout('balance');

      const { data: balances } = await api.query.system.account(this.account.address);

      // we got and answer reset the timeout
      clearTimeout(balanceTimeout);

      this.disconnectApi(api);
      return balances.free.toString();
    } catch (e) {
      logger.error('⭕ An error occured when querying the balance', e);
      errorCounter.plusOne('other');
      return '0';
    }
  }

  disconnectApi (api: ApiPromise): void {
    api.disconnect().catch((e) => logger.error('⭕ disconnection error', e));
  }
}
