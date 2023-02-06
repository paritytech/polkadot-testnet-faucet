export function isAccountPrivileged(sender: string): boolean {
  return sender.endsWith(":parity.io") || sender.endsWith(":web3.foundation");
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Predicate = () => any | (() => Promise<any>);

export const waitUntil = async (predicate: Predicate, step = 100, timeout = 10000) => {
  const stopTime = Date.now() + timeout;
  while (Date.now() <= stopTime) {
    const result = await predicate();
    if (result) {
      return result;
    }
    await sleep(step);
  }
  throw new Error(`waitUntil timed out after ${timeout} ms`);
};
