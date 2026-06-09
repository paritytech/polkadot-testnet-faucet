<script lang="ts">
  import { operation, testnet } from "$lib/utils/stores";

  import CheckCircle from "../icons/CheckCircle.svelte";

  export let blockHash: string | undefined = undefined;

  function onStartOver() {
    operation.update(() => undefined as never);
  }

  $: hasExplorerLink = !!($testnet.explorer && blockHash);
</script>

<div class="icon">
  <CheckCircle />
</div>
<div class="message">
  Successfully sent {$testnet.currency}s to your address.
</div>
{#if hasExplorerLink}
  <a href={`${$testnet.explorer}/${blockHash}`} data-testid="success-button" target="_blank" rel="noreferrer">
    <button class="submit-btn"> See transaction details</button>
  </a>
{/if}
<button class={hasExplorerLink ? "secondary-btn" : "submit-btn"} data-testid="start-over" on:click={onStartOver}>
  Make another request
</button>

<style lang="postcss">
  .message {
    @apply text-lg mb-4;
    font-weight: 400;
    font-size: 16px;
    color: #a8a29e;
  }

  .icon {
    @apply w-full grid place-items-center;
    color: #059669;
  }
</style>
