import { PUBLIC_DEMO_MODE as DEMO } from "$env/static/public";

import type { NetworkData } from "./networkData";

export async function request(
  address: string,
  captchaResponse: string,
  network: NetworkData,
  parachain?: number,
): Promise<string> {
  if (DEMO !== undefined && DEMO !== "") {
    return await boilerplateRequest(address);
  }
  const chain = parachain && parachain > 0 ? parachain.toString() : undefined;
  return await faucetRequest(address, captchaResponse, network, chain);
}

export async function faucetRequest(
  address: string,
  captchaResponse: string,
  network: NetworkData,
  parachain_id?: string,
): Promise<string> {
  const body = { address, parachain_id, captchaResponse };

  const url = network.endpoint;
  if (!url) {
    throw new Error(`Endpoint for ${network.networkName} is not defined`);
  }
  const fetchResult = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = await fetchResult.json();
  if ("error" in result) {
    // FIXME
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    throw new Error(result.error);
  } else {
    return result.hash;
  }
}

/** Use this method if you want to test the flow of the app without contacting the faucet */
export async function boilerplateRequest(address: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (address === "error") {
    throw new Error("This is a terrible error!");
  }
  return "0x7824400bf61a99c51b946454376a84c636a2d86070996a6a5f55999b26e7df51";
}
