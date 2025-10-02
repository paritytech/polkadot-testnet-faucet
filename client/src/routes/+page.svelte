<script lang="ts">
  import faqMd from "$lib/assets/FAQ.md?raw";
  import Faucet from "$lib/components/Faucet.svelte";
  import { type NetworkData, Paseo } from "$lib/utils/networkData";

  let network: NetworkData = Paseo;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);

  const title = `Get PAS tokens for Polkadot's testnet.

Maintained by the Paseo core group, this is the stable testnet for smart contracts and parachain builders before deploying to the Polkadot mainnet.

`;
</script>

<Faucet {network} {faq} {title} />
