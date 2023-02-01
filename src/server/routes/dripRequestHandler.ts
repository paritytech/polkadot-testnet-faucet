import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { DripRequestType, DripResponse } from "../../types";
import { isAccountPrivileged } from "../../utils";
import { metricsDefinition } from "../constants";
import type { Actions } from "../services/Actions";
import type ActionStorage from "../services/ActionStorage";
import errorCounter from "../services/ErrorCounter";
import { Recaptcha } from "../services/Recaptcha";

export const getDripRequestHandler =
  (actions: Actions, storage: ActionStorage, recaptcha: Recaptcha) =>
  async (
    opts:
      | ({ external: true; recaptcha: string } & Omit<DripRequestType, "sender">)
      | ({ external: false; sender: string } & Omit<DripRequestType, "recaptcha">),
  ): Promise<DripResponse> => {
    const { external, address: addr, parachain_id, amount } = opts;
    metricsDefinition.data.total_requests++;

    if (external && !(await recaptcha.validate(opts.recaptcha)))
      return { error: "Captcha validation was unsuccessful" };
    const isAllowed = await storage.isValid(external ? { addr } : { username: opts.sender, addr });
    const isPrivileged = !external && isAccountPrivileged(opts.sender);
    const isAccountOverBalanceCap = await actions.isAccountOverBalanceCap(addr);

    // parity member have unlimited access :)
    if (!isAllowed && !isPrivileged) {
      return { error: `Requester has reached their daily quota. Only request once per day.` };
    } else if (isAllowed && isAccountOverBalanceCap && !isPrivileged) {
      return { error: `Requester's balance is over the faucet's balance cap` };
    } else {
      const sendTokensResult = await actions.sendTokens(addr, parachain_id, amount);

      // hash is null if something wrong happened
      if (isDripSuccessResponse(sendTokensResult)) {
        metricsDefinition.data.success_requests++;
        storage.saveData(external ? { addr } : { username: opts.sender, addr }).catch((e) => {
          logger.error(e);
          errorCounter.plusOne("other");
        });
      }

      return sendTokensResult;
    }
  };
