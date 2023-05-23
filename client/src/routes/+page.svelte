<script lang="ts">
	import Card from "$lib/components/Card.svelte";
	import Form from "$lib/components/Form.svelte";
	import SocialTags from "$lib/components/SocialTags.svelte";
	import { testnetName } from "$lib/utils/stores";
	import { onMount } from "svelte";

	let parachain: number;
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);

		const parachainQuery = urlParams.get("parachain") ?? "-1";
		parachain = parseInt(parachainQuery);
		console.log(parachain, "parachain");
	});
</script>

<main>
	<SocialTags />
	<div class="flex items-center justify-center my-16">
		<Card>
			<Form network={parachain ?? -1} />
		</Card>
	</div>
</main>

<style>
	main {
		max-width: 1280px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
	}
</style>
