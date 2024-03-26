<script type="module" lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import Cross from "./icons/Cross.svelte";
  import { CaptchaProvider } from "$lib/utils/captcha";

  export let captchaKey: string;
  export let captchaProvider: string;
  const dispatch = createEventDispatcher<{ token: string }>();

  const captchaId = "captcha_element";
  let captchaError: boolean = false;
  export let theme: "dark" | "light" | "auto" = "auto";

  let componentMounted: boolean;

  onMount(() => {
    window.captchaLoaded = async () => {
      const colorTheme =
        theme === "auto"
          ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      const mobileScreen = window.innerHeight > window.innerWidth;

      if (captchaProvider === CaptchaProvider.procaptcha) {
        if (!window.procaptcha) {
          captchaError = true;
          throw new Error(`${captchaProvider} is undefined!`);
        }
        window.procaptcha.render(captchaId, {
          siteKey: captchaKey,
          theme: colorTheme,
          callback: "onToken",
          "chalexpired-callback": "onExpiredToken",
          captchaType: "image",
        });
      } else if (captchaProvider === CaptchaProvider.recaptcha) {
        if (!window.grecaptcha) {
          captchaError = true;
          throw new Error("grecaptcha is undefined!");
        }
        window.grecaptcha.render(captchaId, {
          sitekey: captchaKey,
          theme: colorTheme,
          callback: "onToken",
          size: mobileScreen ? "compact" : "normal",
          "expired-callback": "onExpiredToken",
        });
      } else {
        captchaError = true;
        throw new Error(`Unknown captcha provider: ${captchaProvider}`);
      }
    };

    window.onToken = (token) => {
      dispatch("token", token);
      // Forces a new captcha on page reload
      if (captchaProvider === CaptchaProvider.procaptcha) {
        window.localStorage.removeItem("@prosopo/current_account");
        window.localStorage.removeItem("@prosopo/provider");
      }
    };

    // clean the token so the form becomes invalid
    window.onExpiredToken = () => {
      dispatch("token", "");
    };

    // once we have mounted all the required methods, we import the script
    componentMounted = true;
    captchaError = false;
  });
</script>

<svelte:head>
  {#if componentMounted}
    {#if captchaProvider === "procaptcha"}
      <script
        type="module"
        src="https://js.prosopo.io/js/procaptcha.bundle.js?render=implicit&onload=captchaLoaded"
        async
        defer
      ></script>
    {:else}
      <script src="https://www.google.com/recaptcha/api.js?onload=captchaLoaded&render=explicit" async defer></script>
    {/if}
  {/if}
</svelte:head>

{#if captchaError}
  <div class="alert alert-error shadow-lg" data-testid="error">
    <div>
      <Cross />
      <span>Error loading {captchaProvider} Captcha. Please reload the page.</span>
    </div>
  </div>
{/if}
<div id={captchaId} class="z-0" />
