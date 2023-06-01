<script lang="ts">
	import Faucet from "$lib/components/Faucet.svelte";
	import { Rococo, type NetworkData } from "$lib/utils/networkData";

	import type { PageData } from "./$types";
	export let data: PageData;

	let network: NetworkData = Rococo;
	let faq: string = data.faq
		.replaceAll("<NETWORK-TOKEN>", network.currency.replace("$", ""))
		.replaceAll("<NETWORK-NAME>", network.networkName);
</script>

<Faucet {network} {faq} />
