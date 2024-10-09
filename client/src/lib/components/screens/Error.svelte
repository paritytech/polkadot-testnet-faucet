<script lang="ts">
	import ErrorCircle from "../icons/ErrorCircle.svelte";

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
<button class="submit-btn" data-testid="reload" on:click={onGoBack}> Go back </button>

<style lang="postcss">
	.message {
		@apply text-lg mb-4;
		font-weight: 400;
		font-size: 16px;
	}

	.icon {
		@apply w-full grid place-items-center;
		color: #eb5757;
	}
</style>
