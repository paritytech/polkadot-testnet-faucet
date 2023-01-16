import { ConfigManager } from "confmgr/lib";

import botConfigSpec from "../env.bot.config.json";
import serverConfigSpec from "../env.server.config.json";
import { logger } from "./logger";

type SpecType<T> = T extends { type: "string" } ? string : T extends { type: "number" } ? number : never;

export function faucetBotConfig() {
  const config = faucetConfig("bot");
  type BotConfigSpec = typeof botConfigSpec["SMF"]["BOT"];
  type BotConfigKey = keyof BotConfigSpec;
  type Ret<K extends BotConfigKey> = SpecType<BotConfigSpec[K]>;
  return { Get: <K extends BotConfigKey>(key: K): Ret<K> => config.Get("BOT", key) };
}

export function faucetServerConfig() {
  const config = faucetConfig("server");
  type ServerConfigSpec = typeof serverConfigSpec["SMF"]["BACKEND"];
  type ServerConfigKey = keyof ServerConfigSpec;
  type Ret<K extends ServerConfigKey> = SpecType<ServerConfigSpec[K]>;
  return { Get: <K extends ServerConfigKey>(key: K): Ret<K> => config.Get("BACKEND", key) };
}

function faucetConfig(appName: "server" | "bot") {
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
