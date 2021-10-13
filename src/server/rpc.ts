import { ApiPromise } from '@polkadot/api';
import { HttpProvider } from '@polkadot/rpc-provider';

import { getEnvVariable } from '../utils';
import { envVars } from './serverEnvVars';

const rpcEndpointUrl = getEnvVariable('RPC_ENDPOINT', envVars) as string;
const injectedTypes = JSON.parse(
  getEnvVariable('INJECTED_TYPES', envVars) as string
) as Record<string, string>;

const provider = new HttpProvider(rpcEndpointUrl);
const types = injectedTypes;
const apiInstance = new ApiPromise({ provider, types });

export default apiInstance;
