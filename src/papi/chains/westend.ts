import { MultiAddress, westend } from "@polkadot-api/descriptors";
import { parityWhitelist } from "#src/papi/chains/common";
import { NetworkApi, NetworkData } from "#src/papi/chains/index";
import { signer } from "#src/papi/signer";
import { PolkadotClient } from "polkadot-api";

const networkData: NetworkData = {
  balanceCap: 100,
  chains: [
    { name: "Westend Relay Chain", id: -1 },
    { name: "Westmint", id: 1000 },
    { name: "Collectives", id: 1001 },
  ],
  currency: "WND",
  decimals: 12,
  dripAmount: "10",
  explorer: "https://assethub-westend.subscan.io",
  networkName: "Westend",
  rpcEndpoint: "wss://westend-asset-hub-rpc.polkadot.io/",
  matrixWhitelistPatterns: parityWhitelist,
  ethToSS58FillPrefix: 0xee,
  teleportEnabled: false,
};

export const networkApi: NetworkApi = {
  getTeleportTx: async (): Promise<string> => {
    throw new Error("Teleport is disabled for Westend");
    return "unreachable";
  },

  getTransferTokensTx: async ({ dripAmount, address, client, nonce }): Promise<string> => {
    const api = client.getTypedApi(westend);

    return await api.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(address),
      value: dripAmount,
    }).sign(signer, { nonce });
  },

  getBalance: async (address: string, client: PolkadotClient): Promise<bigint> => {
    const api = client.getTypedApi(westend);

    const balances = await api.query.System.Account.getValue(address, { at: "finalized" });

    return balances.data.free;
  },

  watchBalance: (address: string, client: PolkadotClient, callback: (value: bigint) => void): void => {
    const api = client.getTypedApi(westend);
    api.query.System.Account.watchValue(address, "finalized").forEach((balances) => callback(balances.data.free));
  },

  healthcheck: async (client: PolkadotClient): Promise<void> => {
    const api = client.getTypedApi(westend);
    await api.query.System.Number.getValue();
  },

  getNonce: async (address: string, client: PolkadotClient): Promise<number> => {
    const api = client.getTypedApi(westend);
    return await api.apis.AccountNonceApi.account_nonce(address);
  },
};

export default { data: networkData, api: networkApi };
