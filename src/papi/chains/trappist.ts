import { MultiAddress, trappist } from "@polkadot-api/descriptors";
import { PolkadotClient } from "polkadot-api";

import { parityWhitelist } from "src/papi/chains/common";
import { NetworkApi, NetworkData } from "src/papi/chains/index";
import { signer } from "src/papi/signer";

export const networkData: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "HOP",
  decimals: 12,
  dripAmount: "10",
  explorer: null,
  networkName: "Trappist",
  rpcEndpoint: "wss://rococo-trappist-rpc.polkadot.io/",
  matrixWhitelistPatterns: parityWhitelist,
};

export const networkApi: NetworkApi = {
  getTeleportTx: async (): Promise<string> => {
    throw new Error("Trappist network doesn't allow teleporting, as it itself is a parachain");
  },

  getTransferTokensTx: async ({ dripAmount, address, client, nonce }): Promise<string> => {
    const api = client.getTypedApi(trappist);

    return await api.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(address),
      value: dripAmount,
    }).sign(signer, { nonce });
  },

  getBalance: async (address: string, client: PolkadotClient): Promise<bigint> => {
    const api = client.getTypedApi(trappist);

    const balances = await api.query.System.Account.getValue(address, { at: "finalized" });

    return balances.data.free;
  },

  watchBalance: (address: string, client: PolkadotClient, callback: (value: bigint) => void): void => {
    const api = client.getTypedApi(trappist);
    api.query.System.Account.watchValue(address, "finalized").forEach((balances) => callback(balances.data.free));
  },

  healthcheck: async (client: PolkadotClient): Promise<void> => {
    const api = client.getTypedApi(trappist);
    await api.query.System.Number.getValue();
  },

  getNonce: async (address: string, client: PolkadotClient): Promise<number> => {
    const api = client.getTypedApi(trappist);
    return await api.apis.AccountNonceApi.account_nonce(address);
  },
};

export default { data: networkData, api: networkApi };
