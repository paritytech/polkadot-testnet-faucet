import { json } from "@sveltejs/kit";
import { Networks } from "$lib/utils/networkData";

export const prerender = true;

export function GET() {
  const data = Networks.map(({ network }) => ({
    network: network.networkName.toLowerCase(),
    currency: network.currency,
    dripAmount: network.dripAmount,
    parachains: network.chains.map((chain) => ({
      name: chain.name,
      id: chain.id,
    })),
  }));

  return json(data);
}
