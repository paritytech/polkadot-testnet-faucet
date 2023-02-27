import cors from "cors";
import express, { NextFunction, Request, Response, Router } from "express";

import { WebBackendConfig } from "../../faucetConfig";
import { logger } from "../../logger";
import {
  BalanceResponse,
  BotRequestType,
  DripErrorResponse,
  DripRequestType,
  DripResponse,
  FaucetRequestType,
} from "../../types";
import { Actions } from "../services/Actions";
import ActionStorage from "../services/ActionStorage";
import { DripRequestHandler } from "../services/DripRequestHandler";
import errorCounter from "../services/ErrorCounter";
import { Recaptcha } from "../services/Recaptcha";

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

export const createActionsRouter = (
  opts: { type: "bot" } | { type: "web"; webConfig: WebBackendConfig },
  actions: Actions,
) => {
  const router = express.Router();
  router.use(cors());
  const storage = new ActionStorage();
  const recaptchaService = new Recaptcha();
  const dripRequestHandler = new DripRequestHandler(actions, storage, recaptchaService);

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

  if (opts.type === "bot") {
    addBotEndpoints({ router, dripRequestHandler });
  } else if (opts.type === "web") {
    addWebEndpoints({ router, dripRequestHandler, webConfig: opts.webConfig });
  }
  return router;
};

const addBotEndpoints = ({
  router,
  dripRequestHandler,
}: {
  router: Router;
  dripRequestHandler: DripRequestHandler;
}) => {
  router.post<unknown, DripResponse, PartialDrip<BotRequestType>>("/drip/bot", addressMiddleware, async (req, res) => {
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
};

const addWebEndpoints = ({
  router,
  dripRequestHandler,
  webConfig,
}: {
  router: Router;
  dripRequestHandler: DripRequestHandler;
  webConfig: WebBackendConfig;
}) => {
  router.post<unknown, DripResponse, PartialDrip<FaucetRequestType>>(
    "/drip/web",
    addressMiddleware,
    async (req, res) => {
      const { address, parachain_id, recaptcha } = req.body;
      if (!recaptcha) {
        return missingParameterError(res, "recaptcha");
      }
      try {
        const dripResult = await dripRequestHandler.handleRequest({
          external: true,
          address,
          parachain_id: parachain_id ?? "",
          amount: webConfig.Get("DRIP_AMOUNT"),
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
    },
  );
};
