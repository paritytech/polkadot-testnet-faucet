<!-- Temporary page; take down some time after rococo shutdown -->
<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import MarkUp from "$lib/components/MarkUp.svelte";
  import FrequentlyAskedQuestions from "$lib/components/screens/FrequentlyAskedQuestions.svelte";
  import SocialTags from "$lib/components/SocialTags.svelte";
  import { type NetworkData, Rococo } from "$lib/utils/networkData";
  import { testnet } from "$lib/utils/stores";
  import { onMount } from "svelte";

  let network: NetworkData = Rococo;
  // Keeping the FAQ section just because it's easier than either:
  // * removing "Questions" section from navbar
  // * getting around broken link test
  let faq: string = `
# Rococo decomission plan
https://forum.polkadot.network/t/rococo-to-be-deprecated-in-october/8702
  `;

  onMount(() => {
    testnet.set(network);
  });
</script>

<main>
  <SocialTags />
  <div class="flex items-center justify-center mt-16 mb-4 md:my-16">
    <Card title="Rococo faucet has been deprecated">
      <h3 class="card-subtitle">
        Rococo network is being shut down. <br />
        Please use it's successor, <a href="https://github.com/paseo-network">Paseo network</a>
      </h3>
    </Card>
  </div>
  <MarkUp {faq} />
  <FrequentlyAskedQuestions {faq} />
</main>

<style lang="postcss">
  main {
    @apply mx-auto my-0 md:p-8;
    max-width: 720px;
    text-align: center;
  }

  @media (min-width: 768px) {
    main {
      min-height: 90vh;
    }
  }
</style>
