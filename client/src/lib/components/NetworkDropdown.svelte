<script lang="ts">
	import { Networks, type NetworkData } from "$lib/utils/networkData";

	import Chevron from "./icons/Chevron.svelte";

	export let currentNetwork: NetworkData;
</script>

<div class="dropdown w-full mb-14">
	<label class="label" for="address">
		<span class="form-label">Network</span>
	</label>
	<div tabindex="-1" class="chain-dropdown w-full" data-testid="network-select">
		<div class="w-full flex justify-between">
			<div>
				{currentNetwork.networkName}
			</div>
			<Chevron />
		</div>
	</div>
	<ul tabindex="-1" class="dropdown-content menu p-2 bg-white mt-2 shadow rounded-box w-full">
		{#each Networks as { network, url }}
			<li class:selected={network.networkName === currentNetwork.networkName}>
				<a data-testid={`network-${network.networkName}`} href={url}>{network.networkName} </a>
			</li>
		{/each}
	</ul>
</div>

<style lang="postcss">
	.chain-dropdown {
		@apply input w-full text-sm flex flex-col justify-center items-center cursor-pointer border border-gray3;
		background-color: white;
	}

	.form-label {
		@apply label-text;
		font-weight: 500;
		font-size: 16px;
	}

	.selected {
		@apply bg-gray3;
	}
</style>
