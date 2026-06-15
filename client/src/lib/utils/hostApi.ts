/**
 * Host API integration for detecting container environment,
 * reading the connected account address, and fetching balance
 * through the host's light client via PAPI.
 *
 * Uses dynamic imports to avoid SSR issues and keep the bundle small
 * when not running inside a Polkadot Desktop / dot.li browser container.
 */

import type { PolkadotClient, PolkadotSigner } from "polkadot-api";

import type { NetworkData } from "./networkData";

export function isHostEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Iframe (dot.li browser)
    if (window !== window.top) return true;
    // Webview (Polkadot Desktop)
    if ((globalThis as Record<string, unknown>).__HOST_WEBVIEW_MARK__ === true) return true;
  } catch {
    // Cross-origin iframe access throws — we're in an iframe
    return true;
  }
  return false;
}

export interface HostAccount {
  address: string;
  name?: string | null;
  publicKey: Uint8Array;
  signer: PolkadotSigner;
  /** Signs a raw message — wraps PolkadotSigner.signBytes for caller compat */
  signRaw?: (message: string) => Promise<string>;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export async function getHostAccount(ss58Prefix?: number): Promise<HostAccount | null> {
  if (!isHostEnvironment()) return null;
  try {
    const { SignerManager, HostProvider, DevProvider } = await import("@parity/product-sdk-signer");
    const prefix = ss58Prefix ?? 42;
    const manager = new SignerManager({
      dappName: "polkadot-testnet-faucet",
      ss58Prefix: prefix,
      // The faucet only needs `signRaw` for the ReCAPTCHA challenge — chain
      // submission happens server-side. Skip the host's ChainSubmit permission
      // prompt so older hosts (which don't recognise the new wire format) do
      // not stall the handshake.
      createProvider: (type) =>
        type === "host"
          ? new HostProvider({ ss58Prefix: prefix, requestChainSubmitPermission: false })
          : new DevProvider({ ss58Prefix: prefix }),
    });
    const connectResult = await manager.connect();
    if (!connectResult.ok) return null;
    // Faucet uses the user's externally connected account (not an app-scoped
    // product account) — the drip target should be the wallet the user picked.
    const account = manager.getState().selectedAccount ?? connectResult.value[0] ?? null;
    if (!account) return null;
    const signer = account.getSigner();
    return {
      address: account.address,
      name: account.name,
      publicKey: account.publicKey,
      signer,
      signRaw: async (message: string) => {
        const sig = await signer.signBytes(new TextEncoder().encode(message));
        return bytesToHex(sig);
      },
    };
  } catch {
    return null;
  }
}

export async function requestExternalPermission(): Promise<boolean> {
  if (!isHostEnvironment()) return true;
  try {
    const { requestPermission } = await import("@parity/product-sdk-host");
    // Blanket `Remote` permission — the host's RemotePermission codec accepts
    // a list of URL origins; an empty list means "any remote target".
    return await requestPermission({ tag: "Remote", value: [] });
  } catch {
    // Older host that doesn't implement, or transient failure — fall through.
    return true;
  }
}

// ── Host-mode balance fetching via PAPI ──

const clients = new Map<string, PolkadotClient>();

async function getClient(network: NetworkData): Promise<PolkadotClient> {
  let client = clients.get(network.genesis);
  if (client) return client;

  const { createClient } = await import("polkadot-api");

  let provider = null;
  if (isHostEnvironment()) {
    try {
      const { getHostProvider } = await import("@parity/product-sdk-host");
      provider = await getHostProvider(network.genesis);
    } catch {
      provider = null;
    }
  }
  if (!provider) {
    const { getWsProvider } = await import("polkadot-api/ws");
    provider = getWsProvider(network.rpcEndpoint);
  }

  client = createClient(provider);
  clients.set(network.genesis, client);
  return client;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))]);
}

export async function fetchHostBalance(
  address: string,
  network: NetworkData,
): Promise<{ transferable: string; reserved: string; overCap: boolean } | null> {
  try {
    const client = await withTimeout(getClient(network), 10_000);

    const descriptors = await import("@polkadot-api/descriptors");
    const descriptor =
      network.networkName === "Paseo"
        ? descriptors.paseo_asset_hub
        : network.networkName === "Summit"
          ? descriptors.summit_asset_hub
          : descriptors.westend_asset_hub;

    const api = client.getTypedApi(descriptor);
    const account = await withTimeout(api.query.System.Account.getValue(address, { at: "best" }), 10_000);

    const { free, reserved, frozen } = account.data;
    const divisor = 10n ** BigInt(network.decimals);

    // Match backend logic: transferable = free - max(frozen - reserved, 0)
    const frozenMinusReserved = frozen > reserved ? frozen - reserved : 0n;
    const transferable = free > frozenMinusReserved ? free - frozenMinusReserved : 0n;
    const accountBalance = Number(free / divisor);

    return {
      transferable: String(Number(transferable) / Number(divisor)),
      reserved: String(Number(reserved) / Number(divisor)),
      overCap: accountBalance > network.balanceCap,
    };
  } catch (e) {
    console.warn("Host balance fetch failed, falling back to API", e);
    return null;
  }
}
