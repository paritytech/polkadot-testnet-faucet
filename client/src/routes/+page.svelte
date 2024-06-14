<script lang="ts">
  import faqMd from "$lib/assets/FAQ.md?raw";
  import Faucet from "$lib/components/Faucet.svelte";
  import { type NetworkData, Rococo } from "$lib/utils/networkData";

  let network: NetworkData = Rococo;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);
</script>

<Faucet {network} {faq} />
