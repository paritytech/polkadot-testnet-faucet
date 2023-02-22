import {DEMO_MODE, FAUCET_URL} from "./config";

export async function request(address: string, parachain: string, recaptcha: string): Promise<string> {
  if (DEMO_MODE) {
    return boilerplateRequest(address, recaptcha);
  }
  return faucetRequest(address, parachain, recaptcha);
}

export async function faucetRequest(address: string, parachain: string, recaptcha: string): Promise<string> {
  const body = {
    address,
    parachain_id: parachain,
    recaptcha
  }
  const fetchResult = await fetch(FAUCET_URL, {
    method: "POST", body: JSON.stringify(body), headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });
  const result = await fetchResult.json();
  if ('error' in result) {
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
