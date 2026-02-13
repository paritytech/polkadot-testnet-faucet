import { Logger } from "@eng-automation/js";

import { counters } from "./metrics.js";

const withTimestamp =
  (fn: (...args: unknown[]) => void) =>
  (...args: unknown[]) =>
    fn(new Date().toISOString(), ...args);

const timestampConsole = {
  ...console,
  log: withTimestamp(console.log.bind(console)),
  error: withTimestamp(console.error.bind(console)),
  warn: withTimestamp(console.warn.bind(console)),
  debug: withTimestamp(console.debug.bind(console)),
  info: withTimestamp(console.info.bind(console)),
};

export const logger = new Logger({
  impl: timestampConsole,
  logFormat: null,
  metricsCounter: counters.logEntries,
  minLogLevel: "debug",
  name: "app",
});
