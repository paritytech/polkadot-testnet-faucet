import '@polkadot/api-augment';

import { ApiPromise } from '@polkadot/api';
import { HttpProvider } from '@polkadot/rpc-provider';

import { config } from './config';

const RPC_ENDPOINT = config.Get('BACKEND', 'RPC_ENDPOINT') as string;
const injectedTypes = JSON.parse(
  config.Get('BACKEND', 'INJECTED_TYPES') as string
) as Record<string, string>;

const provider = new HttpProvider(RPC_ENDPOINT);
const types = injectedTypes;
const polkadotApi = new ApiPromise({ provider, types });

export default polkadotApi;
