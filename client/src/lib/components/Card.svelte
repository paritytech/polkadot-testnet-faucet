<script lang="ts">
	import polkadot from "../../assets/polkadot.webp";
	import { PUBLIC_DEMO_MODE } from "$env/static/public";
	import { testnetName } from "$lib/utils/stores";
</script>

<div class="card md:w-2/4 w-5/6 min-w-full shadow-xl faucet-card">
	<div class="card-body items-center text-center">
		<h1>{$testnetName} Faucet</h1>
		<h3>Get $ROC tokens for Polkadot's {$testnetName} testnet and its parachains.</h3>
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
		font-family: "Unbounded", sans-serif;
		@apply text-white;
		font-weight: 700;
	}

	h3 {
		@apply text-white opacity-70;
		font-weight: 400;
		font-size: 16px;
	}
</style>
