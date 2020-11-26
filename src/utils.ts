import log4js from 'log4js';

import type { EnvNameBot, EnvNameServer, EnvOpt, EnvVar, PrimitivType } from './types';

export const logger = log4js.getLogger();
logger.level = 'debug';

export function getEnvVariable <T extends EnvNameBot | EnvNameServer> (name: T, envVars: EnvVar<T>): PrimitivType {
  const env = process.env[name];
  let returnedEnv: PrimitivType;
  const opts = envVars[name];

  if (!opts) {
    throw new Error(`Unknown variable ${name}`);
  }

  if (env === undefined) {
    if (opts.required) {
      throw new Error(`Required environment variable ${name} is undefined`);
    } else if (opts.default) {
      returnedEnv = opts.default;
    } else {
      throw new Error(`No default value set for optionnal variable ${name}`);
    }
  } else {
    returnedEnv = env;
  }

  switch (opts.type) {
    case 'number':
      return Number(returnedEnv);

    case 'boolean':
      return !!returnedEnv;

    default:
      return returnedEnv;
  }
}

export function checkEnvVariables <T extends EnvNameBot | EnvNameServer> (envVars: EnvVar<T>): void {
  Object.entries<EnvOpt>(envVars).forEach(([env, opt]) => {
    const value = process.env[env];

    if (value === undefined) {
      if (opt.required) {
        console.error(`✖︎ Required environment variable ${env} not set.`);
      } else {
        if (!opt.default) {
          console.error(`✖︎ No default value set for optionnal variable ${env}`);
        } else {
          console.log(`◉ Optionnal environment variable ${env} not set, using default (${opt.default.toString()}).`);
        }
      }
    } else {
      if (opt.secret) {
        console.log(`✓ ${env} it set (secret)`);
      } else {
        console.log(`✓ ${env} set to ${value}`);
      }
    }
  });
  console.log('------------------------------------------');
}
