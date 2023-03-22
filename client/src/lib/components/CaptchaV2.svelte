<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";
	export let captchaKey: string;

	const dispatch = createEventDispatcher<{ token: string }>();

	const captchaId = "captcha_element";

	let componentMounted: boolean;

	onMount(() => {
		window.captchaLoaded = () => {
			const darkTheme =
				window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
			const mobileScreen = window.innerHeight > window.innerWidth;

			if (!window.grecaptcha) {
				throw new Error("grecaptcha is undefined!");
			}
			window.grecaptcha.render(captchaId, {
				sitekey: captchaKey,
				theme: darkTheme ? "dark" : "light",
				callback: "onToken",
				size: mobileScreen ? "compact" : "normal",
				"expired-callback": "onExpiredToken"
			});
		};

		window.onToken = (token) => {
			dispatch("token", token);
		};

		// clean the token so the form becomes invalid
		window.onExpiredToken = () => {
			dispatch("token", "");
		};

		// once we have mounted all the required methods, we import the script
		componentMounted = true;
	});
</script>

<svelte:head>
	{#if componentMounted}
		<script
			src="https://www.google.com/recaptcha/api.js?onload=captchaLoaded&render=explicit"
			async
			defer
		></script>
	{/if}
</svelte:head>

<div id={captchaId} />
