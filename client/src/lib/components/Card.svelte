<script lang="ts">
	import polkadot from "../../assets/polkadot.webp";
	import { PUBLIC_DEMO_MODE } from "$env/static/public";
</script>

<div class="card md:w-2/4 w-5/6 bg-base-100 shadow-xl">
	<figure class="rounded-xl">
		<img src={polkadot} alt="Polkadot" class="rounded-xl transition duration-500 hover:scale-150" />
	</figure>
	<div class="card-body items-center text-center">
		<slot />
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
