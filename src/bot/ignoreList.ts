type IsIgnoredArgs = {
  account: string;
  ignoreListVar: string;
};

/**
 * Check whether an account is in the ignore list
 */
export function isIgnored ({
  account,
  ignoreListVar = ''
}: IsIgnoredArgs): boolean {
  return ignoreListVar.split(',').includes(account);
}
