<script lang="ts">
  import faqMd from "$lib/assets/FAQ.md?raw";
  import Faucet from "$lib/components/Faucet.svelte";
  import { type NetworkData, Westend } from "$lib/utils/networkData";

  let network: NetworkData = Westend;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);

  const title = `Get WND tokens for the Westend testnet and its parachains.
    Westend is a preview testnet for core developers and implementation partners.`;
</script>

<Faucet {network} {faq} {title} />
