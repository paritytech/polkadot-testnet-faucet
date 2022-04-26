import { ConfigManager } from 'confmgr/lib';

import { logger } from './utils';

export function faucetConfig(appName: 'server' | 'bot') {
  const config = ConfigManager.getInstance(
    `env.${appName}.config.yml`
  ).getConfig();
  config.Print({ compact: true });

  if (!config.Validate()) {
    console.error(
      `⭕ - Invalid environment configuration for "${appName}" app`
    );
  } else {
    logger.info(`✅ ${appName} config validated`);
  }

  return config;
}
