import 'dotenv/config';

import { packageInfo } from '@polkadot/api';
import bodyParser from 'body-parser';
import express from 'express';

import * as pkg from '../../package.json';
import config from '../config';
import { logger } from '../utils';
import router from './router';

const app = express();

app.use(bodyParser.json());
app.use('/', router);

const port = config.Get('BACKEND', 'PORT');

app.listen(port, () => {
  logger.info(`Starting ${pkg.name} v${pkg.version}`);
  logger.info(`Faucet backend listening on port ${port}.`);
  logger.info(`Using @polkadot/api ${packageInfo.version}`);
});
