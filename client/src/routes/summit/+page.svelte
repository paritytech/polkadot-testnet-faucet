<script lang="ts">
  import faqMd from "$lib/assets/FAQ.md?raw";
  import Faucet from "$lib/components/Faucet.svelte";
  import { type NetworkData, Summit } from "$lib/utils/networkData";

  let network: NetworkData = Summit;
  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName)
    .replaceAll("<DRIP-AMOUNT>", network.dripAmount);

  const title = `Get SUM tokens for the Summit testnet and its parachains.
    Summit is a clean-slate Polkadot testnet for early validation of relay, asset hub, people, and bulletin chains.`;
</script>

<Faucet {network} {faq} {title} />
