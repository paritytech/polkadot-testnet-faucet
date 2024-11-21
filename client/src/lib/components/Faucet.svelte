<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import Form from "$lib/components/Form.svelte";
  import SocialTags from "$lib/components/SocialTags.svelte";
  import Error from "$lib/components/screens/Error.svelte";
  import FrequentlyAskedQuestions from "$lib/components/screens/FrequentlyAskedQuestions.svelte";
  import Success from "$lib/components/screens/Success.svelte";
  import type { NetworkData } from "$lib/utils/networkData";
  import { operation, testnet } from "$lib/utils/stores";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import MarkUp from "./MarkUp.svelte";

  export let faq: string;
  export let network: NetworkData;

  let parachain: number;
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const parachainQuery = urlParams.get("parachain") ?? "-1";
    parachain = parseInt(parachainQuery);
    testnet.set(network);
  });
</script>
<main class="mt-9 px-9 md:px-f64 lg:px-0">
  <SocialTags />
  <MarkUp {faq} />
  <div class="flex items-center justify-center mt-16 mb-f48 md:my-16">
    <!-- @ts-ignore svelte-ignore -->
    <Card>
        {#if !$operation}
          <Form />
        {:else}
          <div in:fly={{ y: 30, duration: 500 }}>
            {#if $operation.success}
              <Success hash={$operation.hash} />
            {:else}
              <Error error={$operation.error} />
            {/if}
          </div>
        {/if}
    </Card>
  </div>
  <FrequentlyAskedQuestions {faq} />
</main>
