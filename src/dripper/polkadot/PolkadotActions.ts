import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { waitReady } from "@polkadot/wasm-crypto";
import BN from "bn.js";

import { config } from "../../config";
import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { getNetworkData } from "../../networkData";
import { DripResponse } from "../../types";
import polkadotApi from "./polkadotApi";
import { formatAmount } from "./utils";

const mnemonic = config.Get("FAUCET_ACCOUNT_MNEMONIC");
const balancePollIntervalMs = 60000; // 1 minute

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const rpcTimeout = (service: string) => {
  const timeout = 10000;
  return setTimeout(() => {
    // log an error in console and in prometheus if the timeout is reached
    logger.error(`⭕ Oops, ${service} took more than ${timeout}ms to answer`);
  }, timeout);
};

export class PolkadotActions {
  account: KeyringPair | undefined;
  #faucetBalance: bigint | undefined;
  isReady: Promise<void>;

  constructor() {
    logger.info("🚰 Plip plop - Creating the faucets's account");
    let makeReady: () => void;

    this.isReady = new Promise((resolve) => {
      makeReady = resolve;
    });

    try {
      const keyring = new Keyring({ type: "sr25519" });

      waitReady().then(() => {
        this.account = keyring.addFromMnemonic(mnemonic);

        // We do want the following to just start and run
        // TODO: Adding a subscription would be better but the server supports on http for now
        const updateFaucetBalance = (log = false) =>
          this.updateFaucetBalance().then(() => {
            if (log) logger.info("Fetched faucet balance 💰");
            setTimeout(updateFaucetBalance, balancePollIntervalMs);
          });
        updateFaucetBalance(true).then(makeReady);
      });
    } catch (error) {
      logger.error(error);
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
      this.#faucetBalance = balances.free.toBigInt();
    } catch (e) {
      logger.error(e);
    }
  }

  public getFaucetBalance(): bigint | undefined {
    return this.#faucetBalance;
  }

  public async getAccountBalance(address: string): Promise<number> {
    const { data } = await polkadotApi.query.system.account(address);

    const { free: balanceFree } = data;

    return balanceFree
      .toBn()
      .div(new BN(10).pow(new BN(networkData.decimals)))
      .toNumber();
  }

  public async isAccountOverBalanceCap(address: string): Promise<boolean> {
    return (await this.getAccountBalance(address)) > networkData.balanceCap;
  }

  async teleportTokens(dripAmount: bigint, address: string, parachain_id: string): Promise<DripResponse> {
    logger.info("💸 teleporting tokens");

    const dest = {
      V3: {
        interior: {
          X1: {
            Parachain: parachain_id,
          },
        },
        parents: 0,
      },
    };

    const addressHex = polkadotApi.registry.createType("AccountId", address).toHex();
    const beneficiary = {
      V3: {
        interior: {
          X1: {
            AccountId32: { id: addressHex, network: null },
          },
        },
        parents: 0,
      },
    };

    const assets = {
      V3: [
        {
          fun: { Fungible: dripAmount },
          id: {
            Concrete: {
              interior: "Here",
              parents: 0,
            },
          },
        },
      ],
    };

    const weightLimit = { Unlimited: null };

    const feeAssetItem = 0;

    const transfer = polkadotApi.tx.xcmPallet.limitedTeleportAssets(
      dest,
      beneficiary,
      assets,
      feeAssetItem,
      weightLimit,
    );

    if (!this.account) throw new Error("account not ready");
    const hash = await transfer.signAndSend(this.account, { nonce: -1 });

    const result: DripResponse = { hash: hash.toHex() };
    return result;
  }

  async sendTokens(address: string, parachain_id: string, amount: bigint): Promise<DripResponse> {
    let dripTimeout: ReturnType<typeof rpcTimeout> | null = null;
    let result: DripResponse;
    const faucetBalance = this.getFaucetBalance();

    try {
      if (!this.account) throw new Error("account not ready");

      if (typeof faucetBalance !== "undefined" && amount >= faucetBalance) {
        const formattedAmount = formatAmount(amount);
        const formattedBalance = formatAmount(faucetBalance);

        throw new Error(
          `Can't send ${formattedAmount} ${networkData.currency}s, as balance is only ${formattedBalance} ${networkData.currency}s.`,
        );
      }

      // start a counter and log a timeout error if we didn't get an answer in time
      dripTimeout = rpcTimeout("drip");
      if (parachain_id != "") {
        result = await this.teleportTokens(amount, address, parachain_id);
      } else {
        logger.info("💸 sending tokens");
        const transfer = polkadotApi.tx.balances.transferKeepAlive(address, amount);
        const hash = await transfer.signAndSend(this.account, { nonce: -1 });
        result = { hash: hash.toHex() };
      }
    } catch (e) {
      result = { error: (e as Error).message || "An error occured when sending tokens" };
      logger.error("⭕ An error occured when sending tokens", e);
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
      return "0";
    }
  }
}

export default new PolkadotActions();
