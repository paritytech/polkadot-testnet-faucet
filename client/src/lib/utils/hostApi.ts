/**
 * Host API integration for detecting container environment,
 * reading the connected account address, and fetching balance
 * through the host's light client via PAPI.
 *
 * Uses dynamic imports to avoid SSR issues and keep the bundle small
 * when not running inside a Polkadot Desktop / dot.li browser container.
 */

import type { InjectedWindow } from "@polkadot/extension-inject/types";
import type { PolkadotClient } from "polkadot-api";
import type { NetworkData } from "./networkData";

export function isHostEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Iframe (dot.li browser)
    if (window !== window.top) return true;
    // Webview (Polkadot Desktop)
    if ((globalThis as Record<string, unknown>)["__HOST_WEBVIEW_MARK__"] === true) return true;
  } catch {
    // Cross-origin iframe access throws — we're in an iframe
    return true;
  }
  return false;
}

export interface HostAccount {
  address: string;
  name?: string;
}

export async function getHostAccounts(): Promise<HostAccount[]> {
  try {
    const { injectSpektrExtension, SpektrExtensionName } = await import("@novasamatech/product-sdk");

    await injectSpektrExtension();

    const { injectedWeb3 } = globalThis as unknown as InjectedWindow;
    const ext = injectedWeb3?.[SpektrExtensionName];
    if (!ext?.enable) return [];

    const enabled = await ext.enable("polkadot-testnet-faucet");
    const accounts = await enabled.accounts.get();
    return accounts.map((a) => ({ address: a.address, name: a.name }));
  } catch {
    return [];
  }
}

// ── Host-mode balance fetching via PAPI ──

const clients = new Map<string, PolkadotClient>();

async function getClient(network: NetworkData): Promise<PolkadotClient> {
  let client = clients.get(network.networkName);
  if (client) return client;

  const { createPapiProvider } = await import("@novasamatech/product-sdk");
  const { createClient } = await import("polkadot-api");

  const provider = createPapiProvider(network.genesis);
  client = createClient(provider);
  clients.set(network.networkName, client);
  return client;
}

export async function fetchHostBalance(
  address: string,
  network: NetworkData,
): Promise<{ transferable: string; reserved: string; overCap: boolean } | null> {
  try {
    const client = await getClient(network);

    const descriptors = await import("@polkadot-api/descriptors");
    const descriptor = network.networkName === "Paseo" ? descriptors.paseo_asset_hub : descriptors.westend_asset_hub;

    const api = client.getTypedApi(descriptor);
    const account = await api.query.System.Account.getValue(address, { at: "best" });

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
