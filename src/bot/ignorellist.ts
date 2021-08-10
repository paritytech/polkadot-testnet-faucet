/**
 * Check whether an account is in the ignore list
 * @param matrixAccount The matrix account
 * @returns true/false
 */
export function isIgnored (matrixAccount: string): boolean {
  const ignoreList: string[] = process.env.FAUCET_IGNORE_LIST?.split(',') ?? [];
  return ignoreList.includes(matrixAccount);
}
