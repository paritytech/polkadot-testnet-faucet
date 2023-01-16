import { ConfigManager, ConfigObject } from "confmgr/lib";

import botConfigSpec from "../env.bot.config.json";
import serverConfigSpec from "../env.server.config.json";
import { logger } from "./logger";

export function faucetBotConfig() {
  const config = ConfigManager.getInstance("env.bot.config.json").getConfig();
  validateConfig(config, "bot");
  type BotConfigSpec = typeof botConfigSpec["SMF"]["BOT"];
  type BotConfigKey = keyof BotConfigSpec;
  type Ret<K extends BotConfigKey> = BotConfigSpec[K] extends { type: "string" }
    ? string
    : BotConfigSpec[K] extends { type: "number" }
    ? number
    : never;
  return { Get: <K extends BotConfigKey>(key: K): Ret<K> => config.Get("BOT", key) };
}

export function faucetServerConfig() {
  const config = ConfigManager.getInstance("env.server.config.json").getConfig();
  validateConfig(config, "server");
  type ServerConfigSpec = typeof serverConfigSpec["SMF"]["BACKEND"];
  type ServerConfigKey = keyof ServerConfigSpec;
  type Ret<K extends ServerConfigKey> = ServerConfigSpec[K] extends { type: "string" }
    ? string
    : ServerConfigSpec[K] extends { type: "number" }
    ? number
    : never;
  return { Get: <K extends ServerConfigKey>(key: K): Ret<K> => config.Get("BACKEND", key) };
}

function validateConfig(config: ConfigObject, appName: "server" | "bot") {
  if (process.env.NODE_ENV !== "test") {
    config.Print({ compact: true });

    if (!config.Validate()) {
      console.error(`⭕ - Invalid environment configuration for "${appName}" app`);
    } else {
      logger.info(`✅ ${appName} config validated`);
    }
  }
}
