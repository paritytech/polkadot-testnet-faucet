import express from 'express';
import bodyParser from 'body-parser';
import Actions from './actions';
import Storage from './storage';
import { logger, verifyEnvVariables } from '../utils.js';
require('dotenv').config()

const storage = new Storage();

const app = express();
app.use(bodyParser.json());
const port = 5555;

verifyEnvVariables();

app.get('/health', (_, res) => {
  res.send('Faucet backend is healthy.');
});

const createAndApplyActions = async () => {
  const actions = new Actions();

  app.get('/balance', async (_, res) => {
    const balance = await actions.getBalance();
    res.send(balance);
  });
  
   app.post('/bot-endpoint', async (req, res) => {
	       const { address, amount, sender } = req.body;

         // parity member have unlimited access :)
	       if (!(await storage.isValid(sender, address)) && !sender.endsWith(':matrix.parity.io')) {
		             res.send('LIMIT');
		           } else {
				         storage.saveData(sender, address);
				       
				         const hash = await actions.sendTokens(address, amount);
				         res.send(hash);
				       }
	     });
  }

const main = async () => {
  await createAndApplyActions();

  app.listen(port, () => logger.info(`Faucet backend listening on port ${port}.`));
}

try {
  main();
} catch (e) { logger.error(e); }

