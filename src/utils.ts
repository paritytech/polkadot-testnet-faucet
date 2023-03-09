export function isAccountPrivileged(sender: string): boolean {
  return sender.endsWith(":parity.io") || sender.endsWith(":web3.foundation") || sender === "@user:localhost"; // Before merge: is that safe? Other way to do it?
}
