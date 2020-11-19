import log4js from 'log4js';

export const logger = log4js.getLogger();
logger.level = 'debug';

export const verifyEnvVariables = (): void => {
  const publics = [
    'MATRIX_BOT_USER_ID',
    'BACKEND_URL',
    'RPC_ENDPOINT',
    'INJECTED_TYPES',
    'DRIP_AMOUNT',
    'NETWORK_DECIMALS',
    'NETWORK_UNIT'
  ];
  const secrets = [
    'MATRIX_ACCESS_TOKEN',
    'FAUCET_ACCOUNT_MNEMONIC'
  ];

  publics.forEach(env => {
    const value = process.env[env];
    if (!value) {
      console.log(`✖︎ Environment variable ${env} not set.`);
    } else {
      console.log(`✓ ${env} set to ${value}`);
    }
  });

  secrets.forEach(secret => {
    if (!process.env[secret]) {
      console.log(`✖︎ Environment (secret) variable ${secret} not set.`);
    }
  });

  console.log('------------------------------------------');
};
