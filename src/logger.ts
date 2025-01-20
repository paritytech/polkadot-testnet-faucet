import { Logger } from "@eng-automation/js";

import { counters } from "./metrics.js";

export const logger = new Logger({
  impl: console,
  logFormat: null,
  metricsCounter: counters.logEntries,
  minLogLevel: "debug",
  name: "app",
});
