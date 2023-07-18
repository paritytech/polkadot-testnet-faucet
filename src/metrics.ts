import promClient from "prom-client";

export const counters: { [key: string]: promClient.Counter } = {
  totalRequests: new promClient.Counter({
    name: "faucet_total_requests",
    help: "Total number of requests to the faucet",
  }),
  successfulRequests: new promClient.Counter({
    name: "faucet_successful_requests",
    help: "Total number of successful requests to the faucet",
  }),
  logEntries: new promClient.Counter({
    name: "faucet_log_entries",
    help: "Log entries",
    labelNames: ["level"] as const,
  }),
};

export const gauges: { [key: string]: promClient.Gauge } = {
  balance: new promClient.Gauge({ name: "faucet_balance", help: "Current balance of the faucet" }),
};

promClient.collectDefaultMetrics({ prefix: "faucet_" });
