import 'dotenv/config';

import bodyParser from 'body-parser';
import express from 'express';

import * as pkg from '../../package.json';
import { checkEnvVariables, getEnvVariable, logger } from '../utils';
import router from './routes/routes';
import { envVars } from './serverEnvVars';

checkEnvVariables(envVars);

const app = express();
const port = getEnvVariable('PORT', envVars) as number;

app.use(bodyParser.json());
app.use('/', router);

app.listen(port, () => {
  logger.info(`Starting ${pkg.name} v${pkg.version}`);
  logger.info(`Faucet backend listening on port ${port}.`);
});
