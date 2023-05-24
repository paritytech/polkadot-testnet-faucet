<script lang="ts">
	import { PUBLIC_ISSUE_LINK } from "$env/static/public";
	import logo from "../../assets/logo.svg";
</script>

<div class="navbar px-1 md:px-6">
	<div class="flex-1">
		<div class="w-36 rounded-full">
			<img src={logo} alt="polkadot logo" />
		</div>
	</div>
	<div class="flex-none">
		<a class="btn issue-btn" href={PUBLIC_ISSUE_LINK} target="_blank"> &#8594; Report an issue </a>
	</div>
</div>

<style lang="postcss">
	.issue-btn {
		background-color: #191924;
		border: 1px solid rgba(255, 255, 255, 0.2);
		/* button/none */

		box-shadow: 0px 0px 0px #000000;
		border-radius: 9999px;
	}
</style>
