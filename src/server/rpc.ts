import '@polkadot/api-augment';

import { ApiPromise } from '@polkadot/api';
import { HttpProvider } from '@polkadot/rpc-provider';

import config from '../config';

const rpcEndpointUrl = config.Get('BACKEND', 'RPC_ENDPOINT') as string;
const injectedTypes = JSON.parse(
  config.Get('BACKEND', 'INJECTED_TYPES') as string
) as Record<string, string>;

const provider = new HttpProvider(rpcEndpointUrl);
const types = injectedTypes;
const apiInstance = new ApiPromise({ provider, types });

export default apiInstance;
