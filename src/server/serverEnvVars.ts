import { EnvNameServer, EnvVar } from '../types';

export const envVars: EnvVar<EnvNameServer> = {
  FAUCET_ACCOUNT_MNEMONIC: { required: true, secret: true, type: 'string' },
  INJECTED_TYPES: {
    default: '{}',
    required: false,
    secret: false,
    type: 'string',
  },
  NETWORK_DECIMALS: {
    default: 12,
    required: false,
    secret: false,
    type: 'number',
  },
  PORT: { default: 5555, required: false, secret: false, type: 'number' },
  RPC_ENDPOINT: { required: true, secret: false, type: 'string' },
};
