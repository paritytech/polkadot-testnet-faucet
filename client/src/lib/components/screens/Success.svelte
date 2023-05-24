<script lang="ts">
	import { testnet } from "$lib/utils/stores";
	import CheckCircle from "../icons/CheckCircle.svelte";

	export let hash: string;
</script>

<div class="icon">
	<CheckCircle />
</div>
<div class="message">
	Successfully sent {$testnet.currency} to your address
</div>
<a
	href={`https://rococo.subscan.io/extrinsic/${hash}`}
	data-testid="success-button"
	target="_blank"
	rel="noreferrer"
>
	<button class="submit-btn"> See transaction details </button>
</a>

<style lang="postcss">
	.message {
		@apply text-lg mb-4;
		font-family: "Inter", sans-serif;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.7);
	}

	.icon {
		@apply w-full grid place-items-center;
		color: #51e591;
	}
</style>
