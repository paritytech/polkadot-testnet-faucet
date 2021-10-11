import express from 'express';

import { isDripSuccessResponse } from '../../guards';
import type {
  BalanceResponse,
  BotRequestType,
  DripResponse,
} from '../../types';
import { logger } from '../../utils';
import Actions from '../actions';
import { metrics } from '../constants/prometheus';
import errorCounter from '../ErrorCounter';
import Storage from '../storage';

const actionRouter = express.Router();

actionRouter.get<unknown, BalanceResponse>('/balance', async (_, res) => {
  const actions = new Actions();

  actions
    .getBalance()
    .then((balance) => res.send({ balance }))
    .catch((e) => {
      logger.error(e);
      errorCounter.plusOne('other');
    });
});

actionRouter.post<unknown, DripResponse, BotRequestType>(
  '/bot-endpoint',
  async (req, res) => {
    const { address, amount, sender } = req.body;
    const actions = new Actions();
    const storage = new Storage();

    metrics.data.total_requests++;

    storage
      .isValid(sender, address)
      .then(async (isAllowed) => {
        const isPrivileged =
          sender.endsWith(':matrix.parity.io') ||
          sender.endsWith(':web3.foundation');

        // parity member have unlimited access :)
        if (!isAllowed && !isPrivileged) {
          res.send({
            error: `${sender} has reached their daily quota. Only request once per day.`,
          });
        } else {
          const sendTokensResult = await actions.sendTokens(address, amount);

          // hash is null if something wrong happened
          if (isDripSuccessResponse(sendTokensResult)) {
            metrics.data.success_requests++;
            storage.saveData(sender, address).catch((e) => {
              logger.error(e);
              errorCounter.plusOne('other');
            });
          }

          res.send(sendTokensResult);
        }
      })
      .catch((e) => {
        logger.error(e);
        errorCounter.plusOne('other');
      });
  }
);

export default actionRouter;
