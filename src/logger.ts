import { Logger } from "@eng-automation/js";

import { counters } from "./metrics";

export const logger = new Logger({
  impl: console,
  logFormat: "json",
  metricsCounter: counters.logEntries,
  minLogLevel: "debug",
  name: "app",
});
