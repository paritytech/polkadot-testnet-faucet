import { PUBLIC_DEMO_MODE as DEMO, PUBLIC_FAUCET_URL } from "$env/static/public";

export async function request(
	address: string,
	recaptcha: string,
	parachain?: number
): Promise<string> {
	if (DEMO) {
		return boilerplateRequest(address, recaptcha);
	}
	const chain = (parachain && parachain > 0) ? parachain.toString() : undefined;
	return faucetRequest(address, recaptcha, chain);
}

export async function faucetRequest(
	address: string,
	recaptcha: string,
	parachain_id?: string
): Promise<string> {
	const body = {
		address,
		parachain_id,
		recaptcha
	};

	const url = PUBLIC_FAUCET_URL;
	if (!url) {
		throw new Error("PUBLIC_FAUCET_URL is not defined");
	}
	const fetchResult = await fetch(url, {
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json"
		}
	});
	const result = await fetchResult.json();
	if ("error" in result) {
		throw new Error(result.error);
	} else {
		return result.hash;
	}
}

/** Use this method if you want to test the flow of the app without contacting the faucet */
export async function boilerplateRequest(address: string, token: string): Promise<string> {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	if (address === "error") {
		throw new Error("This is a terrible error!");
	}
	console.log(token);
	return "0x7824400bf61a99c51b946454376a84c636a2d86070996a6a5f55999b26e7df51";
}
