<script lang="ts">
	import ErrorCircle from "../icons/ErrorCircle.svelte";
	import { Button } from "@frequency-chain/style-guide";

	export let error: string | undefined;

	function onGoBack() {
		window.location.reload();
	}
</script>

<div class="icon">
	<ErrorCircle />
</div>
<div class="message" data-testid="error">
	{error ?? "There was an error during the transaction."}
</div>
<Button type="primary" data-testid="reload" on:click={onGoBack}>Go back</Button>

<style lang="postcss">
	.message {
		@apply text-lg mb-4;
		font-family: "Inter", sans-serif;
		font-weight: 400;
		font-size: 16px;
		color: rgba(255, 255, 255, 0.7);
	}

	.icon {
		@apply w-full grid place-items-center;
		color: #f87272;
	}
</style>
