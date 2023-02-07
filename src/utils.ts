export function isMatrixAccountPrivileged(sender: string): boolean {
  return sender.endsWith(":parity.io") || sender.endsWith(":web3.foundation");
}

export function isGoogleAccountPrivileged(sender: string): boolean {
  return sender.endsWith("@parity.io");
}
