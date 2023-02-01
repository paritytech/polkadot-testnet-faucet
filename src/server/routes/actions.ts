import express from "express";

import { logger } from "../../logger";
import { BalanceResponse, DripRequestType, DripResponse } from "../../types";
import { config } from "../config";
import actions from "../services/Actions";
import ActionStorage from "../services/ActionStorage";
import errorCounter from "../services/ErrorCounter";
import { Recaptcha } from "../services/Recaptcha";
import { getDripRequestHandler } from "./dripRequestHandler";

const router = express.Router();
const storage = new ActionStorage();
const recaptchaService = new Recaptcha();

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

const dripRequestHandler = getDripRequestHandler(actions, storage, recaptchaService);

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
