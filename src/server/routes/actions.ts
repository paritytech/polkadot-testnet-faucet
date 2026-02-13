import { config } from "#src/config";
import { getDripRequestHandlerInstance } from "#src/dripper/DripRequestHandler";
import polkadotActions from "#src/dripper/polkadot/PolkadotActions";
import { convertAmountToBn, formatAmount } from "#src/dripper/polkadot/utils";
import { logger } from "#src/logger";
import { getNetworkData } from "#src/papi/index";
import {
  BalanceResponse,
  BotRequestType,
  DetailedBalanceResponse,
  DripErrorResponse,
  DripRequestType,
  DripResponse,
  FaucetRequestType,
  TxStatus,
} from "#src/types";
import { ethAddressToSS58 } from "#src/utils";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const router = express.Router();
router.use(cors());
const dripRequestHandler = getDripRequestHandlerInstance(polkadotActions);

router.get<unknown, BalanceResponse>("/balance", (_, res) => {
  polkadotActions
    .getFaucetBalance()
    .then((balance) => res.send({ balance: formatAmount(balance) }))
    .catch((e) => {
      logger.error(e);
      res.send({ balance: "0" });
    });
});

router.get<{ address: string }, DetailedBalanceResponse | DripErrorResponse>("/balance/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const balance = await polkadotActions.getAccountDetailedBalance(address);
    res.send(balance);
  } catch (e) {
    logger.error(e);
    res.status(400).send({ error: "Could not fetch balance" });
  }
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
  const { parachain_id, recaptcha } = req.body;
  if (!recaptcha) {
    return missingParameterError(res, "recaptcha");
  }

  let { address } = req.body;

  logger.debug(`Dripping to ${address}, parachain id ${parachain_id}`);
  if (address.startsWith("0x")) {
    address = ethAddressToSS58(address, networkData.data.ethToSS58FillPrefix);
    logger.debug(`Converted ETH address to ${address}`);
  }

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const writeLine = (data: { status?: TxStatus; hash?: string; blockHash?: string; error?: string }) => {
    logger.debug(`Stream write: ${JSON.stringify(data)}`);
    res.write(JSON.stringify(data) + "\n");
  };

  try {
    const dripResult = await dripRequestHandler.handleRequest(
      {
        external: true,
        address,
        parachain_id: parachain_id ?? "",
        amount: convertAmountToBn(networkData.data.dripAmount),
        recaptcha,
      },
      (status, hash, blockHash) =>
        writeLine({ status, ...(hash ? { hash } : {}), ...(blockHash ? { blockHash } : {}) }),
    );

    writeLine(dripResult);
    res.end();
  } catch (e) {
    logger.error(e);
    writeLine({ error: "Operation failed." });
    res.end();
  }
});

export default router;
