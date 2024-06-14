<script lang="ts">
  import socialImage from "$lib/assets/polkadot.png";
  import { MetaTags } from "svelte-meta-tags";
</script>

<MetaTags
  title="Polkadot Faucet"
  description="A fast and reliable Polkadot testnet faucet for blockchain developers."
  openGraph={{
    images: [{ url: socialImage }],
  }}
  twitter={{
    title: "Polkadot Faucet",
    description: "A fast and reliable Substrate testnet faucet for blockchain developers.",
    image: socialImage,
    imageAlt: "Polkadot Faucet Website",
  }}
/>
