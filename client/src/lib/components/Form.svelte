<script lang="ts">
  import { PUBLIC_CAPTCHA_KEY } from "$env/static/public";
  import type { NetworkData } from "$lib/utils/networkData";
  import { operation, testnet } from "$lib/utils/stores";
  import { request as faucetRequest } from "../utils";
  import CaptchaV2 from "./CaptchaV2.svelte";
  import NetworkDropdown from "./NetworkDropdown.svelte";
  import NetworkInput from "./NetworkInput.svelte";
  import {validateAddress} from "@polkadot/util-crypto";

  let address: string = "";
  export let network: number = -1;
  export let networkData: NetworkData;
  let token: string = "";
  let formValid: boolean;
  $: formValid = !!address && !!token && !!network;

  let webRequest: Promise<string>;

  function onSubmit() {
    webRequest = request(address);
    webRequest
      .then((hash) => {
        operation.set({ success: true, hash });
      })
      .catch((error) => {
        if (error.toString().match("TypeError: Failed to fetch")) {
           operation.set({success: false, error: "Could not connect to faucet server.", hash: "" });
        } else {
          operation.set({ success: false, error, hash: "" });
        }
      });
  }

  function addressValid(maybeAddress: string) {
    try {
      return validateAddress(maybeAddress);
    } catch(error) {
      console.error(error);
      operation.set({ success: false, error: "Address is invalid", hash: "" });
    }
  }

  function onToken(tokenEvent: CustomEvent<string>) {
    if (address !== "" && addressValid(address)) {
      token = tokenEvent.detail;
    }
  }

  async function request(address: string): Promise<string> {
    return faucetRequest(address, token, $testnet, network);
  }
</script>

<form on:submit|preventDefault={onSubmit} class="w-full">
  <div class="grid md:grid-cols-2 md:gap-x-4">
    <NetworkDropdown currentNetwork={networkData} />
    <NetworkInput bind:network />
  </div>

  <div class="inputs-container">
    <label class="label" for="address">
      <span class="form-label">{$testnet.networkName} Address</span>
    </label>
    <input
      type="text"
      bind:value={address}
      placeholder="5rt6..."
      class="input w-full text-sm form-background text-white"
      id="address"
      disabled={!!webRequest}
      data-testid="address"
    />
  </div>
  {#if !webRequest}
    <div class="grid place-items-center">
      <CaptchaV2 captchaKey={PUBLIC_CAPTCHA_KEY ?? ""} on:token={onToken} theme="dark" />
    </div>
    <button class="submit-btn" type="submit" data-testid="submit-button" disabled={!formValid}>
      Get some {$testnet.currency}s
    </button>
  {:else}
    <button class="btn btn-primary loading" disabled> Loading</button>
  {/if}
</form>

<style lang="postcss">
  .inputs-container {
    margin-bottom: 1.5rem;
  }

  form {
    font-family: "Inter", sans-serif;
  }

  .form-background {
    background-color: #191924;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .form-label {
    @apply label-text text-white;
    font-weight: 500;
    font-size: 16px;
  }
</style>
