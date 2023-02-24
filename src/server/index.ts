import "dotenv/config";
import { packageInfo } from "@polkadot/api";
import bodyParser from "body-parser";
import express from "express";

import * as pkg from "../../package.json";
import { logger } from "../logger";
import { botConfig, webConfig } from "./config";
import { createRouter } from "./router";

logger.info(`Starting ${pkg.name} v${pkg.version}`);
logger.info(`Using @polkadot/api ${packageInfo.version}`);

if (!webConfig.isValid && !botConfig.isValid) {
  console.error("No valid configuration found for either web or bot backend.");
  process.exit(1);
}

const createApp = () => express().use(bodyParser.json());

if (webConfig.isValid) {
  const app = createApp();
  app.use("/", createRouter("web"));
  const PORT = webConfig.Get("PORT");
  app.listen(PORT, () => {
    logger.info(`Faucet web backend listening on port ${PORT}.`);
  });
}

if (botConfig.isValid) {
  const app = createApp();
  app.use("/", createRouter("bot"));
  const PORT = botConfig.Get("PORT");
  app.listen(PORT, () => {
    logger.info(`Faucet bot backend listening on port ${PORT}.`);
  });
}
