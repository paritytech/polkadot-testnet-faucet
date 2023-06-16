import "dotenv/config";
import { packageInfo } from "@polkadot/api";
import bodyParser from "body-parser";
import express from "express";

import * as pkg from "../../package.json";
import { config } from "../config";
import { logger } from "../logger";
import router from "./router";

const PORT = config.Get("PORT");

export const startServer = () => {
  const app = express();

  app.use(bodyParser.json());
  app.use("/", router);

  app.listen(PORT, () => {
    logger.info(`Starting ${pkg.name} v${pkg.version}`);
    logger.info(`Faucet backend listening on port ${PORT}.`);
    logger.info(`Using @polkadot/api ${packageInfo.version}`);
  });
};
