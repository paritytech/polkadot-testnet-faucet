import errorCounter from "../common/ErrorCounter";
import { metricsDefinition } from "../common/metricsDefinition";
import DripperStorage from "../dripper/DripperStorage";
import { isDripSuccessResponse } from "../guards";
import { logger } from "../logger";
import { DripRequestType, DripResponse } from "../types";
import { isAccountPrivileged } from "../utils";
import type { PolkadotActions } from "./polkadot/PolkadotActions";
import { Recaptcha } from "./Recaptcha";

const isParachainValid = (parachain: string): boolean => {
  if (!parachain) {
    return true;
  }

  const id = Number.parseInt(parachain);
  if (isNaN(id)) {
    return false;
  }
  return id > 999 && id < 10_000;
};

export class DripRequestHandler {
  constructor(private actions: PolkadotActions, private storage: DripperStorage, private recaptcha: Recaptcha) {}

  async handleRequest(
    opts:
      | ({ external: true; recaptcha: string } & Omit<DripRequestType, "sender">)
      | ({ external: false; sender: string } & Omit<DripRequestType, "recaptcha">),
  ): Promise<DripResponse> {
    const { external, address: addr, parachain_id, amount } = opts;
    metricsDefinition.data.total_requests++;

    if (external && !(await this.recaptcha.validate(opts.recaptcha)))
      return { error: "Captcha validation was unsuccessful" };
    if (!isParachainValid(parachain_id))
      return { error: "Parachain invalid. Be sure to set a value between 1000 and 9999" };

    const isAllowed = await this.storage.isValid(external ? { addr } : { username: opts.sender, addr });
    const isPrivileged = !external && isAccountPrivileged(opts.sender);
    const isAccountOverBalanceCap = await this.actions.isAccountOverBalanceCap(addr);

    // parity member have unlimited access :)
    if (!isAllowed && !isPrivileged) {
      return { error: `Requester has reached their daily quota. Only request once per day.` };
    } else if (isAllowed && isAccountOverBalanceCap && !isPrivileged) {
      return { error: `Requester's balance is over the faucet's balance cap` };
    } else {
      const sendTokensResult = await this.actions.sendTokens(addr, parachain_id, amount);

      // hash is null if something wrong happened
      if (isDripSuccessResponse(sendTokensResult)) {
        metricsDefinition.data.success_requests++;
        this.storage.saveData(external ? { addr } : { username: opts.sender, addr }).catch((e) => {
          logger.error(e);
          errorCounter.plusOne("other");
        });
      }

      return sendTokensResult;
    }
  }
}

let instance: DripRequestHandler | undefined;
export const getDripRequestHandlerInstance = (polkadotActions: PolkadotActions) => {
  if (!instance) {
    const storage = new DripperStorage();
    const recaptchaService = new Recaptcha();
    instance = new DripRequestHandler(polkadotActions, storage, recaptchaService);
  }
  return instance;
};
