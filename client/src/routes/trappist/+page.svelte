<script lang="ts">
  import Faucet from "$lib/components/Faucet.svelte";
  import { Trappist, type NetworkData } from "$lib/utils/networkData";
  import faqMd from "$lib/assets/FAQ.md?raw";

  let network: NetworkData = Trappist;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);
</script>

<Faucet {network} {faq} />
