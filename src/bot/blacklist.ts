export const blacklist: string[] = [
  // Test account Chevdor
  '5CwPxumBRDLkP7VQEYzhwoYw6AP4FNmRM7G1pj7Atj6dEzgY'
];

export function isBlacklisted (account: string): boolean {
  return blacklist.includes(account);
}
