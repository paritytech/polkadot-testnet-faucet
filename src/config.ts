import { ConfigManager } from 'confmgr/lib';

const config = ConfigManager.getInstance('envConfig.yml').getConfig();

config.Print({ compact: true });

if (!config.Validate()) {
  console.error('⭕ - Invalid environment configuration');
  // should interrupt build job
  process.exit(1);
}

export default config;
