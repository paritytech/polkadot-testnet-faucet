import { ss58Address } from "@polkadot-labs/hdkd-helpers";
import { config } from "#src/config";
import { logger } from "#src/logger";
import { client, getNetworkData } from "#src/papi/index";
import { signer } from "#src/papi/signer";
import { DripResponse, TxStatusCallback } from "#src/types";
import { AccountId, Binary } from "polkadot-api";
import { shareReplay } from "rxjs";

import { formatAmount } from "./utils.js";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const rpcTimeout = (service: string) => {
  const timeout = 100_000;
  return setTimeout(() => {
    // log an error in console and in prometheus if the timeout is reached
    logger.error(`⭕ Oops, ${service} took more than ${timeout}ms to answer`);
  }, timeout);
};

const NONCE_SYNC_INTERVAL = 10_000;

const encodeAccount = AccountId().enc;

type TxHash = string;

export class PolkadotActions {
  address: string;
  #faucetBalance: bigint | undefined;
  isReady: Promise<void>;
  #nonce: Promise<number>;
  #pendingTransactions: Set<string>;

  constructor() {
    logger.info("🚰 Plip plop - Creating the faucets's account");

    this.address = ss58Address(signer.publicKey);
    logger.info(`Faucet address is ${this.address}`);

    /**
     * Nonce synchronization is tricky. Blindly incrementing nonce each transaction might brick the faucet effectively.
     * However, nonce is incremented on network when last transaction finalizes.
     *
     * Thus, we're skipping syncs if we have pending transactions, while having this.#nonce as a Promise
     * allows us to wait for sync to end, before submitting next transaction
     */
    this.#nonce = networkData.api.getNonce(this.address, client);
    this.#pendingTransactions = new Set();
    setInterval(() => {
      if (this.#pendingTransactions.size === 0) {
        const oldNoncePromise = this.#nonce;
        this.#nonce = networkData.api.getNonce(this.address, client);

        // In cases of nonce mismatch, it might be useful to have nonce change in logs
        this.#nonce.then(async (newNonce) => {
          const oldNonce = await oldNoncePromise;
          if (newNonce !== oldNonce) {
            logger.debug(`Nonce updated from ${oldNonce} to ${newNonce}`);
          }
        });
      }
    }, NONCE_SYNC_INTERVAL);

    this.isReady = (async () => {
      this.#faucetBalance = await networkData.api.getBalance(this.address, client);
      logger.info(`Faucet balance fetched, it's now ${formatAmount(this.#faucetBalance)} ${networkData.data.currency}`);
    })();

    networkData.api.watchBalance(this.address, client, (value) => {
      if (value != this.#faucetBalance) {
        this.#faucetBalance = value;
        logger.info(
          `Faucet balance update. It's now ${formatAmount(this.#faucetBalance)} ${networkData.data.currency}`,
        );
      }
    });
  }

  // Synchronously queues nonce increment
  private getNonce(): Promise<number> {
    const currentNonce = this.#nonce;
    this.#nonce = this.#nonce.then((nonce) => nonce + 1);
    return currentNonce;
  }

  public async getFaucetBalance(): Promise<bigint> {
    // This should mean that #faucetBalance is initialized
    await this.isReady;
    if (this.#faucetBalance === undefined) {
      // So this shouldn't be possible
      throw new Error("#faucetBalance: uninitialized");
    }
    return this.#faucetBalance;
  }

  public async getAccountBalance(address: string): Promise<number> {
    const balance = await networkData.api.getBalance(address, client);

    return Number(balance / 10n ** BigInt(networkData.data.decimals));
  }

  public async getAccountDetailedBalance(
    address: string,
  ): Promise<{ transferable: string; reserved: string; overCap: boolean }> {
    const { free, reserved, frozen } = await networkData.api.getDetailedBalance(address, client);
    const divisor = 10n ** BigInt(networkData.data.decimals);
    const frozenMinusReserved = frozen > reserved ? frozen - reserved : 0n;
    const transferable = free > frozenMinusReserved ? free - frozenMinusReserved : 0n;
    const accountBalance = Number(free / divisor);
    return {
      transferable: String(Number(transferable) / Number(divisor)),
      reserved: String(Number(reserved) / Number(divisor)),
      overCap: accountBalance > networkData.data.balanceCap,
    };
  }

  public async isAccountOverBalanceCap(address: string): Promise<boolean> {
    return (await this.getAccountBalance(address)) > networkData.data.balanceCap;
  }

  private async sendTx(tx: string, onStatus?: TxStatusCallback): Promise<TxHash> {
    this.#pendingTransactions.add(tx);
    onStatus?.("broadcasting");

    const submit$ = client.submitAndWatch(tx).pipe(shareReplay(1));

    return await new Promise<TxHash>((resolve, reject) => {
      let hash = "";
      let resolved = false;

      submit$.subscribe({
        next: (event) => {
          logger.debug(`Tx event: ${event.type}`);
          if (event.type === "broadcasted") {
            onStatus?.("broadcasted");
          } else if (event.type === "txBestBlocksState" && event.found) {
            hash = event.txHash;
            onStatus?.("included", hash, event.block.hash);
            // Resolve as soon as the tx is included in a block — no need
            // to block the response for finalization (~30-40s on Paseo).
            if (!resolved) {
              resolved = true;
              resolve(hash);
            }
          } else if (event.type === "finalized") {
            hash = event.txHash;
            logger.info(`Transaction ${hash} finalized`);
            if (!resolved) {
              resolved = true;
              resolve(hash);
            }
          }
        },
        error: (err) => {
          this.#pendingTransactions.delete(tx);
          logger.error(`Transaction ${hash || "unknown"} failed`, err);
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        },
        complete: () => {
          this.#pendingTransactions.delete(tx);
          if (!resolved) {
            reject(new Error("Transaction completed without hash"));
          }
        },
      });
    });
  }

  async teleportTokens(
    dripAmount: bigint,
    address: string,
    parachain_id: number,
    onStatus?: TxStatusCallback,
  ): Promise<DripResponse> {
    logger.info(`💸 teleporting tokens to ${address}, parachain ${parachain_id}`);

    const addressBinary = Binary.fromBytes(encodeAccount(address));

    const nonce = await this.getNonce();
    const tx = await networkData.api.getTeleportTx({
      dripAmount,
      address: addressBinary,
      parachain_id,
      client,
      nonce,
    });

    logger.debug(`Teleporting to ${address}: ${parachain_id}. Transaction ${tx}; nonce: ${nonce}`);

    const hash = await this.sendTx(tx, onStatus);

    logger.info(`💸 teleporting tokens to ${address}, parachain ${parachain_id}: done: ${hash}`);
    return { hash };
  }

  async transferTokens(dripAmount: bigint, address: string, onStatus?: TxStatusCallback): Promise<DripResponse> {
    logger.info(`💸 sending tokens to ${address}`);
    const nonce = await this.getNonce();
    const tx = await networkData.api.getTransferTokensTx({
      dripAmount,
      address,
      client,
      nonce,
    });
    logger.debug(`Dripping to ${address}. Transaction ${tx}; nonce: ${nonce}`);

    const hash = await this.sendTx(tx, onStatus);

    logger.info(`💸 sending tokens to ${address}: done: ${hash}`);
    return { hash };
  }

  async sendTokens(
    address: string,
    parachain_id: number | null,
    amount: bigint,
    onStatus?: TxStatusCallback,
  ): Promise<DripResponse> {
    let dripTimeout: ReturnType<typeof rpcTimeout> | null = null;
    let result: DripResponse;

    try {
      if (typeof this.#faucetBalance !== "undefined" && amount >= this.#faucetBalance) {
        const formattedAmount = formatAmount(amount);
        const formattedBalance = formatAmount(this.#faucetBalance);

        throw new Error(
          `Can't send ${formattedAmount} ${networkData.data.currency}s, as balance is only ${formattedBalance} ${networkData.data.currency}s.`,
        );
      }

      // start a counter and log a timeout error if we didn't get an answer in time
      dripTimeout = rpcTimeout("drip");
      if (parachain_id !== null) {
        if (parachain_id == networkData.data.id) {
          result = await this.transferTokens(amount, address, onStatus);
        } else if (networkData.data.teleportEnabled) {
          result = await this.teleportTokens(amount, address, parachain_id, onStatus);
        } else {
          result = { error: `Teleport is disabled for ${networkData.data.networkName}` };
        }
      } else {
        result = await this.transferTokens(amount, address, onStatus);
      }
    } catch (e) {
      logger.error("⭕ An error occured when sending tokens", e);
      let message = "An error occured when sending tokens";
      if (e instanceof Error) {
        message = e.message;
      }
      result = { error: message };
    }

    // we got and answer reset the timeout
    if (dripTimeout) clearTimeout(dripTimeout);

    return result;
  }
}

export default new PolkadotActions();
