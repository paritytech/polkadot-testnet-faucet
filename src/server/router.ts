import express from "express";

import { BotBackendConfig, WebBackendConfig } from "../faucetConfig";
import { createActionsRouter } from "./routes/actions";
import healthcheckRoutes from "./routes/healthcheck";
import { createMetricsRouter } from "./routes/metrics";
import { Actions } from "./services/Actions";

export const createRouter = (
  opts: { type: "bot"; botConfig: BotBackendConfig } | { type: "web"; webConfig: WebBackendConfig },
) => {
  const router = express.Router();
  const actions = new Actions(
    opts.type === "bot" ? opts.botConfig.Get("FAUCET_ACCOUNT_MNEMONIC") : opts.webConfig.Get("FAUCET_ACCOUNT_MNEMONIC"),
  );
  router.use(healthcheckRoutes);
  router.use(createMetricsRouter(actions));
  router.use(createActionsRouter(opts, actions));
  return router;
};
