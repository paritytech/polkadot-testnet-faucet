import express, { Request, Response } from "express";

import { logger } from "../../logger";
import { config } from "../config";
import polkadotApi from "../../dripper/polkadot/polkadotApi";

const router = express.Router();

const checkHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    await polkadotApi.isReady;
    res.status(200).send({ msg: "Faucet backend is healthy." });
  } catch (e) {
    logger.error(`⭕ Api error: ${(e as Error).message}`);
    res.status(503).send({ msg: "Faucet backend is NOT healthy." });
  }
};

export type APIVersionResponse = { version: string; time: string };
const version = async (req: Request, res: Response) => {
  try {
    const appDeployedRef = config.Get("DEPLOYED_REF");
    const appDeployedTime = config.Get("DEPLOYED_TIME");
    res.status(200).send({ time: appDeployedTime, version: appDeployedRef } as APIVersionResponse);
  } catch (e) {
    logger.error(`⭕ Api error: ${(e as Error).message}`);
    res.status(503).send({ msg: "Faucet backend is NOT healthy." });
  }
};

router.get("/ready", checkHealth);
router.get("/health", checkHealth);
router.get("/version", version);

export default router;
