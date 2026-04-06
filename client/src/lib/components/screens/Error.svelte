<script lang="ts">
  import { operation } from "$lib/utils/stores";

  import ErrorCircle from "../icons/ErrorCircle.svelte";

  export let error: string | undefined;

  function onGoBack() {
    operation.update(() => undefined as never);
  }
</script>

<div class="icon">
  <ErrorCircle />
</div>
<div class="message" data-testid="error">
  {error ?? "There was an error during the transaction."}
</div>
<button class="submit-btn" data-testid="reload" on:click={onGoBack}> Go back </button>

<style lang="postcss">
  .message {
    @apply text-lg mb-4;
    font-weight: 400;
    font-size: 16px;
    color: #a8a29e;
  }

  .icon {
    @apply w-full grid place-items-center;
    color: #dc2626;
  }
</style>
