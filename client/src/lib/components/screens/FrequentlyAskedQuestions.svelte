<script lang="ts">
	import SvelteMarkdown from "svelte-markdown";

	export let faq: string;
</script>

<div class="flex items-center justify-center my-2 md:my-16">
	<div class="card md:w-2/4 w-5/6 min-w-full mt-2 md:mt-20">
		<div class="card-body items-center text-center">
			<h1 id="faq">Frequently Asked Questions</h1>
			<div
				class="content prose lg:prose-xl prose-headings:text-xl prose-headings:text-black prose-headings:font-bold prose-p:text-opacity-90"
			>
				<SvelteMarkdown source={faq} />
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	h1 {
		@apply text-black text-4xl;
		font-weight: 700;
	}

	.content {
		@apply mt-2 md:mt-8 w-full text-left;
		font-size: 16px;
		font-weight: 400;

		& h2 {
			font-size: 16px;
			font-weight: 600;
		}
	}

	.card,
	.card-body {
		padding: 0;
	}

	@media only screen and (max-width: 768px) {
		.card,
		.card-body {
			padding: var(--padding-card, 2rem);
		}
	}
</style>
