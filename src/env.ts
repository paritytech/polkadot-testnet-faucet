import 'dotenv/config';

import Joi from 'joi';

export interface Environment {
  NODE_ENV: string;
  PORT: number;
  RPC_ENDPOINT: string;
  BACKEND_URL: string;
  MATRIX_BASE_URL: string;
  MATRIX_ACCESS_TOKEN: string;
  MATRIX_BOT_USER_ID: string;
  NETWORK_UNIT: string;
  NETWORK_DECIMALS: number;
  DRIP_AMOUNT: number;
  FAUCET_ACCOUNT_MNEMONIC: string;
  FAUCET_IGNORE_LIST: string;
  INJECTED_TYPES: string;
}

const schema = Joi.object<Environment>({
  BACKEND_URL: Joi.string().default('http://localhost:5555'),
  DRIP_AMOUNT: Joi.number().required(),
  FAUCET_ACCOUNT_MNEMONIC: Joi.string().required(),
  FAUCET_IGNORE_LIST: Joi.string().required().allow('').default(''),
  INJECTED_TYPES: Joi.string().allow().empty().default('{}'),
  MATRIX_ACCESS_TOKEN: Joi.string().required(),
  MATRIX_BASE_URL: Joi.string().required(),
  MATRIX_BOT_USER_ID: Joi.string().required(),
  NETWORK_DECIMALS: Joi.number().default(12),
  NETWORK_UNIT: Joi.string().default('UNIT'),
  NODE_ENV: Joi.string().default('development'),
  PORT: Joi.number().required(),
  RPC_ENDPOINT: Joi.string().required(),
});

const { value, error } = schema.validate(process.env, {
  stripUnknown: true,
});

if (error?.details.length) {
  throw Error(`Environment variable: ${error.details[0].message}`);
}

export default value as Environment;
