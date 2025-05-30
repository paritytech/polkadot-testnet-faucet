<script lang="ts">
	import SvelteMarkdown from "svelte-markdown";

	interface Props {
		faq: string;
	}

	let { faq }: Props = $props();
</script>

<div class="flex items-center justify-center my-2 md:mt-f16 mb-f96">
	<div class="md:w-2/3 w-5/6 mt-2 md:mt-f20">
		<div class=" items-center text-center">
			<h3 id="faq" class="font-bold text-primary">Frequently Asked Questions</h3>
			<div id="faq-content"
				class="mt-f32 w-full text-left prose lg:prose-xl prose-headings:text-xl prose-headings:text-black prose-headings:font-bold prose-p:text-opacity-90"
			>
				<SvelteMarkdown source={faq} />
			</div>
		</div>
	</div>
</div>
