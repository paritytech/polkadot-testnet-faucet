export function isAccountPrivileged(sender: string): boolean {
  return (
    sender.endsWith(':matrix.parity.io') || sender.endsWith(':web3.foundation')
  );
}
