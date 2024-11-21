<script lang="ts">
	import { PUBLIC_DEMO_MODE } from "$env/static/public";
	import { testnet } from "$lib/utils/stores";
</script>

<div class="bg-navy rounded-3xl text-white w-full md:w-2/3 lg:w-1/2 md:max-w-[700px] px-f12 py-f24 md:px-f56 md:py-f64 lg:px-f64 lg:py-f96 shadow-xl">
	<div class="items-center text-center px-f16">
		<h3 class="title-h3">{$testnet.networkName} Faucet</h3>
    <p class="text-normal">
			Get {$testnet.currency} tokens for {$testnet.networkName} testnet.
		</p>
    <div class="items-center text-center px-f16">
      <div class="mt-2 md:mt-8 w-full">
        <slot />
      </div>
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
