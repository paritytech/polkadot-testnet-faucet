<script lang="ts">
  import faqMd from "$lib/assets/FAQ.md?raw";
  import Faucet from "$lib/components/Faucet.svelte";
  import { type NetworkData, Paseo } from "$lib/utils/networkData";

  let network: NetworkData = Paseo;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);

  const title = `Get ${network.currency} tokens for Polkadot's ${network.networkName} testnet and its parachains. Paseo is Polkadot's primary testnet for users and builders.`;
</script>

<Faucet {network} {faq} {title} />
