<script lang="ts">
    import SvelteMarkdown from 'svelte-markdown';
	import SocialTags from "$lib/components/SocialTags.svelte";
	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<main>
	<SocialTags />
	<div class="flex items-center justify-center my-16">
		<div class="card md:w-2/4 w-5/6 min-w-full shadow-xl faucet-card">
			<div class="card-body items-center text-center">
				<h1>Frequently Asked Questions</h1>
				<div class="mt-2 md:mt-8 w-full text-white text-opacity-80 text-left">
					<SvelteMarkdown source={data.faq} />
				</div>
			</div>
		</div>
	</div>
</main>

<style lang="postcss">
	main {
		@apply mx-auto my-0 md:p-8;
		max-width: 720px;
		text-align: center;
	}

	@media (min-width: 768px) {
		main {
			min-height: 90vh;
		}
	}

	.faucet-card {
		background-color: #191924;
	}

	h1 {
		font-family: "Unbounded", sans-serif;
		@apply text-white text-4xl;
		font-weight: 700;
	}

	h3 {
		@apply text-white opacity-70;
		font-weight: 400;
		font-size: 16px;
	}
</style>
