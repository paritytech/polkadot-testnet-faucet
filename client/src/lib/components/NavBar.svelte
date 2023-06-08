<script lang="ts">
	import logo from "$lib/assets/logo.svg";
	import NetworkDropdown from "./NetworkDropdown.svelte";
	import { base } from "$app/paths";

	import { Networks, type NetworkData } from "$lib/utils/networkData";
	export let currentUrl: string;

	let currentNetwork: NetworkData;

	function getCurrentNetwork(url: string): NetworkData {
		const index = Networks.findIndex((n) => n.url === url);
		if (index < 0) {
			throw new Error(`Network for ${url} not found!`);
		}
		return Networks[index].network;
	}

	$: currentNetwork = getCurrentNetwork(currentUrl);
</script>

<div class="navigation-bar">
	<div class="flex-1">
		<div class="w-36 rounded-full">
			<a href={`${base}/`}><img src={logo} alt="polkadot logo" /></a>
		</div>
	</div>
	<div class="flex-none">
		<NetworkDropdown {currentNetwork} />
		<a class="questions-btn" href="#faq"> &#8594; Questions? </a>
	</div>
</div>

<style lang="postcss">
	.questions-btn {
		@apply btn text-white hover:text-opacity-70;
		background-color: #191924;
		border: 1px solid rgba(255, 255, 255, 0.2);
		/* button/none */

		box-shadow: 0px 0px 0px #000000;
		border-radius: 9999px;
		text-transform: none;
	}

	.navigation-bar {
		@apply navbar px-1 md:px-6;
		position: absolute;
		top: 0;
	}
</style>
