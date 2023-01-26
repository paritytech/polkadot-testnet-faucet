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

if (config.Get("EXTERNAL_ACCESS")) {
  logger.info("The faucet is externally accessible for drip requests.");
  router.post<unknown, DripResponse, DripRequestType>("/drip", async (req, res) => {
    try {
      const isValid = await storage.isValid({ ip: req.ip });
      if (!isValid) {
        res.send({ error: `This IP address has reached its daily quota. Please wait before retrying.` });
        return;
      }
      const result = await dripRequestHandler(req.body);
      if ("hash" in result) {
        await storage.saveData({ ip: req.ip });
      }
      res.send(result);
    } catch (e) {
      logger.error(e);
      errorCounter.plusOne("other");
      res.send({ error: "Operation failed." });
    }
  });
} else {
  logger.info("The faucet is listening for requests from the matrix bot.");
  router.post<unknown, DripResponse, DripRequestType>("/bot-endpoint", async (req, res) => {
    try {
      res.send(await dripRequestHandler(req.body));
    } catch (e) {
      logger.error(e);
      errorCounter.plusOne("other");
      res.send({ error: "Operation failed." });
    }
  });
}

export default router;
