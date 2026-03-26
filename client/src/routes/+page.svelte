<script lang="ts">
  import { browser } from "$app/environment";
  import faqMd from "$lib/assets/FAQ.md?raw";
  import Faucet from "$lib/components/Faucet.svelte";
  import { type NetworkData, Paseo, Westend } from "$lib/utils/networkData";

  let network: NetworkData = Paseo;

  if (browser) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("network") === "westend") {
      network = Westend;
    }
  }

  let faq: string = faqMd
    .replaceAll("<NETWORK-TOKEN>", network.currency)
    .replaceAll("<NETWORK-NAME>", network.networkName)
    .replaceAll("<DRIP-AMOUNT>", network.dripAmount);

  const title = `Get ${network.currency} tokens for Polkadot's ${network.networkName} testnet.

Maintained by the Paseo core group, this is the stable testnet for smart contracts and parachain builders before deploying to the Polkadot mainnet.

`;
</script>

<Faucet {network} {faq} {title} />
