<script lang="ts">
	import { base } from "$app/paths";
	import logo from "$lib/assets/logo.svg";
	import { Button } from "@frequency-chain/style-guide";
</script>

<div class="navigation-bar">
	<div class="flex-1">
		<div class="w-36 rounded-full">
			<a href={`${base}/`}><img src={logo} alt="logo" /></a>
		</div>
	</div>
	<div class="flex-none">
		<a href="#faq"><Button type="primary">&#8594; Questions?</Button></a>
	</div>
</div>

<style lang="postcss">
	.navigation-bar {
		@apply navbar px-1 md:px-6;
		position: absolute;
		top: 0;
	}
</style>
