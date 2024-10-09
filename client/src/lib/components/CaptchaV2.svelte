<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Cross from "./icons/Cross.svelte";
	// @ts-ignore
	import HCaptcha from "svelte-hcaptcha";
	import { PUBLIC_CAPTCHA_KEY } from "$env/static/public";

	const siteKey = PUBLIC_CAPTCHA_KEY;

	const dispatch = createEventDispatcher();

	const captchaId = "captcha_element";
	let captchaError = false;
	let captchaKey = "";

	const handleSuccess = (payload: { detail?: { token: string } }) => {
		const token = payload?.detail?.token || "";
		dispatch("token", token);
		captchaError = false;
	};

	const handleError = (error: Error) => {
		captchaError = true;
		console.error(error);
	};
</script>

<HCaptcha
	sitekey={siteKey}
	bind:this={captchaKey}
	theme="light"
	on:success={handleSuccess}
	on:error={handleError}
/>

{#if captchaError}
	<div class="alert alert-error shadow-lg text-black" data-testid="error">
		<div>
			<Cross />
			<span>Error loading HCaptcha. Please reload the page.</span>
		</div>
	</div>
{/if}
<div id={captchaId} />
