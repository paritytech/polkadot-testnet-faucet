import { isDripSuccessResponse } from "../guards";
import { logger } from "../logger";
import { counters } from "../metrics";
import { DripRequestType, DripResponse } from "../types";
import { isAccountPrivileged } from "../utils";
import { Captcha } from "./Captcha";
import { hasDrippedToday, saveDrip } from "./dripperStorage";
import type { PolkadotActions } from "./polkadot/PolkadotActions";

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
  constructor(
    private actions: PolkadotActions,
    private captcha: Captcha,
  ) {}

  async handleRequest(
    opts:
      | ({ external: true; captcha: string } & Omit<DripRequestType, "sender">)
      | ({ external: false; sender: string } & Omit<DripRequestType, "captcha">),
  ): Promise<DripResponse> {
    const { external, address: addr, parachain_id, amount } = opts;
    counters.totalRequests.inc();

    if (external && !(await this.captcha.validate(opts.captcha)))
      return { error: "Captcha validation was unsuccessful" };
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
export const getDripRequestHandlerInstance = (polkadotActions: PolkadotActions) => {
  if (!instance) {
    const captchaService = new Captcha();
    instance = new DripRequestHandler(polkadotActions, captchaService);
  }
  return instance;
};
