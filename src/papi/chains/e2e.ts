import {
  e2e_relaychain,
  MultiAddress,
  XcmV3Junction,
  XcmV3Junctions,
  XcmV3MultiassetAssetId,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmVersionedAssets,
  XcmVersionedLocation,
} from "@polkadot-api/descriptors";
import { parityWhitelist } from "#src/papi/chains/common";
import { NetworkApi, NetworkData } from "#src/papi/chains/index";
import { signer } from "#src/papi/signer";
import { PolkadotClient } from "polkadot-api";

export const networkData: NetworkData = {
  balanceCap: 100,
  chains: [],
  currency: "UNIT",
  decimals: 12,
  dripAmount: "10",
  explorer: null,
  networkName: "Rococo",
  rpcEndpoint: "ws://host.docker.internal:9933/",
  matrixWhitelistPatterns: parityWhitelist,
  ethToSS58FillPrefix: 0xee,
};

export const networkApi: NetworkApi = {
  getTeleportTx: async ({ dripAmount, address, parachain_id, client, nonce }): Promise<string> => {
    const api = client.getTypedApi(e2e_relaychain);

    return await api.tx.XcmPallet.limited_teleport_assets({
      dest: XcmVersionedLocation.V3({
        parents: 0,
        interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(parachain_id)),
      }),
      beneficiary: XcmVersionedLocation.V3({
        parents: 0,
        interior: XcmV3Junctions.X1(
          XcmV3Junction.AccountId32({
            network: undefined,
            id: address,
          }),
        ),
      }),
      assets: XcmVersionedAssets.V3([
        {
          fun: XcmV3MultiassetFungibility.Fungible(dripAmount),
          id: XcmV3MultiassetAssetId.Concrete({ interior: XcmV3Junctions.Here(), parents: 0 }),
        },
      ]),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }).sign(signer, { nonce });
  },

  getTransferTokensTx: async ({ dripAmount, address, client, nonce }): Promise<string> => {
    const api = client.getTypedApi(e2e_relaychain);

    return await api.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(address),
      value: dripAmount,
    }).sign(signer, { nonce });
  },

  getBalance: async (address: string, client: PolkadotClient): Promise<bigint> => {
    const api = client.getTypedApi(e2e_relaychain);

    const balances = await api.query.System.Account.getValue(address, { at: "finalized" });

    return balances.data.free;
  },

  watchBalance: (address: string, client: PolkadotClient, callback: (value: bigint) => void): void => {
    const api = client.getTypedApi(e2e_relaychain);
    api.query.System.Account.watchValue(address, "finalized").forEach((balances) => callback(balances.data.free));
  },

  healthcheck: async (client: PolkadotClient): Promise<void> => {
    const api = client.getTypedApi(e2e_relaychain);
    await api.query.System.Number.getValue();
  },

  getNonce: async (address: string, client: PolkadotClient): Promise<number> => {
    const api = client.getTypedApi(e2e_relaychain);
    return await api.apis.AccountNonceApi.account_nonce(address);
  },
};

export default { data: networkData, api: networkApi };
