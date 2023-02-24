import { ConfigManager } from "confmgr/lib";

import backendConfigSpec from "../env.backend.config.json";
import botConfigSpec from "../env.bot.config.json";
import botBackendConfigSpec from "../env.bot-backend.config.json";
import webBackendConfigSpec from "../env.web-backend.config.json";
import { logger } from "./logger";

// prettier-ignore
type SpecType<T> = T extends { type: "string" }
  ? string
  : T extends { type: "number" }
  ? number
  : T extends { type: "boolean" }
  ? boolean
  : never;

export function botConfig() {
  const config = faucetConfig("bot");
  if (!config.Validate()) throw new Error("Refusing to start with invalid configuration.");
  type BotConfigSpec = typeof botConfigSpec["SMF"]["BOT"];
  return { Get: <K extends keyof BotConfigSpec>(key: K): SpecType<BotConfigSpec[K]> => config.Get("BOT", key) };
}

export function backendConfig() {
  const config = faucetConfig("backend");
  if (!config.Validate()) throw new Error("Refusing to start with invalid configuration.");
  type ServerConfigSpec = typeof backendConfigSpec["SMF"]["BACKEND"];
  return {
    Get: <K extends keyof ServerConfigSpec>(key: K): SpecType<ServerConfigSpec[K]> => config.Get("BACKEND", key),
  };
}

export function webBackendConfig() {
  const config = faucetConfig("web-backend");
  type ServerConfigSpec = typeof webBackendConfigSpec["SMF"]["WEBBACKEND"];
  return {
    Get: <K extends keyof ServerConfigSpec>(key: K): SpecType<ServerConfigSpec[K]> => config.Get("WEB_BACKEND", key),
    isValid: config.Validate(),
  };
}

export function botBackendConfig() {
  const config = faucetConfig("bot-backend");
  type ServerConfigSpec = typeof botBackendConfigSpec["SMF"]["BOTBACKEND"];
  return {
    Get: <K extends keyof ServerConfigSpec>(key: K): SpecType<ServerConfigSpec[K]> => config.Get("BOT_BACKEND", key),
    isValid: config.Validate(),
  };
}

function faucetConfig(appName: "backend" | "web-backend" | "bot-backend" | "bot") {
  const config = ConfigManager.getInstance(`env.${appName}.config.json`).getConfig();

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
