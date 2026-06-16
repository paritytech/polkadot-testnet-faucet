<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import Form from "$lib/components/Form.svelte";
  import Error from "$lib/components/screens/Error.svelte";
  import FrequentlyAskedQuestions from "$lib/components/screens/FrequentlyAskedQuestions.svelte";
  import Success from "$lib/components/screens/Success.svelte";
  import SocialTags from "$lib/components/SocialTags.svelte";
  import { getHostAccount, type HostAccount, isHostEnvironment, requestExternalPermission } from "$lib/utils/hostApi";
  import type { NetworkData } from "$lib/utils/networkData";
  import { postToParent } from "$lib/utils/postMessage";
  import { embed, operation, ready, testnet } from "$lib/utils/stores";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";

  import MarkUp from "./MarkUp.svelte";

  export let faq: string;
  export let network: NetworkData;
  export let title: string = `Get ${network.currency} tokens for Polkadot's ${network.networkName} testnet and its parachains.`;

  let parachain: number;
  let initialAddress: string = "";
  let hostAccount: HostAccount | null = null;
  let isHost = false;
  let overrideAddress = false;

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);

    // Accept both `?parachain=N` (legacy) and `?paraid=N` (clearer alias).
    // Validate as integer; fall back to the network's first chain on garbage.
    const paraRaw = urlParams.get("paraid") ?? urlParams.get("parachain");
    const paraParsed = paraRaw != null ? Number.parseInt(paraRaw, 10) : NaN;
    parachain = Number.isInteger(paraParsed) ? paraParsed : network.chains[0].id;
    testnet.set(network);

    const embedParam = urlParams.get("embed");
    const isEmbed = embedParam === "true" || embedParam === "1";
    isHost = isHostEnvironment();

    if (isEmbed) {
      embed.set(true);
      document.body.classList.add("embed-mode");
      postToParent({ type: "faucet:ready" });
    }

    if (isHost) {
      try {
        requestExternalPermission();
      } catch {
        /* host without Remote permission support */
      }

      // Allow overriding the derived product account via URL params:
      //   ?dotns=foo.dot           → derive against foo.dot instead of faucet.dot
      //   ?derivation=N            → use derivation index N instead of 0
      // Both default to (SELF_DOTNS, 0) when the params are absent.
      const dotNsParam = urlParams.get("dotns")?.trim();
      const derivationRaw = urlParams.get("derivation");
      const derivationParam = derivationRaw != null ? Number.parseInt(derivationRaw, 10) : undefined;
      const validDerivation =
        derivationParam != null && Number.isInteger(derivationParam) && derivationParam >= 0
          ? derivationParam
          : undefined;

      const account = await getHostAccount(network.ss58Prefix, dotNsParam || undefined, validDerivation);
      if (account != null) {
        hostAccount = account;
      }
    }

    // Address: URL param overrides host account (shown as "Other address" mode)
    const addressParam = urlParams.get("address");
    if (addressParam) {
      initialAddress = addressParam;
      overrideAddress = !!hostAccount;
    } else if (hostAccount) {
      initialAddress = hostAccount.address;
    }

    ready.set(true);
  });

  $: if ($embed && $operation) {
    if ($operation.success) {
      postToParent({
        type: "faucet:success",
        payload: { hash: $operation.hash, blockHash: $operation.blockHash },
      });
    } else {
      postToParent({
        type: "faucet:error",
        payload: { error: $operation.error },
      });
    }
  }
</script>

<main>
  {#if !$ready}
    <div class="flex items-center justify-center mt-8 mb-4 md:my-12">
      <span class="loader" />
    </div>
  {:else}
    {#if !$embed}
      <SocialTags />
      <MarkUp {faq} />
    {/if}
    <div class="flex items-center justify-center mt-8 mb-4 md:my-12">
      <Card {title}>
        {#if !$operation}
          <Form
            network={parachain ?? -1}
            networkData={network}
            {initialAddress}
            bind:hostAccount
            {isHost}
            {overrideAddress}
          />
        {:else}
          <div in:fly={{ y: 30, duration: 500 }}>
            {#if $operation.success}
              <Success blockHash={$operation.blockHash} />
            {:else}
              <Error error={$operation.error} />
            {/if}
          </div>
        {/if}
      </Card>
    </div>
    {#if !$embed}
      <FrequentlyAskedQuestions {faq} />
    {/if}
  {/if}
</main>

<style lang="postcss">
  main {
    @apply mx-auto my-0;
    max-width: 640px;
    padding: 0 1.5rem;
    text-align: center;
  }

  .loader {
    width: 24px;
    height: 24px;
    border: 2px solid #44403c;
    border-top-color: #a8a29e;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (min-width: 768px) {
    main {
      min-height: 90vh;
    }
  }
</style>
