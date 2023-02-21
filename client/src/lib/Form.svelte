<script lang="ts">
  import Tick from "./icons/Tick.svelte";
  import Cross from "./icons/Cross.svelte";
  import {request as faucetRequest} from "./utils/faucetRequest";
  import {fly} from 'svelte/transition';
  import CaptchaV2 from "./CaptchaV2.svelte";

  let address: string = '';
  let token: string = '';
  let formValid: boolean;
  $: formValid = !!address && !!token;

  let webRequest: Promise<string> = null;

  function onSubmit() {
    webRequest = request(address);
  }

  function onToken(tokenEvent: CustomEvent<string>) {
    token = tokenEvent.detail;
  }

  async function request(address: string): Promise<string> {
    return faucetRequest(address, token);
  }
</script>


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
    <div class="grid place-items-center">
      <CaptchaV2 on:token={onToken}/>
    </div>
    <button
      class="btn btn-primary mt-6"
      type="submit"
      disabled={!formValid}
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
