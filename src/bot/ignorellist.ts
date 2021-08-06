export function isBlacklisted (account: string): boolean {
  const ignoreList: string[] = (process.env.FAUCET_IGNORE_LIST ?? '').replace(/\s/g, '').split(',') ?? [];
  return ignoreList.includes(account);
}
