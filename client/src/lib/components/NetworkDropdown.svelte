<script lang="ts">
	import { Networks, type NetworkData } from "$lib/utils/networkData";

	import Chevron from "./icons/Chevron.svelte";

	export let currentNetwork: NetworkData;
</script>

<div class="dropdown w-full md:mr-8">
	<div tabindex="-1" class="chain-dropdown" data-testid="network-select">
		<div class="dropdown-button">
			<div class="dropdowns">
				{currentNetwork.networkName}
				<Chevron />
			</div>
		</div>
	</div>
	<ul
		tabindex="-1"
		class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full text-white"
	>
		{#each Networks as { network, url }, i}
			<li class:selected={network.networkName === currentNetwork.networkName}>
				<a data-testid={`network-${network.networkName}`} href={url}>{network.networkName} </a>
			</li>
		{/each}
	</ul>
</div>

<style lang="postcss">
	.dropdowns {
		@apply btn text-white hover:text-opacity-70;
		background-color: #191924;
		border: 1px solid rgba(255, 255, 255, 0.2);
		/* button/none */

		box-shadow: 0px 0px 0px #000000;
		border-radius: 9999px;
		text-transform: none;
	}
</style>
