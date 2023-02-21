<script lang="ts">
  import {createEventDispatcher} from "svelte";

  const dispatch = createEventDispatcher<{ onToken: string, onExpire: string }>();

  const captchaId = 'captcha_element';

  window.captchaLoaded = () => {
    const darkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // @ts-ignore
    const captcha: Captcha = grecaptcha;

    captcha.render(captchaId, {
      sitekey: '6Ldlmp8kAAAAACEOROGslrJ7gUZjmJIm6WBPUVki',
      theme: darkTheme ? "dark" : "light",
      callback: 'onToken',
      'expired-callback': 'onExpiredToken'
    });
  }

  window.onToken = (token) => {
    dispatch('onToken', token);
  }

  window.onExpiredToken = () => {
    dispatch('onToken', '');
  }
</script>

<svelte:head>
  <script src="https://www.google.com/recaptcha/api.js?onload=captchaLoaded&render=explicit" async defer></script>
</svelte:head>

<div id={captchaId}></div>

