<script lang="ts">
  import {createEventDispatcher} from "svelte";
  export let captchaKey: string;

  const dispatch = createEventDispatcher<{ token: string }>();

  const captchaId = 'captcha_element';

  window.captchaLoaded = () => {
    const darkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mobileScreen = window.innerHeight > window.innerWidth;

    // @ts-ignore
    const captcha: Captcha = grecaptcha;

    captcha.render(captchaId, {
      sitekey: captchaKey,
      theme: darkTheme ? "dark" : "light",
      callback: 'onToken',
      size: mobileScreen ? 'compact' : 'normal',
      'expired-callback': 'onExpiredToken'
    });
  }

  window.onToken = (token) => {
    dispatch('token', token);
  }

  // clean the token so the form becomes invalid
  window.onExpiredToken = () => {
    dispatch('token', '');
  }
</script>

<svelte:head>
  <script src="https://www.google.com/recaptcha/api.js?onload=captchaLoaded&render=explicit" async defer></script>
</svelte:head>

<div id={captchaId}></div>

