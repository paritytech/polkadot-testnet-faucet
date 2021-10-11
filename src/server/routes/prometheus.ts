import express from 'express';

import Actions from '../actions';
import { metrics } from '../constants/prometheus';
import errorCounter from '../ErrorCounter';

const promRouter = express.Router();

const actions = new Actions();

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

promRouter.get('/metrics', (_, res) => {
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

export default promRouter;
