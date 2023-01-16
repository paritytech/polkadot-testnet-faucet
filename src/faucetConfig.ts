import { ConfigManager } from "confmgr/lib";

import { logger } from "./logger";

export function faucetConfig(appName: "server" | "bot") {
  const config = ConfigManager.getInstance(`env.${appName}.config.yml`).getConfig();

  if (process.env.NODE_ENV !== "test") {
    config.Print({ compact: true });

    if (!config.Validate()) {
      console.error(`⭕ - Invalid environment configuration for "${appName}" app`);
    } else {
      logger.info(`✅ ${appName} config validated`);
    }
  }

  return config;
}
