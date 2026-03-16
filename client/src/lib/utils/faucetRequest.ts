import { PUBLIC_DEMO_MODE as DEMO } from "$env/static/public";

import { fetchHostBalance, isHostEnvironment } from "./hostApi";
import type { NetworkData } from "./networkData";

export interface DripResult {
  hash: string;
  blockHash?: string;
}

export type TxStatusHandler = (status: string, hash?: string) => void;

export interface AuthPayload {
  recaptcha?: string;
  signature?: string;
  message?: string;
}

export async function request(
  address: string,
  auth: AuthPayload,
  network: NetworkData,
  parachain?: number,
  onStatus?: TxStatusHandler,
): Promise<DripResult> {
  if (DEMO !== undefined && DEMO !== "") {
    return await boilerplateRequest(address, onStatus);
  }
  const chain = parachain !== undefined && parachain >= 0 ? parachain.toString() : undefined;
  return await faucetRequest(address, auth, network, chain, onStatus);
}

export async function faucetRequest(
  address: string,
  auth: AuthPayload,
  network: NetworkData,
  parachain_id?: string,
  onStatus?: TxStatusHandler,
): Promise<DripResult> {
  const body = { address, parachain_id, ...auth };

  const url = network.endpoint;
  if (!url) {
    throw new Error(`Endpoint for ${network.networkName} is not defined`);
  }
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Accept: "application/x-ndjson", "Content-Type": "application/json" },
  });

  // Middleware errors (missing address) come back as regular JSON with 400
  if (!response.ok) {
    const text = await response.text();
    try {
      const result = JSON.parse(text) as { error?: string };
      throw new Error(result.error ?? "Request failed");
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(`Server error: ${text.slice(0, 100)}`);
      throw e;
    }
  }

  // Read NDJSON stream
  type NdjsonLine = { hash?: string; blockHash?: string; error?: string; status?: string };
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: NdjsonLine | undefined;
  let blockHash: string | undefined;

  const processLine = (line: string) => {
    if (!line.trim()) return;
    const data = JSON.parse(line) as NdjsonLine;
    if (data.status) {
      onStatus?.(data.status, data.hash);
    }
    if (data.blockHash) {
      blockHash = data.blockHash;
    }
    finalResult = data;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;
    for (const line of lines) {
      processLine(line);
    }
  }

  // Process remaining buffer
  processLine(buffer);

  if (!finalResult) {
    throw new Error("No response from server");
  }
  if (finalResult.error) {
    throw new Error(finalResult.error);
  }
  return { hash: finalResult.hash!, blockHash };
}

export async function fetchBalance(
  address: string,
  network: NetworkData,
): Promise<{ transferable: string; reserved: string; overCap: boolean } | null> {
  // In host mode, fetch balance through the host's light client via PAPI
  if (isHostEnvironment()) {
    const result = await fetchHostBalance(address, network);
    if (result) return result;
    // Fall through to backend API if host fetch fails
  }

  try {
    const baseUrl = network.endpoint.replace(/\/drip\/web\/?$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${baseUrl}/balance/${encodeURIComponent(address)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as { transferable: string; reserved: string; overCap: boolean };
  } catch {
    return null;
  }
}

/** Use this method if you want to test the flow of the app without contacting the faucet */
export async function boilerplateRequest(address: string, onStatus?: TxStatusHandler): Promise<DripResult> {
  const hash = "0x7824400bf61a99c51b946454376a84c636a2d86070996a6a5f55999b26e7df51";
  const blockHash = "0xabc123def456789000000000000000000000000000000000000000000000dead";
  onStatus?.("broadcasting");
  await new Promise((resolve) => setTimeout(resolve, 500));
  onStatus?.("broadcasted");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  onStatus?.("included", hash);
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (address === "error") {
    throw new Error("This is a terrible error!");
  }
  return { hash, blockHash };
}
