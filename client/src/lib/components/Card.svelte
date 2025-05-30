<script lang="ts">
	import { PUBLIC_DEMO_MODE } from "$env/static/public";
	import { testnet } from "$lib/utils/stores";
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="bg-darkPurple flex flex-col gap-f12 rounded-3xl items-center text-white w-full md:w-4/5 lg:w-1/2 md:max-w-[700px] px-f12 py-f24 md:px-f56 md:py-f64 lg:px-f64 lg:py-f96 shadow-xl">
		<h3 class="font-bold">{$testnet.networkName} Faucet</h3>
    <p>
			Get {$testnet.currency} tokens for {$testnet.networkName} testnet.
		</p>
    {@render children?.()}
</div>

{#if PUBLIC_DEMO_MODE}
	<div class="fixed bottom-0 left-0 w-full bg-primary text-white px-f16 py-f8">
		<div class="alert alert-warning">
			<div>
				<span>Demo mode enabled. Faucet will <b>not</b> be contacted</span>
			</div>
		</div>
	</div>
{/if}
