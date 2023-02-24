import express from "express";

import { botConfig, webConfig } from "./config";
import { createActionsRouter } from "./routes/actions";
import healthcheckRoutes from "./routes/healthcheck";
import { createMetricsRouter } from "./routes/metrics";
import { Actions } from "./services/Actions";

export const createRouter = (type: "bot" | "web") => {
  const router = express.Router();
  const actions = new Actions(
    type === "bot" ? botConfig.Get("FAUCET_ACCOUNT_MNEMONIC") : webConfig.Get("FAUCET_ACCOUNT_MNEMONIC"),
  );
  router.use(healthcheckRoutes);
  router.use(createMetricsRouter(actions));
  router.use(createActionsRouter(type, actions));
  return router;
};
