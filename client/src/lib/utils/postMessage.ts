export interface FaucetMessage {
  type: "faucet:ready" | "faucet:success" | "faucet:error";
  payload?: { hash?: string; blockHash?: string; error?: string };
}

export function postToParent(message: FaucetMessage): void {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage(message, "*");
  }
}
