<script lang="ts">
  import Tick from "./icons/Tick.svelte";
  import Cross from "./icons/Cross.svelte";
  import {doRecaptcha} from "./captcha";

  const captchaKey: string = import.meta.env.VITE_CAPTCHA_KEY;
  const faucetUrl = import.meta.env.VITE_FAUCET_URL;


  let address: string = '';

  let webRequest: Promise<string> = null;

  function onSubmit() {
    webRequest = boilerplateRequest(address);
  }

  async function boilerplateRequest(address: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const token = await doRecaptcha(captchaKey);
    if (address === "error") {
      throw new Error("This is a terrible error!");
    }
    console.log(token);
    return "0x7824400bf61a99c51b946454376a84c636a2d86070996a6a5f55999b26e7df51";
  }

  async function faucetRequest(address: string): Promise<string> {
    const token = await doRecaptcha(captchaKey);
    const body = {
      address,
      parachain_id: "1002",
      recaptcha: token
    }
    const fetchResult = await fetch(faucetUrl, {
      method: "POST", body: JSON.stringify(body), headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    const result = await fetchResult.json();
    if ('error' in result) {
      throw new Error(result.error);
    } else {
      return result.hash;
    }
  }
</script>

<svelte:head>
  <script src="https://www.google.com/recaptcha/api.js?render={captchaKey}" async defer></script>
</svelte:head>

<form on:submit|preventDefault={onSubmit}>
  <input
    type="text"
    bind:value={address}
    placeholder="Enter your address"
    class="input w-full input-primary mb-6"
    disabled={!!webRequest}
  />
  {#if !webRequest}
    <button
      class="btn btn-primary"
      type="submit"
      disabled={!address}
    >
      Submit
    </button>
  {:else}
    {#await webRequest}
      <button class="btn btn-primary loading" disabled>
        Loading
      </button>
    {:then result}
      <div in:fly="{{ y: 30, duration: 500 }}" class="alert alert-success shadow-lg">
        <div>
          <Tick/>
          <span>
                Your funds have been sent.<br/>
                <a href={`https://rococo.subscan.io/extrinsic/${result}`} target="_blank">
                  Click here to see the transaction
                </a>
              </span>
        </div>
      </div>
    {:catch error}
      <div class="alert alert-error shadow-lg">
        <div>
          <Cross/>
          <span>{error}</span>
        </div>
      </div>
    {/await}
  {/if}
</form>
