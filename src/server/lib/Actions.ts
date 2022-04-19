import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { waitReady } from '@polkadot/wasm-crypto';
import BN from 'bn.js';
import { ConfigManager } from 'confmgr/lib';

import { DripResponse } from '../../types';
import { logger } from '../../utils';
import errorCounter from './ErrorCounter';
import rpcApiInstance from './rpcApiInstance';

const config = ConfigManager.getInstance('envConfig.yml').getConfig();
const mnemonic = config.Get('BACKEND', 'FAUCET_ACCOUNT_MNEMONIC') as string;
const decimals = config.Get('BACKEND', 'NETWORK_DECIMALS') as number;
const balanceCap = config.Get('BACKEND', 'FAUCET_BALANCE_CAP') as number;
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

    const { data: balances } = await rpcApiInstance.query.system.account(
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

  public async getAccountBalance(address: string): Promise<number> {
    const { data } = await rpcApiInstance.query.system.account(address);

    const { free: balanceFree } = data;

    return balanceFree
      .toBn()
      .div(new BN(10 ** decimals))
      .toNumber();
  }

  public async isAccountOverBalanceCap(address: string): Promise<boolean> {
    return (await this.getAccountBalance(address)) > balanceCap;
  }

  async teleportTokens(
    dripAmount: number,
    address: string,
    parachain_id: string
  ): Promise<DripResponse> {
    logger.info('💸 teleporting tokens');

    const dest = await Promise.resolve(
      rpcApiInstance.createType('XcmVersionedMultiLocation', {
        V1: rpcApiInstance.createType('MultiLocationV1', {
          interior: rpcApiInstance.createType('JunctionsV1', {
            X1: rpcApiInstance.createType('JunctionV1', {
              Parachain: rpcApiInstance.createType(
                'Compact<u32>',
                parachain_id
              ),
            }),
          }),
          parents: 0,
        }),
      })
    );

    const beneficiary = await Promise.resolve(
      rpcApiInstance.createType('XcmVersionedMultiLocation', {
        V1: rpcApiInstance.createType('MultiLocationV1', {
          interior: rpcApiInstance.createType('JunctionsV1', {
            X1: rpcApiInstance.createType('JunctionV1', {
              AccountId32: {
                id: address,
                network: rpcApiInstance.createType('NetworkId', 'Any'),
              },
            }),
          }),
          parents: 0,
        }),
      })
    );

    const assets = await Promise.resolve(
      rpcApiInstance.createType('XcmVersionedMultiAssets', {
        V1: [
          rpcApiInstance.createType('XcmV1MultiAsset', {
            fun: rpcApiInstance.createType('FungibilityV1', {
              Fungible: dripAmount,
            }),
            id: rpcApiInstance.createType('XcmAssetId', {
              Concrete: rpcApiInstance.createType('MultiLocationV1', {
                interior: rpcApiInstance.createType('JunctionsV1', 'Here'),
                parents: 0,
              }),
            }),
          }),
        ],
      })
    );

    const feeAssetItem = 0;

    const transfer = rpcApiInstance.tx.xcmPallet.teleportAssets(
      dest,
      beneficiary,
      assets,
      feeAssetItem
    );

    if (!this.account) throw new Error('account not ready');
    const hash = await transfer.signAndSend(this.account, { nonce: -1 });

    const result: DripResponse = { hash: hash.toHex() };
    return result;
  }

  async sendTokens(
    address: string,
    parachain_id: string,
    amount: string
  ): Promise<DripResponse> {
    let dripTimeout: ReturnType<typeof rpcTimeout> | null = null;
    let result: DripResponse;

    try {
      if (!this.account) throw new Error('account not ready');

      const dripAmount = Number(amount) * 10 ** decimals;

      // start a counter and log a timeout error if we didn't get an answer in time
      dripTimeout = rpcTimeout('drip');

      if (parachain_id != '') {
        result = await this.teleportTokens(dripAmount, address, parachain_id);
      } else {
        logger.info('💸 sending tokens');
        const transfer = rpcApiInstance.tx.balances.transfer(
          address,
          dripAmount
        );
        const hash = await transfer.signAndSend(this.account, { nonce: -1 });
        result = { hash: hash.toHex() };
      }
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

      const { data: balances } = await rpcApiInstance.query.system.account(
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
