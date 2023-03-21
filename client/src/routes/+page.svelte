<script lang="ts">
	import Card from "$lib/components/Card.svelte";
	import Form from "$lib/components/Form.svelte";
	import SocialTags from "$lib/components/SocialTags.svelte";
	import { onMount } from "svelte";

	let parachain: number;
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);

		const parachainQuery = urlParams.get("parachain") ?? "";
		parachain = parseInt(parachainQuery);
	});
</script>

<main>
	<SocialTags />
	<h1>Rococo Faucet</h1>

	<div class="flex items-center justify-center my-16">
		<Card>
			<Form network={parachain} />
		</Card>
	</div>

	<p class="read-the-docs">
		Check out <a href="https://use.ink/" target="_blank" rel="noreferrer">Ink!</a>, the official
		Substrate documentation!
	</p>
</main>

<style>
	.read-the-docs {
		color: #888;
	}

	main {
		max-width: 1280px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
	}
</style>
