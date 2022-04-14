import log4js from 'log4js';

export const logger = log4js.getLogger();
logger.level = 'debug';

export function isAccountPrivileged(sender: string): boolean {
  return (
    sender.endsWith(':matrix.parity.io') || sender.endsWith(':web3.foundation')
  );
}
