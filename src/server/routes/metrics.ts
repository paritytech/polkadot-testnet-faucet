// prometheus metrics
import express from "express";

import ErrorCounter from "../../common/ErrorCounter";
import { metricsDefinition } from "../../common/metricsDefinition";
import actions from "../../dripper/polkadot/PolkadotActions";
import { convertBnAmountToNumber } from "../../dripper/polkadot/utils";

const router = express.Router();

router.get("/metrics", (_, res) => {
  const errors_total = getMetrics(
    "errors_total",
    "counter",
    ErrorCounter.total(),
    "The total amount of errors logged on the faucet backend",
  );
  const errors_rpc_timeout = getMetrics(
    "errors_rpc_timeout",
    "counter",
    ErrorCounter.getValue("rpcTimeout"),
    "The total amount of timeout errors between the faucet backend and the rpc node",
  );

  const balanceBigint = actions.getFaucetBalance();
  const balanceMaybeNumber = balanceBigint === undefined ? undefined : convertBnAmountToNumber(balanceBigint);

  const balance = getMetrics("balance", "gauge", balanceMaybeNumber, "Current balance of the faucet", true);

  const total_requests = getMetrics(
    "total_requests",
    "gauge",
    metricsDefinition.data.total_requests,
    "Total number of requests to the faucet",
  );
  const successful_requests = getMetrics(
    "successful_requests",
    "gauge",
    metricsDefinition.data.success_requests,
    "The total number of successful requests to the faucet",
  );

  res.end(`${errors_total}${errors_rpc_timeout}${balance}${total_requests}${successful_requests}`);
});

/**
 * Simplistic function to generate a prometheus metrics.
 * TODO: Switch to prom-client
 * @param name Name of the metric
 * @param type Type
 * @param value Value
 * @param help Help test
 * @param voidIfUndefined Whether we render it even if null/undefined
 * @returns string
 */
export function getMetrics(
  name: string,
  type: string,
  value: number | string | undefined,
  help = "",
  voidIfUndefined = false,
): string {
  if (!value && voidIfUndefined) return "";
  const metrics_name = `${metricsDefinition.meta.prefix}_${name}`;

  let result = "";
  if (help && help.length) result += `# HELP ${metrics_name} ${help}\n`;
  result += `# TYPE ${metrics_name} ${type}\n`;
  result += `${metrics_name} ${value || 0}\n`;

  return result;
}

export default router;
