import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';

import { checkEnvVariables, getEnvVariable, logger } from '../utils';
import Actions from './actions';
import errorCounter from './ErrorCounter';
import { envVars } from './serverEnvVars';
import Storage from './storage';

dotenv.config();
const storage = new Storage();

const app = express();
app.use(bodyParser.json());

checkEnvVariables(envVars);

const port = getEnvVariable('PORT', envVars) as string;

app.get('/health', (_, res) => {
  res.send('Faucet backend is healthy.');
});

// prometheus metrics
app.get('/metrics', (_, res) => {
  res.end(`# HELP errors_total The total amount of errors logged on the faucet backend
# TYPE errors_total counter
errors_total ${errorCounter.total()}
# HELP errors_rpc_timeout The total amount of timeout errors between the faucet backend and the rpc node
# TYPE errors_rpc_timeout counter
errors_rpc_timeout ${errorCounter.getValue('rpcTimeout')}
`
  );
});

const createAndApplyActions = (): void => {
  const actions = new Actions();

  app.get('/balance', async (_, res) => {
    try {
      const balance = await actions.getBalance();
      res.send(balance);
    } catch (e) {
      logger.error(e);
      errorCounter.plusOne('other');
    }
  });

  interface botRequestType {
    body: { address: string;
      amount: string;
      sender: string;
    }
  }

  app.post('/bot-endpoint', async (req: botRequestType, res) => {
    const { address, amount, sender } = req.body;

    try {
      const isAllowed = await storage.isValid(sender, address);

      // parity member have unlimited access :)
      if (!isAllowed && !sender.endsWith(':matrix.parity.io')) {
        res.send('LIMIT');
      } else {
        storage.saveData(sender, address)
          .catch((e) => {
            logger.error(e);
            errorCounter.plusOne('other');
          });

        const hash = await actions.sendTokens(address, amount);
        res.send(hash);
      }
    } catch (e) {
      logger.error(e);
      errorCounter.plusOne('other');
    }
  });
};

const main = () => {
  createAndApplyActions();

  app.listen(port, () => logger.info(`Faucet backend listening on port ${port}.`));
};

main();

