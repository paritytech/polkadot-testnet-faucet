import { MetricsDefinition } from '../../types';

export const metrics: MetricsDefinition = {
  data: {
    balance: 0,
    errors_rpc_timeout: 0,
    errors_total: 0,
    success_requests: 0,
    total_requests: 0,
  },
  meta: {
    prefix: 'faucet',
  },
};
