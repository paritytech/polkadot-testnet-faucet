import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import type { BalanceResponse, BotRequestType, DripResponse } from 'src/types';

import { isDripSuccessResponse } from '../guards';
import { checkEnvVariables, getEnvVariable, logger } from '../utils';
import Actions from './actions';
import errorCounter from './ErrorCounter';
import { envVars } from './serverEnvVars';
import Storage from './storage';

dotenv.config();
const storage = new Storage();
const actions = new Actions();

const app = express();
app.use(bodyParser.json());

checkEnvVariables(envVars);

const port = getEnvVariable('PORT', envVars) as string;

app.get('/health', (_, res) => {
  res.send('Faucet backend is healthy.');
});


// prometheus metrics
app.get('/metrics', (_, res) => {
  let balanceMetric = '';
  if (actions.getFaucetBalance()) {
    balanceMetric += '# TYPE faucet_balance gauge\n';
    balanceMetric += `faucet_balance ${actions.getFaucetBalance()}`;
  }
  res.end(`# HELP errors_total The total amount of errors logged on the faucet backend
# TYPE errors_total counter
errors_total ${errorCounter.total()}
# HELP errors_rpc_timeout The total amount of timeout errors between the faucet backend and the rpc node
# TYPE errors_rpc_timeout counter
errors_rpc_timeout ${errorCounter.getValue('rpcTimeout')}
${balanceMetric}
`
  );
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

    storage.isValid(sender, address).then(async (isAllowed) => {
      const privileged = sender.endsWith(':matrix.parity.io') || sender.endsWith(':web3.foundation');

      // parity member have unlimited access :)
      if (!isAllowed && !privileged) {
        res.send({ error: `${sender} has reached their daily quota. Only request once per day.` });
      } else {
        const sendTokensResult = await actions.sendTokens(address, amount);

        // hash is null if something wrong happened
        if (isDripSuccessResponse(sendTokensResult)) {
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
  createAndApplyActions();

  app.listen(port, () => logger.info(`Faucet backend listening on port ${port}.`));
};

main();
