import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import errorCounter from "../../common/ErrorCounter";
import DripperStorage from "../../dripper/DripperStorage";
import { DripRequestHandler } from "../../dripper/DripRequestHandler";
import polkadotActions from "../../dripper/polkadot/PolkadotActions";
import { Recaptcha } from "../../dripper/Recaptcha";
import { logger } from "../../logger";
import {
  BalanceResponse,
  BotRequestType,
  DripErrorResponse,
  DripRequestType,
  DripResponse,
  FaucetRequestType,
} from "../../types";
import { serverConfig as config } from "../../config";

const router = express.Router();
router.use(cors());
const storage = new DripperStorage();
const recaptchaService = new Recaptcha();
const dripRequestHandler = new DripRequestHandler(polkadotActions, storage, recaptchaService);

router.get<unknown, BalanceResponse>("/balance", (_, res) => {
  polkadotActions
    .getBalance()
    .then((balance) => res.send({ balance }))
    .catch((e) => {
      logger.error(e);
      errorCounter.plusOne("other");
      res.send({ balance: "0" });
    });
});

const missingParameterError = (
  res: Response<DripErrorResponse>,
  parameter: keyof BotRequestType | keyof FaucetRequestType,
): void => {
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

type PartialDrip<T extends FaucetRequestType | BotRequestType> = Partial<T> & Pick<T, "address">;

router.post<unknown, DripResponse, PartialDrip<FaucetRequestType>>("/drip/web", addressMiddleware, async (req, res) => {
  if (!config.Get("EXTERNAL_ACCESS")) {
    return res.status(503).send({ error: "Endpoint unavailable" });
  }
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

export default router;
