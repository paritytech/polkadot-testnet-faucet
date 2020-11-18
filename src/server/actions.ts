import { WsProvider, ApiPromise } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import { logger } from '../utils';

require('dotenv').config();

const mnemonic = process.env.FAUCET_ACCOUNT_MNEMONIC || '';
const url = process.env.RPC_ENDPOINT;
const injectedTypes = JSON.parse(process.env.INJECTED_TYPES || '');
const decimals = Number(process.env.NETWORK_DECIMALS) || 12;

export default class Actions {

  api: ApiPromise | undefined;
  account: KeyringPair | undefined;

  constructor() {
    this.createApi().then( () => {
      // once the api is initialized, we can create and account
      // if we don't wait, we'll get an error "@polkadot/wasm-crypto has not been initialized"
      const keyring = new Keyring({ type: 'sr25519' });
      this.account = keyring.addFromMnemonic(mnemonic);
    });
  }

  async createApi(){
    const provider = new WsProvider(url);
    this.api = await ApiPromise.create({ provider, types: injectedTypes });
  }

  async sendTokens(address: string, amount: string) {
    try {
      if(!this.api?.isReady){
        throw new Error('api not ready');
      }

      if(!this.account){
        throw new Error('account not ready');
      }

      const dripAmount = Number(amount) * 10**decimals;
      const transfer = this.api.tx.balances.transfer(address, dripAmount);
      const hash = await transfer.signAndSend(this.account);
      return hash.toHex();
    } catch(e){
      logger.error('An error occured when sending tokens', e)
      return null;
    }
  }

  async getBalance() {
    if(!this.api?.isReady){
      throw new Error('api not ready');
    }

    if(!this.account){
      throw new Error('account not ready');
    }
    
    const {data: balances} = await this.api.query.system.account(this.account.address);
    return balances.free.toString();
  }
}
