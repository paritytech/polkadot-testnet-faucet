import { PUBLIC_DEMO_MODE as DEMO } from "$env/static/public";

import type { NetworkData } from "./networkData";

export async function request(
	address: string,
	captcha: string,
	network: NetworkData,
	parachain?: number
): Promise<string> {
	if (DEMO !== undefined && DEMO !== "") {
		return await boilerplateRequest(address);
	}
	const chain = parachain && parachain > 0 ? parachain.toString() : undefined;
	return await faucetRequest(address, captcha, network, chain);
}

export async function faucetRequest(
	address: string,
	captcha: string,
	network: NetworkData,
	parachain_id?: string
): Promise<string> {
	const body: Record<string, string> = { address, captcha };

	const chain = network.chains.find((x) => x.id === parseInt(parachain_id || "-1", 10));

	if (!chain) {
		throw new Error(
			`Parachain id:${parachain_id || "-1"} for ${network.networkName} is not defined`
		);
	}

	// Force the parachain_id to be empty if we have a spcific chain endpoint

	if (!chain.endpoint && parachain_id) {
		body.parachain_id = parachain_id;
	}

	const url = chain.endpoint || network.endpoint;
	if (!url) {
		throw new Error(`Endpoint for ${network.networkName} with ${chain.name} is not defined`);
	}
	const fetchResult = await fetch(url, {
		method: "POST",
		body: JSON.stringify(body),
		headers: { Accept: "application/json", "Content-Type": "application/json" }
	});
	// FIXME

	const result = await fetchResult.json();
	if ("error" in result) {
		const errText: string = result.error?.toString() || "There was an unknown error";
		throw new Error(errText);
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
