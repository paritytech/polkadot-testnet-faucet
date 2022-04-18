import { Request, Response } from 'express';

import { logger } from '../utils';
import rpcApiInstance from './lib/rpcApiInstance';

export const checkHealth = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    await rpcApiInstance.isReady;
    res.status(200).send({ msg: 'Faucet backend is healthy.' });
  } catch (e) {
    logger.error(`⭕ Api error: ${(e as Error).message}`);
    res.status(503).send({ msg: 'Faucet backend is NOT healthy.' });
  }
};
