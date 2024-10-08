<script lang="ts">
	import { PUBLIC_DEMO_MODE } from "$env/static/public";
	import { testnet } from "$lib/utils/stores";
</script>

<div class="card md:w-2/4 w-5/6 min-w-full shadow-xl faucet-card">
	<div class="card-body items-center text-center">
		<h1>{$testnet.networkName} Faucet</h1>
		<h3>
			Get {$testnet.currency} tokens for {$testnet.networkName} testnet.
		</h3>
		<div class="mt-2 md:mt-8 w-full">
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

<style lang="postcss">
	.faucet-card {
		background-color: #191924;
	}

	h1 {
		@apply text-white text-4xl;
		font-weight: 700;
	}

	h3 {
		@apply text-white opacity-70;
		font-weight: 400;
		font-size: 16px;
	}
</style>
