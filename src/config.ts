import { ConfigManager, ConfigObject } from "confmgr/lib/index.js";

import { schema } from "./configSchema.js";
import { logger } from "./logger.js";

export type SpecType<T> = T extends { type: "string" }
  ? string
  : T extends { type: "number" }
    ? number
    : T extends { type: "boolean" }
      ? boolean
      : never;

function resolveConfig(): ConfigObject {
  const specs = ConfigManager.loadSpecsFromYaml(`env.faucet.config.json`);

  const configInstance = ConfigManager.getInstance(specs).getConfig();
  if (process.env.NODE_ENV == "test") {
    return configInstance;
  }

  for (const config of Object.values(specs.config)) {
    for (const item of Object.values(config)) {
      if (item.options.masked) {
        const value = configInstance.Get("CONFIG", item.name);
        if (value !== undefined) {
          logger.addSecretsToMask(value);
        }
      }
    }
  }

  configInstance.Print({ compact: true });

  if (!configInstance.Validate()) {
    throw new Error(`⭕ - Invalid environment configuration`);
  } else {
    logger.info(`✅ Config validated`);
  }

  return configInstance;
}

const configInstance = resolveConfig();
export type ConfigSpec = (typeof schema)["SMF"]["CONFIG"];

export const config = {
  Get: <K extends keyof ConfigSpec>(key: K): SpecType<ConfigSpec[K]> => configInstance.Get("CONFIG", key),
};
