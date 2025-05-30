<script lang="ts">
	import { Button } from "@frequency-chain/style-guide";
	import ErrorCircle from "../icons/ErrorCircle.svelte";

	interface Props {
		error: string | undefined;
	}

	let { error }: Props = $props();

	function onGoBack() {
	  window.location.reload();
	}
</script>

<ErrorCircle class="max-w-full text-error"/>
<div class="lgText mb-4 text-center text-error" data-testid="error">
	{error ?? "There was an error during the transaction."}
</div>
<Button data-testid="reload" intent="outlined-light" onclick={onGoBack}>Go back</Button>
