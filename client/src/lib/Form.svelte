<script lang="ts">
  import Tick from "./icons/Tick.svelte";
  import Cross from "./icons/Cross.svelte";
  import {CAPTCHA_KEY, doRecaptcha} from "./utils";
  import {request as faucetRequest} from "./utils/faucetRequest";
  import {fly} from 'svelte/transition';

  let address: string = '';

  let webRequest: Promise<string> = null;

  function onSubmit() {
    webRequest = request(address);
  }

  async function request(address: string): Promise<string> {
    const token = await doRecaptcha(CAPTCHA_KEY);
    return faucetRequest(address, token);
  }
</script>

<svelte:head>
  <script src="https://www.google.com/recaptcha/api.js?render={CAPTCHA_KEY}" async defer></script>
</svelte:head>

<form on:submit|preventDefault={onSubmit} class="w-full">
  <label class="label" for="address">
    <span class="label-text">Your SS58 Address</span>
  </label>
  <input
    type="text"
    bind:value={address}
    placeholder="Enter your address"
    class="input w-full input-primary mb-6 text-sm"
    id="address"
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
            <a href={`https://rococo.subscan.io/extrinsic/${result}`} target="_blank" rel="noreferrer">
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
