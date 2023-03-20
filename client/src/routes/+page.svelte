<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Form from '$lib/components/Form.svelte';
	import SocialTags from '$lib/components/SocialTags.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<main>
	<SocialTags />
	<h1>Rococo Faucet</h1>

	<div class="flex items-center justify-center my-16">
		<Card>
			<Form network={data.parachain} />
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
