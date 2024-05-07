import { isDripSuccessResponse } from "src/guards";
import { logger } from "src/logger";
import { counters } from "src/metrics";
import { CaptchaProvider, DripRequestType, DripResponse } from "src/types";
import { isAccountPrivileged } from "src/utils";

import { hasDrippedToday, saveDrip } from "./dripperStorage";
import type { PolkadotActions } from "./polkadot/PolkadotActions";
import { Procaptcha } from "./Procaptcha";
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

type HandleRequestOpts =
  | ({ external: true; captchaResponse: string } & Omit<DripRequestType, "sender">)
  | ({ external: false; sender: string } & Omit<DripRequestType, "captchaResponse">);

export class DripRequestHandler {
  // eslint-disable-next-line
  constructor(private actions: PolkadotActions, private captchaService: Procaptcha | Recaptcha) {}

  async handleRequest(opts: HandleRequestOpts): Promise<DripResponse> {
    const { external, address: addr, parachain_id, amount } = opts;
    counters.totalRequests.inc();

    if (external) {
      const captchaValidate = await this.captchaService.validate(opts.captchaResponse);
      logger.debug(`Captcha validate response: ${JSON.stringify(captchaValidate)}`);
      if (!captchaValidate)
        return { error: `Captcha validation was unsuccessful. Captcha response was: ${opts.captchaResponse}` };
    }
    if (!isParachainValid(parachain_id))
      return { error: "Parachain invalid. Be sure to set a value between 1000 and 9999" };

    const isAllowed = !(await hasDrippedToday(external ? { addr } : { username: opts.sender, addr }));
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
export const getDripRequestHandlerInstance = (polkadotActions: PolkadotActions, captchaProvider: CaptchaProvider) => {
  if (!instance) {
    const captchaService = captchaProvider === CaptchaProvider.procaptcha ? new Procaptcha() : new Recaptcha();
    instance = new DripRequestHandler(polkadotActions, captchaService);
  }
  return instance;
};
