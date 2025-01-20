import "dotenv/config";
import { config } from "#src/config";
import { logger } from "#src/logger";
import bodyParser from "body-parser";
import express from "express";

import router from "./router.js";

const PORT = config.Get("PORT");
const name = process.env.npm_package_name!;
const version = process.env.npm_package_version!;

export const startServer = () => {
  const app = express();

  app.use(bodyParser.json());
  app.use("/", router);

  app.listen(PORT, () => {
    logger.info(`Starting ${name} v${version}`);
    logger.info(`Faucet backend listening on port ${PORT}.`);
  });
};
