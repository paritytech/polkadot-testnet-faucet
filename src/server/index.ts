import 'dotenv/config';

import { packageInfo } from '@polkadot/api';
import bodyParser from 'body-parser';
import express from 'express';

import * as pkg from '../../package.json';
import { logger } from '../utils';
import { config } from './config';
import router from './router';

const app = express();

app.use(bodyParser.json());
app.use('/', router);

const PORT = config.Get('BACKEND', 'PORT');

app.listen(PORT, () => {
  logger.info(`Starting ${pkg.name} v${pkg.version}`);
  logger.info(`Faucet backend listening on port ${PORT}.`);
  logger.info(`Using @polkadot/api ${packageInfo.version}`);
});
