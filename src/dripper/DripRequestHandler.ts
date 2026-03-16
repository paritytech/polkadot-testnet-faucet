import { isDripSuccessResponse } from "#src/guards";
import { logger } from "#src/logger";
import { counters } from "#src/metrics";
import { DripRequestType, DripResponse, TxStatusCallback } from "#src/types";
import { isAccountPrivileged } from "#src/utils";

import { hasDrippedToday, saveDrip } from "./dripperStorage.js";
import type { PolkadotActions } from "./polkadot/PolkadotActions.js";
import { Recaptcha } from "./Recaptcha.js";
import { verifySignature } from "./signatureVerify.js";

const validateParachainId = (parachain: string): number | null => {
  const id = Number.parseInt(parachain);
  if (isNaN(id)) {
    return null;
  }
  if (id !== 0 && (id < 999 || id >= 10_000)) {
    return null;
  }
  return id;
};

export class DripRequestHandler {
  constructor(
    private actions: PolkadotActions,
    private recaptcha: Recaptcha,
  ) {}

  async handleRequest(
    opts:
      | ({ external: true; recaptcha: string } & Omit<DripRequestType, "sender">)
      | ({ external: true; signature: string; message: string } & Omit<DripRequestType, "sender">)
      | ({ external: false; sender: string } & Omit<DripRequestType, "recaptcha">),
    onStatus?: TxStatusCallback,
  ): Promise<DripResponse> {
    const { external, address: addr, parachain_id, amount } = opts;
    counters.totalRequests.inc();

    if (external) {
      if ("signature" in opts) {
        if (!verifySignature(opts.signature, opts.message, addr)) {
          return { error: "Signature verification failed" };
        }
      } else if (!(await this.recaptcha.validate(opts.recaptcha))) {
        return { error: "Captcha validation was unsuccessful" };
      }
    }

    const validatedParachainId = parachain_id ? validateParachainId(parachain_id) : null;
    if (parachain_id && validatedParachainId === null) {
      return { error: "Parachain invalid. Be sure to set a value between 1000 and 9999" };
    }

    const isAllowed = !(await hasDrippedToday(external ? { addr } : { username: opts.sender, addr }));
    const isPrivileged = !external && isAccountPrivileged(opts.sender);
    const isAccountOverBalanceCap = await this.actions.isAccountOverBalanceCap(addr);

    // parity member have unlimited access :)
    if (!isAllowed && !isPrivileged) {
      return { error: `Requester has reached their daily quota. Only request once per day.` };
    } else if (isAllowed && isAccountOverBalanceCap && !isPrivileged) {
      return { error: `Requester's balance is over the faucet's balance cap` };
    } else {
      const sendTokensResult = await this.actions.sendTokens(addr, validatedParachainId, amount, onStatus);

      // hash is null if something wrong happened
      if (isDripSuccessResponse(sendTokensResult)) {
        counters.successfulRequests.inc();
        saveDrip(external ? { addr } : { username: opts.sender, addr }).catch((e) => {
          logger.error(e);
        });
      }

      return sendTokensResult;
    }
  }
}

let instance: DripRequestHandler | undefined;
export const getDripRequestHandlerInstance = (polkadotActions: PolkadotActions) => {
  if (!instance) {
    const recaptchaService = new Recaptcha();
    instance = new DripRequestHandler(polkadotActions, recaptchaService);
  }
  return instance;
};
