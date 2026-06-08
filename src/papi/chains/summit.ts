import {
  MultiAddress,
  summit_asset_hub,
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

const networkData: NetworkData = {
  balanceCap: 5500,
  chains: [
    { name: "Asset Hub", id: 1500 },
    { name: "Summit Relay", id: 0 },
    { name: "Bulletin", id: 1501 },
    { name: "People", id: 1502 },
  ],
  currency: "SUM",
  decimals: 10,
  dripAmount: "5000",
  explorer: null,
  networkName: "Summit",
  rpcEndpoint: "wss://summit-asset-hub-rpc.polkadot.io",
  matrixWhitelistPatterns: parityWhitelist,
  ethToSS58FillPrefix: 0xee,
  teleportEnabled: true,
  id: 1500,
};

export const networkApi: NetworkApi = {
  getTeleportTx: async ({ dripAmount, address, parachain_id, client, nonce }): Promise<string> => {
    const api = client.getTypedApi(summit_asset_hub);

    const dest = XcmVersionedLocation.V3({
      parents: 1,
      interior: parachain_id === 0 ? XcmV3Junctions.Here() : XcmV3Junctions.X1(XcmV3Junction.Parachain(parachain_id)),
    });

    return await api.tx.PolkadotXcm.limited_teleport_assets({
      dest,
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
          id: XcmV3MultiassetAssetId.Concrete({ interior: XcmV3Junctions.Here(), parents: 1 }),
        },
      ]),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }).sign(signer, { nonce });
  },

  getTransferTokensTx: async ({ dripAmount, address, client, nonce }): Promise<string> => {
    const api = client.getTypedApi(summit_asset_hub);

    return await api.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(address),
      value: dripAmount,
    }).sign(signer, { nonce });
  },

  getBalance: async (address: string, client: PolkadotClient): Promise<bigint> => {
    const api = client.getTypedApi(summit_asset_hub);

    const balances = await api.query.System.Account.getValue(address, { at: "finalized" });

    return balances.data.free;
  },

  getDetailedBalance: async (
    address: string,
    client: PolkadotClient,
  ): Promise<{ free: bigint; reserved: bigint; frozen: bigint }> => {
    const api = client.getTypedApi(summit_asset_hub);
    const balances = await api.query.System.Account.getValue(address, { at: "finalized" });
    return { free: balances.data.free, reserved: balances.data.reserved, frozen: balances.data.frozen };
  },

  watchBalance: (address: string, client: PolkadotClient, callback: (value: bigint) => void): void => {
    const api = client.getTypedApi(summit_asset_hub);
    api.query.System.Account.watchValue(address, "finalized").forEach((balances) => callback(balances.data.free));
  },

  healthcheck: async (client: PolkadotClient): Promise<void> => {
    const api = client.getTypedApi(summit_asset_hub);
    await api.query.System.Number.getValue();
  },

  getNonce: async (address: string, client: PolkadotClient): Promise<number> => {
    const api = client.getTypedApi(summit_asset_hub);
    return await api.apis.AccountNonceApi.account_nonce(address);
  },
};

export default { data: networkData, api: networkApi };
