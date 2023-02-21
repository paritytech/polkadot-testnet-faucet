import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import { logger } from "../../logger";
import {
  BalanceResponse,
  BotDripRequestType,
  DripErrorResponse,
  DripRequestType,
  DripResponse,
  FaucetRequestType,
} from "../../types";
import { config } from "../config";
import actions from "../services/Actions";
import ActionStorage from "../services/ActionStorage";
import { DripRequestHandler } from "../services/DripRequestHandler";
import errorCounter from "../services/ErrorCounter";
import { Recaptcha } from "../services/Recaptcha";

const router = express.Router();
router.use(cors());
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

const missingParameterError = (res: Response<DripErrorResponse>, parameter: keyof BotDripRequestType | keyof FaucetRequestType): void => {
  res.status(400).send({ error: `Missing parameter: '${parameter}'` });
};

const addressMiddleware = (
  req: Request<unknown, DripResponse, Partial<DripRequestType>>,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.body.address) {
    return missingParameterError(res, "address");
  }
  next();
};

const dripRequestHandler = new DripRequestHandler(actions, storage, recaptchaService);

router.post<unknown, DripResponse, FaucetRequestType>("/faucet", addressMiddleware, async (req, res) => {
  const { address, parachain_id, recaptcha } = req.body;
  if (!recaptcha) {
    return missingParameterError(res, "recaptcha");
  }
  try {
    const dripResult = await dripRequestHandler.handleRequest({
      external: true,
      address,
      parachain_id: parachain_id ?? "",
      amount: config.Get("DRIP_AMOUNT"),
      recaptcha,
    });

    if ((dripResult as DripErrorResponse).error) {
      res.status(500).send(dripResult);
    } else {
      res.send(dripResult);
    }
  } catch (e) {
    logger.error(e);
    errorCounter.plusOne("other");
    res.status(500).send({ error: "Operation failed." });
  }
});

router.post<unknown, DripResponse, BotDripRequestType>("/drip-v2", addressMiddleware, async (req, res) => {
  const { address, parachain_id, amount, sender } = req.body;
  if (!amount) {
    return missingParameterError(res, "amount");
  }
  if (!sender) {
    return missingParameterError(res, "sender");
  }
  try {
    res.send(
      await dripRequestHandler.handleRequest({
        external: false,
        address,
        parachain_id: parachain_id ?? "",
        amount,
        sender,
      }),
    );
  } catch (e) {
    logger.error(e);
    errorCounter.plusOne("other");
    res.status(500).send({ error: "Operation failed." });
  }
});

router.post<unknown, DripResponse, Partial<DripRequestType>>("/drip", async (req, res) => {
  try {
    const { address, parachain_id, amount, sender, recaptcha } = req.body;
    if (!address) {
      return missingParameterError(res, "address");
    }
    if (config.Get("EXTERNAL_ACCESS")) {
      if (!recaptcha) {
        return missingParameterError(res, "recaptcha");
      }
      res.send(
        await dripRequestHandler.handleRequest({
          external: true,
          address,
          parachain_id: parachain_id ?? "",
          amount: config.Get("DRIP_AMOUNT"),
          recaptcha,
        }),
      );
    } else {
      if (!amount) {
        return missingParameterError(res, "amount");
      }
      if (!sender) {
        return missingParameterError(res, "sender");
      }
      res.send(
        await dripRequestHandler.handleRequest({
          external: false,
          address,
          parachain_id: parachain_id ?? "",
          amount,
          sender,
        }),
      );
    }
  } catch (e) {
    logger.error(e);
    errorCounter.plusOne("other");
    res.status(400).send({ error: "Operation failed." });
  }
});

export default router;
