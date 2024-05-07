import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import { config } from "../../config";
import { getDripRequestHandlerInstance } from "../../dripper/DripRequestHandler";
import polkadotActions from "../../dripper/polkadot/PolkadotActions";
import { convertAmountToBn } from "../../dripper/polkadot/utils";
import { logger } from "../../logger";
import { getNetworkData } from "../../networkData";
import {
  BalanceResponse,
  BotRequestType,
  CaptchaProvider,
  DripErrorResponse,
  DripRequestType,
  DripResponse,
  FaucetRequestType,
} from "../../types";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);
const captchaProvider = config.Get("CAPTCHA_PROVIDER") as CaptchaProvider;

const router = express.Router();
router.use(cors());
const dripRequestHandler = getDripRequestHandlerInstance(polkadotActions, captchaProvider);

router.get<unknown, BalanceResponse>("/balance", (_, res) => {
  polkadotActions
    .getBalance()
    .then((balance) => res.send({ balance }))
    .catch((e) => {
      logger.error(e);
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
  const { address, parachain_id } = req.body;
  const captchaResponse = req.body.captchaResponse;
  if (!captchaResponse) {
    return missingParameterError(res, "captchaResponse");
  }
  try {
    const dripResult = await dripRequestHandler.handleRequest({
      external: true,
      address,
      parachain_id: parachain_id ?? "",
      amount: convertAmountToBn(networkData.dripAmount),
      captchaResponse,
    });

    if ((dripResult as DripErrorResponse).error) {
      res.status(400).send(dripResult);
    } else {
      res.send(dripResult);
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send({ error: "Operation failed." });
  }
});

export default router;
