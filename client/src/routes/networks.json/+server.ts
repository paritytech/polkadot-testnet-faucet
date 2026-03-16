import { json } from "@sveltejs/kit";
import { Networks } from "$lib/utils/networkData";

export const prerender = true;

export function GET(): Response {
  const data = Networks.map(({ network }) => {
    return {
      network: network.networkName.toLowerCase(),
      currency: network.currency,
      dripAmount: network.dripAmount,
      parachains: network.chains.map((chain) => {
        return {
          name: chain.name,
          id: chain.id,
        };
      }),
    };
  });

  return json(data);
}
