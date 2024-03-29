// prometheus metrics
import express from "express";
import promClient from "prom-client";

import actions from "../../dripper/polkadot/PolkadotActions";
import { convertBnAmountToNumber } from "../../dripper/polkadot/utils";
import { gauges } from "../../metrics";

const router = express.Router();
router.get("/metrics", async (_, res) => {
  const balanceBigint = actions.getFaucetBalance();
  if (balanceBigint !== undefined) {
    gauges.balance.set(convertBnAmountToNumber(balanceBigint));
  }

  res.contentType("text/plain");
  res.end(await promClient.register.metrics());
});

export default router;
