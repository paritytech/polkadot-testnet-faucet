const { WsProvider, ApiPromise } = require('@polkadot/api');
const pdKeyring = require('@polkadot/keyring');
require('dotenv').config();
const { logger } = require('../utils');

const mnemonic = process.env.FAUCET_ACCOUNT_MNEMONIC;
const url = process.env.RPC_ENDPOINT;
const injectedTypes = JSON.parse(process.env.INJECTED_TYPES) || {};
const decimals = process.env.NETWORK_DECIMALS;

class Actions {

  api;
  account;

  constructor() {
    this.create();
  }

  async create(){
    const provider = new WsProvider(url);
    this.api = await ApiPromise.create({ provider, types: injectedTypes });
    const keyring = new pdKeyring.Keyring({ type: 'sr25519' });
    this.account = keyring.addFromMnemonic(mnemonic);
  }

  async sendTokens(address, amount) {
    const dripAmount = amount * 10**decimals;

    const transfer = this.api.tx.balances.transfer(address, dripAmount);
    try {
      const hash = await transfer.signAndSend(this.account);
      return hash.toHex();
    } catch(e){
      logger.error('An error occured when sending tokens', e)
      return null;
    }
  }

  async getBalance() {
    const {data: balances} = await this.api.query.system.account(this.account.address);
    return balances.free.toString();
  }
}

module.exports = Actions;
