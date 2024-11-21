<script lang="ts">
	import { testnet } from "$lib/utils/stores";
	import CheckCircle from "../icons/CheckCircle.svelte";

	export let hash: string;
</script>

<div class="icon">
	<CheckCircle class="max-w-full"/>
</div>
<div class="message">
	Successfully sent {$testnet.currency}s to your address.
</div>

{#if false && $testnet.explorer}
	<a
		href={`${$testnet.explorer}/extrinsic/${hash}`}
		data-testid="success-button"
		target="_blank"
		rel="noreferrer"
	>
		<button class="freq-btn btn-primary"> See transaction details</button>
	</a>
{/if}

<style lang="postcss">
	.message {
		@apply text-lg mb-4;
		font-weight: 400;
		font-size: 16px;
	}

	.icon {
		@apply w-full grid place-items-center text-success;
	}
</style>
