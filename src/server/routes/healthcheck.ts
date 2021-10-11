import { ApiPromise, HttpProvider } from '@polkadot/api';
import express from 'express';

import { getEnvVariable, logger } from '../../utils';
import { envVars } from '../serverEnvVars';

const healthcheckRouter = express.Router();

healthcheckRouter.get('/ready', async (_, res) => {
  const rpcEndpointUrl = getEnvVariable('RPC_ENDPOINT', envVars) as string;
  const provider = new HttpProvider(rpcEndpointUrl);
  const apiInstance = new ApiPromise({ provider });

  try {
    const isRPCReady = await apiInstance.isReady;

    if (isRPCReady) {
      res.status(200).send({
        msg: 'Faucet backend is ready',
      });
    }
  } catch (err) {
    logger.error('⭕ Faucet backend is not responding', err);
  } finally {
    res.status(503).send({
      msg: 'Faucet backend is NOT ready',
    });
  }
});

healthcheckRouter.get('/health', async (_, res) => {
  res.status(200).send({
    msg: 'Faucet backend is healthy.',
  });
});

export default healthcheckRouter;
