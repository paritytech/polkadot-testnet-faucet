import { ConfigManager } from "confmgr/lib";

import backendConfigSpec from "../env.backend.config.json";
import botConfigSpec from "../env.bot.config.json";
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
  if (!config.Validate()) throw new Error("Refusing to start the bot with invalid configuration.");
  type BotConfigSpec = typeof botConfigSpec["SMF"]["BOT"];
  return { Get: <K extends keyof BotConfigSpec>(key: K): SpecType<BotConfigSpec[K]> => config.Get("BOT", key) };
}

type BackendConfigSpec = typeof backendConfigSpec["SMF"]["BACKEND"];
type WebBackendConfigSpec = typeof backendConfigSpec["SMF"]["WEBBACKEND"];
type BotBackendConfigSpec = typeof backendConfigSpec["SMF"]["BOTBACKEND"];
export type BackendTypedGet = <K extends keyof BackendConfigSpec>(key: K) => SpecType<BackendConfigSpec[K]>;
export type WebBackendTypedGet = <K extends keyof WebBackendConfigSpec>(key: K) => SpecType<WebBackendConfigSpec[K]>;
export type BotBackendTypedGet = <K extends keyof BotBackendConfigSpec>(key: K) => SpecType<BotBackendConfigSpec[K]>;
export type BotBackendConfig = {
  Get: BotBackendTypedGet;
};
export type WebBackendConfig = {
  Get: WebBackendTypedGet;
};
export type BackendConfig = {
  Get: BackendTypedGet;
  web?: WebBackendConfig | undefined;
  bot?: BotBackendConfig | undefined;
};

export function backendConfig(): BackendConfig {
  const config = faucetConfig("backend");
  if (!config.Validate()) throw new Error("Refusing to start with invalid configuration.");

  const web: { Get: WebBackendTypedGet } = {
    Get: <K extends keyof WebBackendConfigSpec>(key: K): SpecType<WebBackendConfigSpec[K]> =>
      config.Get("WEBBACKEND", key),
  };
  const bot: { Get: BotBackendTypedGet } = {
    Get: <K extends keyof BotBackendConfigSpec>(key: K): SpecType<BotBackendConfigSpec[K]> =>
      config.Get("BOTBACKEND", key),
  };

  return {
    Get: <K extends keyof BackendConfigSpec>(key: K): SpecType<BackendConfigSpec[K]> => config.Get("BACKEND", key),
    web: web.Get("FAUCET_ACCOUNT_MNEMONIC") ? web : undefined,
    bot: bot.Get("FAUCET_ACCOUNT_MNEMONIC") ? bot : undefined,
  };
}

function faucetConfig(appName: "backend" | "bot") {
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
