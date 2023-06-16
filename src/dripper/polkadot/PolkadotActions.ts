import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { waitReady } from "@polkadot/wasm-crypto";
import BN from "bn.js";

import errorCounter from "../../common/ErrorCounter";
import { serverConfig as config } from "../../config";
import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { DripResponse } from "../../types";
import polkadotApi from "./polkadotApi";
import { convertAmountToBn } from "./utils";

const mnemonic = config.Get("FAUCET_ACCOUNT_MNEMONIC");
const decimals = config.Get("NETWORK_DECIMALS");
const balanceCap = config.Get("FAUCET_BALANCE_CAP");
const balancePollIntervalMs = 60000; // 1 minute

const rpcTimeout = (service: string) => {
  const timeout = 10000;
  return setTimeout(() => {
    // log an error in console and in prometheus if the timeout is reached
    logger.error(`⭕ Oops, ${service} took more than ${timeout}ms to answer`);
    errorCounter.plusOne("rpcTimeout");
  }, timeout);
};

export class PolkadotActions {
  account: KeyringPair | undefined;
  #faucetBalance: number | undefined;

  constructor() {
    logger.info("🚰 Plip plop - Creating the faucets's account");

    try {
      const keyring = new Keyring({ type: "sr25519" });

      waitReady().then(() => {
        this.account = keyring.addFromMnemonic(mnemonic);

        // We do want the following to just start and run
        // TODO: Adding a subscription would be better but the server supports on http for now
        const updateFaucetBalance = (log = false) => {
          this.updateFaucetBalance().then(() => {
            if (log) logger.info("Fetched faucet balance 💰");
            setTimeout(updateFaucetBalance, balancePollIntervalMs);
          });
        };
        updateFaucetBalance(true);
      });
    } catch (error) {
      logger.error(error);
      errorCounter.plusOne("other");
    }
  }

  /**
   * This function checks the current balance and updates the `faucetBalance` property.
   */
  private async updateFaucetBalance() {
    if (!this.account?.address) {
      logger.warn("Account address wasn't initialized yet");
      return;
    }

    try {
      await polkadotApi.isReady;
      const { data: balances } = await polkadotApi.query.system.account(this.account.address);
      const precision = 5;
      this.#faucetBalance =
        balances.free
          .toBn()
          .div(new BN(10 ** (decimals - precision)))
          .toNumber() /
        10 ** precision;
    } catch (e) {
      logger.error(e);
      errorCounter.plusOne("other");
    }
  }

  public getFaucetBalance(): number | undefined {
    return this.#faucetBalance;
  }

  public async getAccountBalance(address: string): Promise<number> {
    const { data } = await polkadotApi.query.system.account(address);

    const { free: balanceFree } = data;

    return balanceFree
      .toBn()
      .div(new BN(10 ** decimals))
      .toNumber();
  }

  public async isAccountOverBalanceCap(address: string): Promise<boolean> {
    return (await this.getAccountBalance(address)) > balanceCap;
  }

  async teleportTokens(dripAmount: bigint, address: string, parachain_id: string): Promise<DripResponse> {
    logger.info("💸 teleporting tokens");

    const dest = await Promise.resolve(
      polkadotApi.createType("XcmVersionedMultiLocation", {
        V3: polkadotApi.createType("MultiLocationV3", {
          interior: polkadotApi.createType("JunctionsV3", {
            X1: polkadotApi.createType("JunctionV3", {
              Parachain: polkadotApi.createType("Compact<u32>", parachain_id),
            }),
          }),
          parents: 0,
        }),
      }),
    );

    const beneficiary = await Promise.resolve(
      polkadotApi.createType("XcmVersionedMultiLocation", {
        V3: polkadotApi.createType("MultiLocationV3", {
          interior: polkadotApi.createType("JunctionsV3", {
            X1: polkadotApi.createType("JunctionV3", {
              AccountId32: { id: address, network: polkadotApi.createType("NetworkId", "Any") },
            }),
          }),
          parents: 0,
        }),
      }),
    );

    const assets = await Promise.resolve(
      polkadotApi.createType("XcmVersionedMultiAssets", {
        V3: [
          polkadotApi.createType("XcmV3MultiAsset", {
            fun: polkadotApi.createType("FungibilityV3", { Fungible: dripAmount }),
            id: polkadotApi.createType("XcmAssetId", {
              Concrete: polkadotApi.createType("MultiLocationV3", {
                interior: polkadotApi.createType("JunctionsV3", "Here"),
                parents: 0,
              }),
            }),
          }),
        ],
      }),
    );

    const feeAssetItem = 0;

    const transfer = polkadotApi.tx.xcmPallet.teleportAssets(dest, beneficiary, assets, feeAssetItem);

    if (!this.account) throw new Error("account not ready");
    const hash = await transfer.signAndSend(this.account, { nonce: -1 });

    const result: DripResponse = { hash: hash.toHex() };
    return result;
  }

  async sendTokens(address: string, parachain_id: string, amount: string): Promise<DripResponse> {
    let dripTimeout: ReturnType<typeof rpcTimeout> | null = null;
    let result: DripResponse;
    const parsedAmount = Number(amount);
    const faucetBalance = this.getFaucetBalance();

    try {
      if (!this.account) throw new Error("account not ready");

      if (typeof faucetBalance !== "undefined" && parsedAmount >= faucetBalance) {
        throw new Error(`Can't send "${parsedAmount}", as balance is smaller "${faucetBalance}"`);
      }

      const dripAmount = convertAmountToBn(amount);

      // start a counter and log a timeout error if we didn't get an answer in time
      dripTimeout = rpcTimeout("drip");
      if (parachain_id != "") {
        result = await this.teleportTokens(dripAmount, address, parachain_id);
      } else {
        logger.info("💸 sending tokens");
        const transfer = polkadotApi.tx.balances.transfer(address, dripAmount);
        const hash = await transfer.signAndSend(this.account, { nonce: -1 });
        result = { hash: hash.toHex() };
      }
    } catch (e) {
      result = { error: (e as Error).message || "An error occured when sending tokens" };
      logger.error("⭕ An error occured when sending tokens", e);
      errorCounter.plusOne("other");
    }

    // we got and answer reset the timeout
    if (dripTimeout) clearTimeout(dripTimeout);

    if (isDripSuccessResponse(result)) {
      await this.updateFaucetBalance().then(() => logger.info("Refreshed the faucet balance 💰"));
    }

    return result;
  }

  async getBalance(): Promise<string> {
    try {
      if (!this.account) {
        throw new Error("account not ready");
      }

      logger.info("💰 checking faucet balance");

      // start a counter and log a timeout error if we didn't get an answer in time
      const balanceTimeout = rpcTimeout("balance");

      const { data: balances } = await polkadotApi.query.system.account(this.account.address);

      // we got and answer reset the timeout
      clearTimeout(balanceTimeout);

      return balances.free.toString();
    } catch (e) {
      logger.error("⭕ An error occured when querying the balance", e);
      errorCounter.plusOne("other");
      return "0";
    }
  }
}

export default new PolkadotActions();
