import { Request, Response } from 'express';

import { logger } from '../utils';
import apiInstance from './rpc';

export const checkHealth = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    await apiInstance.isReady;
    res.status(200).send({ msg: 'Faucet backend is healthy.' });
  } catch (e) {
    logger.error(`⭕ Api error: ${(e as Error).message}`);
    res.status(503).send({ msg: 'Faucet backend is NOT healthy.' });
  }
};
