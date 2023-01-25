import express from "express";

import { isDripSuccessResponse } from "../../guards";
import { logger } from "../../logger";
import { BalanceResponse, BotRequestType, DripResponse } from "../../types";
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

router.post<unknown, DripResponse, BotRequestType>("/bot-endpoint", (req, res) => {
  const { address, parachain_id, amount, sender } = req.body;
  metricsDefinition.data.total_requests++;

  storage
    .isValid(sender, address)
    .then(async (isAllowed) => {
      const isPrivileged = isAccountPrivileged(sender);
      const isAccountOverBalanceCap = await actions.isAccountOverBalanceCap(address);

      // parity member have unlimited access :)
      if (!isAllowed && !isPrivileged) {
        res.send({ error: `${sender} has reached their daily quota. Only request once per day.` });
      } else if (isAllowed && isAccountOverBalanceCap && !isPrivileged) {
        res.send({ error: `${sender}'s balance is over the faucet's balance cap` });
      } else {
        const sendTokensResult = await actions.sendTokens(address, parachain_id, amount);

        // hash is null if something wrong happened
        if (isDripSuccessResponse(sendTokensResult)) {
          metricsDefinition.data.success_requests++;
          storage.saveData(sender, address).catch((e) => {
            logger.error(e);
            errorCounter.plusOne("other");
          });
        }

        res.send(sendTokensResult);
      }
    })
    .catch((e) => {
      logger.error(e);
      errorCounter.plusOne("other");
      res.send({ error: "Operation failed." });
    });
});

export default router;
