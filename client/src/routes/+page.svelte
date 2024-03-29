<script lang="ts">
  import Faucet from "$lib/components/Faucet.svelte";
  import { Rococo, type NetworkData, Avail } from "$lib/utils/networkData";
  import faqMd from "$lib/assets/FAQ.md?raw";

  let network: NetworkData = Avail;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);
</script>

<Faucet {network} {faq} />
