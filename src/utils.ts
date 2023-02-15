export function isAccountPrivileged(sender: string): boolean {
  return sender.endsWith(":parity.io") || sender.endsWith(":web3.foundation");
}
