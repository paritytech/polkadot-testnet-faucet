import { validatedFetch } from "@eng-automation/js";
import Joi from "joi";

export async function drip(webEndpoint: string, address: string, parachainId?: string): Promise<{
  hash: string
}> {
  const body: { address: string, recaptcha: string, parachain_id?: string } = {
    address: address,
    recaptcha: "anything goes"
  };
  if (parachainId) {
    body.parachain_id = parachainId;
  }

  return await validatedFetch<{
    hash: string;
  }>(`${webEndpoint}/drip/web`, Joi.object({ hash: Joi.string() }), {
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  });
}
