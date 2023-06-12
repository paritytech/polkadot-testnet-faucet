import { ConfigManager, ModuleDictionnary } from "confmgr/lib";

import faucetConfigSpec from "../env.faucet.config.json";
import { logger } from "./logger";

type SpecType<T> = T extends { type: "string" }
  ? string
  : T extends { type: "number" }
  ? number
  : T extends { type: "boolean" }
  ? boolean
  : never;

function faucetBotConfig() {
  const config = faucetConfig();
  type BotConfigSpec = typeof faucetConfigSpec["SMF"]["BOT"];
  return { Get: <K extends keyof BotConfigSpec>(key: K): SpecType<BotConfigSpec[K]> => config.Get("BOT", key) };
}

function faucetServerConfig() {
  const config = faucetConfig();
  type ServerConfigSpec = typeof faucetConfigSpec["SMF"]["BACKEND"];
  return {
    Get: <K extends keyof ServerConfigSpec>(key: K): SpecType<ServerConfigSpec[K]> => config.Get("BACKEND", key),
  };
}

export function validateConfig(appName: keyof typeof faucetConfigSpec["SMF"]) {
  if (process.env.NODE_ENV == "test") {
    return;
  }

  const specs = ConfigManager.loadSpecsFromYaml(`env.faucet.config.json`);
  // Delete all keys but the app in question that is being validated.
  for (const key of Object.keys(specs.config)) {
    if (key !== appName) {
      // In this case we only delete properties, no injection is possible
      // eslint-disable-next-line security/detect-object-injection
      delete (specs.config as ModuleDictionnary)[key];
    }
  }

  ConfigManager.clearInstance();
  const configInstance = ConfigManager.getInstance(specs).getConfig();
  configInstance.Print({ compact: true });

  if (!configInstance.Validate()) {
    console.error(`⭕ - Invalid environment configuration for "${appName}" app`);
  } else {
    logger.info(`✅ ${appName} config validated`);
  }

  // Reload the proper singleton instance.
  ConfigManager.clearInstance();
  faucetConfig();
}

function faucetConfig() {
  return ConfigManager.getInstance(`env.faucet.config.json`).getConfig();
}

export const botConfig = faucetBotConfig();
export const serverConfig = faucetServerConfig();
