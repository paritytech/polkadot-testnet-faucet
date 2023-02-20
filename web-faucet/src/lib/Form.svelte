<script lang="ts">
  import Tick from "./icons/Tick.svelte";
  import Cross from "./icons/Cross.svelte";
  import {doRecaptcha} from "./captcha";
  import {createEventDispatcher} from "svelte";
  import {CAPTCHA_KEY} from "./utils/config";
  import {faucetRequest} from "./utils/faucetRequest";
  import {fly} from 'svelte/transition';

  const dispatch = createEventDispatcher<{ submit: string }>();

  let address: string = '';

  let webRequest: Promise<string> = null;

  function onSubmit() {
    webRequest = request(address);
    dispatch('submit', address);
  }

  async function request(address: string): Promise<string> {
    const token = await doRecaptcha(CAPTCHA_KEY);
    return boilerplateRequest(address, token);
  }

  async function boilerplateRequest(address: string, token: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (address === "error") {
      throw new Error("This is a terrible error!");
    }
    console.log(token);
    return "0x7824400bf61a99c51b946454376a84c636a2d86070996a6a5f55999b26e7df51";
  }
</script>

<svelte:head>
  <script src="https://www.google.com/recaptcha/api.js?render={CAPTCHA_KEY}" async defer></script>
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
