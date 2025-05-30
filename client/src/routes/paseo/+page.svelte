<script lang="ts">
  import Faucet from "$lib/components/Faucet.svelte";
  import { Paseo, type NetworkData } from "$lib/utils/networkData";
  import faqMd from "$lib/assets/FAQ.md?raw";

  let network: NetworkData = Paseo;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName);
</script>

<Faucet {faq} />
