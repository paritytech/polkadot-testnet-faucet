import {FAUCET_URL} from "./config";

export async function faucetRequest(address: string, recaptcha: string): Promise<string> {
  const body = {
    address,
    parachain_id: "1002",
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
