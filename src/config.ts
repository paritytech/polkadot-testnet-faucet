import { ConfigManager } from "confmgr/lib";

import faucetConfigSpec from "../env.faucet.config.json"
import { logger } from "./logger";

type SpecType<T> = T extends { type: "string" }
  ? string
  : T extends { type: "number" }
  ? number
  : T extends { type: "boolean" }
  ? boolean
  : never;

const config = faucetConfig()

function faucetBotConfig() {
  type BotConfigSpec = typeof faucetConfigSpec["SMF"]["BOT"];
  return { Get: <K extends keyof BotConfigSpec>(key: K): SpecType<BotConfigSpec[K]> => config.Get("BOT", key) };
}

function faucetServerConfig() {
  type ServerConfigSpec = typeof faucetConfigSpec["SMF"]["BACKEND"];
  return {
    Get: <K extends keyof ServerConfigSpec>(key: K): SpecType<ServerConfigSpec[K]> => config.Get("BACKEND", key),
  };
}

function faucetConfig() {
  const config = ConfigManager.getInstance(`env.faucet.config.json`).getConfig();

  if (process.env.NODE_ENV !== "test") {
    config.Print({ compact: true });

    if (!config.Validate()) {
      console.error(`⭕ - Invalid environment configuration.`);
    } else {
      logger.info(`✅ Faucet config validated`);
    }
  }

  return config;
}

export const botConfig = faucetBotConfig()
export const serverConfig = faucetServerConfig()
