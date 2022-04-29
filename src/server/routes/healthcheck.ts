import express, { Request, Response } from 'express';

import { logger } from '../../logger';
import polkadotApi from '../polkadotApi';

const router = express.Router();

const checkHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    await polkadotApi.isReady;
    res.status(200).send({ msg: 'Faucet backend is healthy.' });
  } catch (e) {
    logger.error(`⭕ Api error: ${(e as Error).message}`);
    res.status(503).send({ msg: 'Faucet backend is NOT healthy.' });
  }
};

router.get('/ready', checkHealth);
router.get('/health', checkHealth);

export default router;
