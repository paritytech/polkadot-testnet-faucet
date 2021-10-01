import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import type { BalanceResponse, BotRequestType, DripResponse, MetricsDefinition } from 'src/types';

import { isDripSuccessResponse } from '../guards';
import { checkEnvVariables, getEnvVariable, logger } from '../utils';
import Actions from './actions';
import errorCounter from './ErrorCounter';
import { envVars } from './serverEnvVars';
import Storage from './storage';
const pkg = require('../../package.json');

dotenv.config();
const storage = new Storage();
const actions = new Actions();

const metrics: MetricsDefinition = {
  meta: {
    prefix: 'faucet',
  },
  data: {
    total_requests: 0,
    success_requests: 0,
    balance: 0,
    errors_total: 0,
    errors_rpc_timeout: 0,
  }
}

/**
 * Simplistic function to generate a prometheus metrics.
 * TODO: Switch to prom-client if this grows
 * @param name Name of the metric
 * @param type Type
 * @param value Value
 * @param help Help test
 * @param voidIfUndefined Whether we render it even if null/undefined
 * @returns string
 */
function getMetrics(name: string, type: string,  value: number | string | undefined , help: string = '', voidIfUndefined: boolean = false): string {
  if ( !value && voidIfUndefined ) return '';

  let result = '';
  if (help && help.length ) result += `# HELP ${metrics.meta.prefix}_${name} ${help}\n`;
  result += `# TYPE ${name} ${type}\n`;
  result += `${name} ${value}\n`;

  return result;
}

const app = express();
app.use(bodyParser.json());

checkEnvVariables(envVars);

const port = getEnvVariable('PORT', envVars) as number;

app.get('/health', (_, res) => {
  res.send('Faucet backend is healthy.');
});


// prometheus metrics
app.get('/metrics', (_, res) => {
  let errors_total = getMetrics('errors_total', 'counter', errorCounter.total(), 'The total amount of errors logged on the faucet backend' );
  let errors_rpc_timeout = getMetrics('errors_rpc_timeout', 'counter', errorCounter.getValue('rpcTimeout'), 'The total amount of timeout errors between the faucet backend and the rpc node' );

  let balance = getMetrics('balance', 'gauge', actions.getFaucetBalance(), 'Current balance of the faucet', true );

  let total_requests = getMetrics('total_requests', 'gauge', metrics.data.total_requests , 'Total number of requests to the faucet' );
  let successful_requests = getMetrics('successful_requests', 'gauzge', metrics.data.success_requests, 'The total number of successful requests to the faucet' );

  res.end(`${errors_total}${errors_rpc_timeout}${balance}${total_requests}${successful_requests}`);
});

const createAndApplyActions = (): void => {
  app.get<unknown, BalanceResponse>('/balance', (_, res) => {
    actions.getBalance()
      .then((balance) =>
        res.send({ balance })
      ).catch((e) => {
        logger.error(e);
        errorCounter.plusOne('other');
      })
      ;
  }
  );

  app.post<unknown, DripResponse, BotRequestType>('/bot-endpoint', (req, res) => {
    const { address, amount, sender } = req.body;
    metrics.data.total_requests++;
    console.log(metrics);
    
    storage.isValid(sender, address).then(async (isAllowed) => {
      const privileged = sender.endsWith(':matrix.parity.io') || sender.endsWith(':web3.foundation');

      // parity member have unlimited access :)
      if (!isAllowed && !privileged) {
        res.send({ error: `${sender} has reached their daily quota. Only request once per day.` });
      } else {
        const sendTokensResult = await actions.sendTokens(address, amount);

        // hash is null if something wrong happened
        if (isDripSuccessResponse(sendTokensResult)) {
          metrics.data.success_requests++;
          storage.saveData(sender, address)
            .catch((e) => {
              logger.error(e);
              errorCounter.plusOne('other');
            });
        }

        res.send(sendTokensResult);
      }
    }).catch((e) => {
      logger.error(e);
      errorCounter.plusOne('other');
    });
  });
};

const main = () => {
  logger.info(`Starting ${pkg.name} v${pkg.version}`);
  createAndApplyActions();

  app.listen(port, () => logger.info(`Faucet backend listening on port ${port}.`));
};

main();
