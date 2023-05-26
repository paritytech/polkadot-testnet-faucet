<script lang="ts">
	import logo from "../../assets/logo.svg";
</script>

<div class="navigation-bar">
	<div class="flex-1">
		<div class="w-36 rounded-full">
			<img src={logo} alt="polkadot logo" />
		</div>
	</div>
	<div class="flex-none">
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
