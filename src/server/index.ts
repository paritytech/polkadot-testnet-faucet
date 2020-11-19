import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';

import { logger, verifyEnvVariables } from '../utils.js';
import Actions from './actions';
import Storage from './storage';

dotenv.config();
const storage = new Storage();

const app = express();
app.use(bodyParser.json());
const port = 5555;

verifyEnvVariables();

app.get('/health', (_, res) => {
  res.send('Faucet backend is healthy.');
});

const createAndApplyActions = () => {
  const actions = new Actions();

  app.get('/balance', async (_, res) => {
    const balance = await actions.getBalance();
    res.send(balance);
  });

  interface botRequestType {
    body: { address: string;
      amount: string;
      sender: string;
    }
  }

  app.post('/bot-endpoint', async (req: botRequestType, res) => {
    const { address, amount, sender } = req.body;
    const isAllowed = await storage.isValid(sender, address);

    // parity member have unlimited access :)
    if (!isAllowed && !sender.endsWith(':matrix.parity.io')) {
      res.send('LIMIT');
    } else {
      storage.saveData(sender, address).catch((e) => logger.error(e));

      const hash = await actions.sendTokens(address, amount);
      res.send(hash);
    }
  });
};

const main = () => {
  createAndApplyActions();

  app.listen(port, () => logger.info(`Faucet backend listening on port ${port}.`));
};

main();

