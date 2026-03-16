<script lang="ts">
  import { PUBLIC_DEMO_MODE } from "$env/static/public";
  import { embed, testnet } from "$lib/utils/stores";

  export let title: string;
</script>

<div class="faucet-card w-full">
  <div class="text-center">
    <h1 class="card-title">{$testnet.faucetTitle}</h1>
    {#if !$embed}
      <p class="card-subtitle">
        {title}
      </p>
    {/if}
    <div class="w-full text-left">
      <slot />
    </div>
  </div>
</div>

{#if PUBLIC_DEMO_MODE}
  <div class="toast toast-start">
    <div class="alert alert-warning">
      <div>
        <span>Demo mode enabled. Faucet will <b>not</b> be contacted</span>
      </div>
    </div>
  </div>
{/if}
