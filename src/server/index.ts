import "dotenv/config";
import { packageInfo } from "@polkadot/api";
import bodyParser from "body-parser";
import express from "express";

import * as pkg from "../../package.json";
import { logger } from "../logger";
import { config } from "./config";
import { createRouter } from "./router";

logger.info(`Starting ${pkg.name} v${pkg.version}`);
logger.info(`Using @polkadot/api ${packageInfo.version}`);

if (!config.web && !config.bot) {
  console.error("No configuration found for neither web or bot backend.");
  process.exit(1);
}

const createApp = () => express().use(bodyParser.json());

if (config.web) {
  const app = createApp();
  app.use("/", createRouter({ type: "web", webConfig: config.web }));
  const PORT = config.web.Get("PORT");
  app.listen(PORT, () => {
    logger.info(`Faucet web backend listening on port ${PORT}.`);
  });
}

if (config.bot) {
  const app = createApp();
  app.use("/", createRouter({ type: "bot", botConfig: config.bot }));
  const PORT = config.bot.Get("PORT");
  app.listen(PORT, () => {
    logger.info(`Faucet bot backend listening on port ${PORT}.`);
  });
}
