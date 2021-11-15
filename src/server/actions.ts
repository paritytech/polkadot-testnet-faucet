import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { waitReady } from '@polkadot/wasm-crypto';
import BN from 'bn.js';

import { DripResponse } from '../types';
import { getEnvVariable, logger } from '../utils';
import errorCounter from './ErrorCounter';
import apiInstance from './rpc';
import { envVars } from './serverEnvVars';

const mnemonic = getEnvVariable('FAUCET_ACCOUNT_MNEMONIC', envVars) as string;
const decimals = getEnvVariable('NETWORK_DECIMALS', envVars) as number;
const balanceCap = getEnvVariable('FAUCET_BALANCE_CAP', envVars) as number;
const balancePollIntervalMs = 60000; // 1 minute

const rpcTimeout = (service: string) => {
  const timeout = 10000;
  return setTimeout(() => {
    // log an error in console and in prometheus if the timeout is reached
    logger.error(`⭕ Oops, ${service} took more than ${timeout}ms to answer`);
    errorCounter.plusOne('rpcTimeout');
  }, timeout);
};

export default class Actions {
  account: KeyringPair | undefined;
  #faucetBalance: number | undefined;

  constructor() {
    logger.info("🤖 Beep bop - Creating the bot's account");

    try {
      const keyring = new Keyring({ type: 'sr25519' });

      waitReady().then(() => {
        this.account = keyring.addFromMnemonic(mnemonic);

        setInterval(() => {
          // We do want the following to just start and run
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          // TODO: Adding a subscription would be better but the server supports on http for now
          this.updateFaucetBalance().catch(console.error);
        }, balancePollIntervalMs);
      });
    } catch (error) {
      logger.error(error);
      errorCounter.plusOne('other');
    }
  }

  /**
   * This function checks the current balance and updates the `faucetBalance` property.
   */
  private async updateFaucetBalance() {
    if (!this.account) return;

    const { data: balances } = await apiInstance.query.system.account(
      this.account.address
    );
    const precision = 5;
    this.#faucetBalance =
      balances.free
        .toBn()
        .div(new BN(10 ** (decimals - precision)))
        .toNumber() /
      10 ** precision;
  }

  public getFaucetBalance(): number | undefined {
    return this.#faucetBalance;
  }

  async sendTokens(address: string, amount: string): Promise<DripResponse> {
    let dripTimeout: ReturnType<typeof rpcTimeout> | null = null;
    let result: DripResponse;

    try {
      if (!this.account) throw new Error('account not ready');

      const { data } = await apiInstance.query.system.account(address);
      const { free: balanceFree } = data;
      const scaledBalanceFree =
        balanceFree.toBn().toNumber() / Math.pow(10, decimals);

      if (scaledBalanceFree > balanceCap) {
        logger.error(
          `⭕ Blocking faucet as this account balance is over the threshold limit of ${balanceCap}`
        );

        throw Error('Account balance is over the faucet threshold');
      }

      const dripAmount = Number(amount) * 10 ** decimals;

      logger.info('💸 sending tokens');

      // start a counter and log a timeout error if we didn't get an answer in time
      dripTimeout = rpcTimeout('drip');
      const transfer = apiInstance.tx.balances.transfer(address, dripAmount);
      const hash = await transfer.signAndSend(this.account, { nonce: -1 });
      result = { hash: hash.toHex() };
    } catch (e) {
      result = {
        error: (e as Error).message || 'An error occured when sending tokens',
      };
      logger.error('⭕ An error occured when sending tokens', e);
      errorCounter.plusOne('other');
    }

    // we got and answer reset the timeout
    if (dripTimeout) clearTimeout(dripTimeout);

    return result;
  }

  async getBalance(): Promise<string> {
    try {
      if (!this.account) {
        throw new Error('account not ready');
      }

      logger.info('💰 checking balance');

      // start a counter and log a timeout error if we didn't get an answer in time
      const balanceTimeout = rpcTimeout('balance');

      const { data: balances } = await apiInstance.query.system.account(
        this.account.address
      );

      // we got and answer reset the timeout
      clearTimeout(balanceTimeout);

      return balances.free.toString();
    } catch (e) {
      logger.error('⭕ An error occured when querying the balance', e);
      errorCounter.plusOne('other');
      return '0';
    }
  }
}
