<script lang="ts">
	import { testnet } from "$lib/utils/stores";
	import CheckCircle from "../icons/CheckCircle.svelte";
	import { Button } from "@frequency-chain/style-guide";

	function onGoBack() {
	  window.location.reload();
	}
</script>

<div class="flex flex-col items-center">
<CheckCircle class="max-w-full text-success"/>
<div class="lgText mb-4 text-center text-success max-w-f320">
	Successfully sent {$testnet.currency}s to your address.
</div>
<Button data-testid="reload" intent="outlined-light" onclick={onGoBack}>Go back</Button>
</div>

<!-- {#if false && $testnet.explorer}
		<Button 
			href={`${$testnet.explorer}/extrinsic/${hash}`}
			data-testid="success-button"
			target="_blank"
			rel="noreferrer">
				See transaction details
		</Button>
{/if} -->
