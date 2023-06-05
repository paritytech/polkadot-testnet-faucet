<script lang="ts">
	import Card from "$lib/components/Card.svelte";
	import SocialTags from "$lib/components/SocialTags.svelte";
	import FrequentlyAskedQuestions from "$lib/components/screens/FrequentlyAskedQuestions.svelte";
</script>

<main>
	<SocialTags />
	<div class="flex items-center justify-center my-16">
		<div class="card md:w-2/4 w-5/6 min-w-full shadow-xl faucet-card">
			<div class="card-body items-center text-center">
				<h1 class="card-title">Polkadot Faucets</h1>
				<h3 class="card-subtitle">Get tokens for Polkadot's testnets and its parachains.</h3>
				<div class="mt-2 md:mt-8 w-full">
					<a href="/rococo">
						<button class="submit-btn font-bold text-lg" type="submit" data-testid="submit-button">
							Rococo Faucet
						</button>
					</a>

					<a href="/westend">
						<button class="submit-btn font-bold text-lg" type="submit" data-testid="submit-button">
							Westend Faucet
						</button>
					</a>
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
</style>
