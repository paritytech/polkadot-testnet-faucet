/**
 * Host API integration for detecting container environment,
 * reading the connected account address, and fetching balance
 * through the host's light client via PAPI.
 *
 * Uses dynamic imports to avoid SSR issues and keep the bundle small
 * when not running inside a Polkadot Desktop / dot.li browser container.
 */

import { accountIdFromBytes } from "@parity/product-sdk-address";
import type { PolkadotClient, PolkadotSigner } from "polkadot-api";

import type { NetworkData } from "./networkData";

/**
 * DotNS identifier this app derives product accounts under. In a `.dot`
 * deployment the hostname is itself the identifier; outside (localhost,
 * ArgoCD preview), fall back to the canonical `faucet.dot` so dev/preview
 * derive the same account as production.
 */
const SELF_DOTNS_FALLBACK = "faucet.dot";
const SELF_DOTNS = (() => {
  if (typeof window === "undefined") return SELF_DOTNS_FALLBACK;
  const h = window.location.hostname.toLowerCase();
  if (h.endsWith(".dot")) return h;
  return SELF_DOTNS_FALLBACK;
})();

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
  /** DotNS identifier the account was derived under (product accounts only). */
  dotNs?: string;
  /** Derivation index under the DotNS (product accounts only; default 0). */
  derivationIndex?: number;
  /** Signs a raw message — wraps PolkadotSigner.signBytes for caller compat */
  signRaw?: (message: string) => Promise<string>;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export async function getHostAccount(
  ss58Prefix?: number,
  dotNsOverride?: string,
  derivationIndexOverride?: number,
): Promise<HostAccount | null> {
  if (!isHostEnvironment()) return null;
  try {
    const { getAccountsProvider } = await import("@parity/product-sdk-host");
    const provider = await getAccountsProvider();
    if (!provider) {
      console.warn("[faucet] getAccountsProvider() returned null — not in a container");
      return null;
    }
    const prefix = ss58Prefix ?? 42;
    const dotNs = dotNsOverride ?? SELF_DOTNS;
    const derivationIndex = derivationIndexOverride ?? 0;

    // Primary path: app-scoped product account derived from the paired-mobile
    // identity under `dotNs` at the given derivation. Defaults to SELF_DOTNS
    // (which resolves to faucet.dot or the deployed `.dot` hostname); URL
    // params (?dotns=foo.dot&derivation=N) override for users who want to
    // drip an account scoped to a different DotNS.
    const productResult = await provider.getProductAccount(dotNs, derivationIndex);
    const product = productResult.match(
      (a) => a,
      (err) => {
        console.warn(`[faucet] getProductAccount("${dotNs}", ${derivationIndex}) failed:`, err?.name ?? err, err);
        return null;
      },
    );
    if (product) {
      const signer = provider.getProductAccountSigner(product, "signPayload");
      return {
        address: accountIdFromBytes(product.publicKey, prefix),
        name: null,
        publicKey: product.publicKey,
        signer,
        dotNs,
        derivationIndex,
        signRaw: async (message: string) => {
          const sig = await signer.signBytes(new TextEncoder().encode(message));
          return bytesToHex(sig);
        },
      };
    }

    // Fallback: legacy (non-product) accounts. Some hosts (incl.
    // @parity/host-api-test-sdk) only expose this surface; some users on real
    // Polkadot Desktop may have imported external accounts here too.
    const legacyAccounts = await provider.getLegacyAccounts();
    const legacy = legacyAccounts.match(
      (accs) => accs[0] ?? null,
      (err) => {
        console.warn("[faucet] getLegacyAccounts() failed:", err?.name ?? err, err);
        return null;
      },
    );
    if (!legacy) {
      console.warn("[faucet] no host account available — neither product nor legacy");
      return null;
    }
    const legacySigner = provider.getLegacyAccountSigner(legacy);
    return {
      address: accountIdFromBytes(legacy.publicKey, prefix),
      name: legacy.name ?? null,
      publicKey: legacy.publicKey,
      signer: legacySigner,
      signRaw: async (message: string) => {
        const sig = await legacySigner.signBytes(new TextEncoder().encode(message));
        return bytesToHex(sig);
      },
    };
  } catch (e) {
    console.warn("[faucet] getHostAccount threw:", e);
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
