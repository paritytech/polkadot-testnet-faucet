import express, { Request, Response } from "express";

import { config } from "../../config";
import polkadotApi from "../../dripper/polkadot/polkadotApi";
import { logger } from "../../logger";

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

export type APIVersionResponse = { version: string };
const version = async (req: Request, res: Response) => {
  try {
    const appDeployedRef = config.Get("DEPLOYED_REF");
    res.status(200).send({ version: appDeployedRef } as APIVersionResponse);
  } catch (e) {
    logger.error(`⭕ Api error: ${(e as Error).message}`);
    res.status(503).send({ msg: "Faucet backend is NOT healthy." });
  }
};

router.get("/ready", checkHealth);
router.get("/health", checkHealth);
router.get("/version", version);

export default router;
