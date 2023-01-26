import express from "express";

import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { BalanceResponse, DripRequestType, DripResponse } from "../../types";
import { isAccountPrivileged } from "../../utils";
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

const dripRequestHandler = async (requestOpts: DripRequestType): Promise<DripResponse> => {
  const { address, parachain_id, amount, sender } = requestOpts;
  metricsDefinition.data.total_requests++;

  const isAllowed = await storage.isValid({ username: sender, addr: address });
  const isPrivileged = isAccountPrivileged(sender);
  const isAccountOverBalanceCap = await actions.isAccountOverBalanceCap(address);

  // parity member have unlimited access :)
  if (!isAllowed && !isPrivileged) {
    return { error: `${sender} has reached their daily quota. Only request once per day.` };
  } else if (isAllowed && isAccountOverBalanceCap && !isPrivileged) {
    return { error: `${sender}'s balance is over the faucet's balance cap` };
  } else {
    const sendTokensResult = await actions.sendTokens(address, parachain_id, amount);

    // hash is null if something wrong happened
    if (isDripSuccessResponse(sendTokensResult)) {
      metricsDefinition.data.success_requests++;
      storage.saveData({ username: sender, addr: address }).catch((e) => {
        logger.error(e);
        errorCounter.plusOne("other");
      });
    }

    return sendTokensResult;
  }
};

router.post<unknown, DripResponse, DripRequestType>("/bot-endpoint", (req, res) => {
  dripRequestHandler(req.body)
    .then(res.send)
    .catch((e) => {
      logger.error(e);
      errorCounter.plusOne("other");
      res.send({ error: "Operation failed." });
    });
});

export default router;
