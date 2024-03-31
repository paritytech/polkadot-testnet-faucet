<script lang="ts">
  import { MetaTags } from "svelte-meta-tags";
  import socialImage from "$lib/assets/polkadot.png";
</script>

<MetaTags
  title="Avail-DA Faucet"
  description="A fast and reliable Avail-DA testnet faucet for blockchain developers."
  openGraph={{
    images: [{ url: socialImage }],
  }}
  twitter={{
    title: "Avail-DA Faucet",
    description: "A fast and reliable Substrate testnet faucet for blockchain developers.",
    image: socialImage,
    imageAlt: "Avail-DA Faucet Website",
  }}
/>
