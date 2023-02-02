import express from "express";

import { logger } from "../../logger";
import { BalanceResponse, DripRequestType, DripResponse } from "../../types";
import { config } from "../config";
import actions from "../services/Actions";
import ActionStorage from "../services/ActionStorage";
import errorCounter from "../services/ErrorCounter";
import { Recaptcha } from "../services/Recaptcha";
import { DripRequestHandler } from "./DripRequestHandler";
import cors from "cors"

const router = express.Router({});
router.use(cors())
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

const dripRequestHandler = new DripRequestHandler(actions, storage, recaptchaService);

router.post<unknown, DripResponse, Partial<DripRequestType>>("/drip", async (req, res) => {
  try {
    const { address, parachain_id, amount, sender, recaptcha } = req.body;
    if (!address) {
      res.send({ error: "Missing parameter: 'address'" });
      return;
    }
    if (!parachain_id) {
      res.send({ error: "Missing parameter: 'parachain_id'" });
      return;
    }
    if (config.Get("EXTERNAL_ACCESS")) {
      if (!recaptcha) {
        res.send({ error: "Missing parameter: 'recaptcha'" });
        return;
      }
      res.send(
        await dripRequestHandler.handleRequest({
          external: true,
          address,
          parachain_id,
          amount: config.Get("DRIP_AMOUNT"),
          recaptcha,
        }),
      );
    } else {
      if (!amount) {
        res.send({ error: "Missing parameter: 'amount'" });
        return;
      }
      if (!sender) {
        res.send({ error: "Missing parameter: 'sender'" });
        return;
      }
      res.send(await dripRequestHandler.handleRequest({ external: false, address, parachain_id, amount, sender }));
    }
  } catch (e) {
    logger.error(e);
    errorCounter.plusOne("other");
    res.send({ error: "Operation failed." });
  }
});

export default router;
