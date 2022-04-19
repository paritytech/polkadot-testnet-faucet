import 'dotenv/config';

import { packageInfo } from '@polkadot/api';
import bodyParser from 'body-parser';
import express from 'express';

import * as pkg from '../../package.json';
import config from '../config';
import { isDripSuccessResponse } from '../guards';
import type {
  BalanceResponse,
  BotRequestType,
  DripResponse,
  MetricsDefinition,
} from '../types';
import { isAccountPrivileged, logger } from '../utils';
import Actions from './actions';
import { checkHealth } from './checkHealth';
import errorCounter from './ErrorCounter';
import Storage from './storage';

const storage = new Storage();
const actions = new Actions();

const metrics: MetricsDefinition = {
  data: {
    balance: 0,
    errors_rpc_timeout: 0,
    errors_total: 0,
    success_requests: 0,
    total_requests: 0,
  },
  meta: {
    prefix: 'faucet',
  },
};

/**
 * Simplistic function to generate a prometheus metrics.
 * TODO: Switch to prom-client
 * @param name Name of the metric
 * @param type Type
 * @param value Value
 * @param help Help test
 * @param voidIfUndefined Whether we render it even if null/undefined
 * @returns string
 */
function getMetrics(
  name: string,
  type: string,
  value: number | string | undefined,
  help = '',
  voidIfUndefined = false
): string {
  if (!value && voidIfUndefined) return '';
  const metrics_name = `${metrics.meta.prefix}_${name}`;

  let result = '';
  if (help && help.length) result += `# HELP ${metrics_name} ${help}\n`;
  result += `# TYPE ${metrics_name} ${type}\n`;
  result += `${metrics_name} ${value || 0}\n`;

  return result;
}

const app = express();
app.use(bodyParser.json());

const port = config.Get('BACKEND', 'PORT');

app.get('/ready', checkHealth);
app.get('/health', checkHealth);

// prometheus metrics
app.get('/metrics', (_, res) => {
  const errors_total = getMetrics(
    'errors_total',
    'counter',
    errorCounter.total(),
    'The total amount of errors logged on the faucet backend'
  );
  const errors_rpc_timeout = getMetrics(
    'errors_rpc_timeout',
    'counter',
    errorCounter.getValue('rpcTimeout'),
    'The total amount of timeout errors between the faucet backend and the rpc node'
  );

  const balance = getMetrics(
    'balance',
    'gauge',
    actions.getFaucetBalance(),
    'Current balance of the faucet',
    true
  );

  const total_requests = getMetrics(
    'total_requests',
    'gauge',
    metrics.data.total_requests,
    'Total number of requests to the faucet'
  );
  const successful_requests = getMetrics(
    'successful_requests',
    'gauge',
    metrics.data.success_requests,
    'The total number of successful requests to the faucet'
  );

  res.end(
    `${errors_total}${errors_rpc_timeout}${balance}${total_requests}${successful_requests}`
  );
});

const createAndApplyActions = (): void => {
  app.get<unknown, BalanceResponse>('/balance', (_, res) => {
    actions
      .getBalance()
      .then((balance) => res.send({ balance }))
      .catch((e) => {
        logger.error(e);
        errorCounter.plusOne('other');
      });
  });

  app.post<unknown, DripResponse, BotRequestType>(
    '/bot-endpoint',
    (req, res) => {
      const { address, parachain_id, amount, sender } = req.body;
      metrics.data.total_requests++;

      storage
        .isValid(sender, address)
        .then(async (isAllowed) => {
          const isPrivileged = isAccountPrivileged(sender);
          const isAccountOverBalanceCap = await actions.isAccountOverBalanceCap(
            address
          );

          // parity member have unlimited access :)
          if (!isAllowed && !isPrivileged) {
            res.send({
              error: `${sender} has reached their daily quota. Only request once per day.`,
            });
          } else if (isAllowed && isAccountOverBalanceCap && !isPrivileged) {
            res.send({
              error: `${sender}'s balance is over the faucet's balance cap`,
            });
          } else {
            const sendTokensResult = await actions.sendTokens(
              address,
              parachain_id,
              amount
            );

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
};

const main = () => {
  logger.info(`Starting ${pkg.name} v${pkg.version}`);
  logger.info(`Using @polkadot/api ${packageInfo.version}`);

  createAndApplyActions();

  app.listen(port, () =>
    logger.info(`Faucet backend listening on port ${port}.`)
  );
};

main();
