import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { DripRequestType, DripResponse } from "../../types";
import { isGoogleAccountPrivileged, isMatrixAccountPrivileged } from "../../utils";
import { metricsDefinition } from "../constants";
import type { Actions } from "../services/Actions";
import type ActionStorage from "../services/ActionStorage";
import errorCounter from "../services/ErrorCounter";
import { Recaptcha } from "../services/Recaptcha";
import { GoogleAuth } from "./GoogleAuth";

export class DripRequestHandler {
  constructor(
    private actions: Actions,
    private storage: ActionStorage,
    private recaptcha: Recaptcha,
    private googleAuth: GoogleAuth,
  ) {}

  async handleRequest(
    opts:
      | ({ external: true; recaptcha: string; google_auth_token: string } & Omit<DripRequestType, "sender">)
      | ({ external: false; sender: string } & Omit<DripRequestType, "recaptcha" | "google_auth_token">),
  ): Promise<DripResponse> {
    const { external, address: addr, parachain_id, amount } = opts;
    metricsDefinition.data.total_requests++;

    let sender: string;
    let isPrivileged: boolean;
    if (external) {
      if (!(await this.recaptcha.validate(opts.recaptcha))) return { error: "Captcha validation was unsuccessful" };
      const userEmail = await this.googleAuth.validate(opts.google_auth_token);
      if (!userEmail) return { error: "Google Authentication was unsuccessful" };
      sender = userEmail;
      isPrivileged = isGoogleAccountPrivileged(sender);
    } else {
      sender = opts.sender;
      isPrivileged = isMatrixAccountPrivileged(sender);
    }

    const isAllowed = await this.storage.isValid({ username: sender, addr });
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
        this.storage.saveData({ username: sender, addr }).catch((e) => {
          logger.error(e);
          errorCounter.plusOne("other");
        });
      }

      return sendTokensResult;
    }
  }
}
