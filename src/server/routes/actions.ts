import express from "express";

import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { BalanceResponse, DripRequestType, DripResponse } from "../../types";
import { isAccountPrivileged } from "../../utils";
import { config } from "../config";
import { metricsDefinition } from "../constants";
import actions from "../services/Actions";
import ActionStorage from "../services/ActionStorage";
import errorCounter from "../services/ErrorCounter";

const router = express.Router();
const storage = new ActionStorage();

router.get<unknown, BalanceResponse>("/balance", (_, res) => {
  actions
    .getBalance()
    .then((balance) => res.send({ balance }))
    .catch((e) => {
      logger.error(e);
      errorCounter.plusOne("other");
      res.send({ balance: "0" });
    });
});

const dripRequestHandler = async (
  opts:
    | ({ external: true; recaptcha: string } & Omit<DripRequestType, "sender">)
    | ({ external: false; sender: string } & Omit<DripRequestType, "recaptcha">),
): Promise<DripResponse> => {
  const { external, address: addr, parachain_id, amount } = opts;
  metricsDefinition.data.total_requests++;

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

router.post<unknown, DripResponse, Partial<DripRequestType>>("/drip", async (req, res) => {
  try {
    const { address, parachain_id, amount, sender, recaptcha } = req.body;
    if (!address) return { error: "Missing parameter: 'address'" };
    if (!parachain_id) return { error: "Missing parameter: 'parachain_id'" };
    if (config.Get("EXTERNAL_ACCESS")) {
      if (!recaptcha) return { error: "Missing parameter: 'recaptcha'" };
      res.send(
        await dripRequestHandler({
          external: true,
          address,
          parachain_id,
          amount: config.Get("DRIP_AMOUNT"),
          recaptcha,
        }),
      );
    } else {
      if (!amount) return { error: "Missing parameter: 'amount'" };
      if (!sender) return { error: "Missing parameter: 'sender'" };
      res.send(await dripRequestHandler({ external: false, address, parachain_id, amount, sender }));
    }
  } catch (e) {
    logger.error(e);
    errorCounter.plusOne("other");
    res.send({ error: "Operation failed." });
  }
});

export default router;
