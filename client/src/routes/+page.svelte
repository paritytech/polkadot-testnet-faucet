<script lang="ts">
	import Card from "$lib/components/Card.svelte";
	import SocialTags from "$lib/components/SocialTags.svelte";
	import FrequentlyAskedQuestions from "$lib/components/screens/FrequentlyAskedQuestions.svelte";
</script>

<main>
	<SocialTags />
	<div class="flex items-center justify-center my-16">
		<Card>
			<a href="/rococo">
				<button class="submit-btn" type="submit" data-testid="submit-button">
					Rococo Faucet
				</button>
			</a>

			<a href="/westend">
				<button class="submit-btn" type="submit" data-testid="submit-button">
					Westend Faucet
				</button>
			</a>
		</Card>
	</div>
	<FrequentlyAskedQuestions faq="Here are questions" />
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
</style>
