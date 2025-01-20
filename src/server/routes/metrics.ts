// prometheus metrics
import actions from "#src/dripper/polkadot/PolkadotActions";
import { convertBnAmountToNumber } from "#src/dripper/polkadot/utils";
import { gauges } from "#src/metrics";
import express from "express";
import promClient from "prom-client";

const router = express.Router();
router.get("/metrics", async (_, res) => {
  const balanceBigint = await actions.getFaucetBalance();
  if (balanceBigint !== undefined) {
    gauges.balance.set(convertBnAmountToNumber(balanceBigint));
  }

  res.contentType("text/plain");
  res.end(await promClient.register.metrics());
});

export default router;
