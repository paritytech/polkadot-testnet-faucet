<script lang="ts">
  import { PUBLIC_CAPTCHA_KEY } from "$env/static/public";
  import type { NetworkData } from "$lib/utils/networkData";
  import { operation, testnet } from "$lib/utils/stores";

  import { request as faucetRequest } from "../utils";
  import CaptchaV2 from "./CaptchaV2.svelte";
  import NetworkDropdown from "./NetworkDropdown.svelte";
  import NetworkInput from "./NetworkInput.svelte";

  let address: string = "";
  export let network: number = -1;
  export let networkData: NetworkData;
  let token: string = "";
  let formValid: boolean;
  $: formValid = !!address && !!token && network != null;

  let webRequest: Promise<string>;

  function onSubmit() {
    webRequest = request(address);
    webRequest
      .then((hash) => {
        operation.set({ success: true, hash });
      })
      .catch((error) => {
        operation.set({ success: false, error, hash: "" });
      });
  }

  function onToken(tokenEvent: CustomEvent<string>) {
    token = tokenEvent.detail;
  }

  async function request(address: string): Promise<string> {
    return faucetRequest(address, token, $testnet, network);
  }
</script>

<form on:submit|preventDefault={onSubmit} class="w-full">
  <div class="grid md:grid-cols-2 md:gap-x-4">
    <NetworkDropdown currentNetwork={networkData} />
    {#if networkData.teleportEnabled}
      <NetworkInput bind:network />
    {/if}
  </div>

  <div class="field-group">
    <span class="form-label">{$testnet.networkName} Address</span>
    <input
      type="text"
      bind:value={address}
      placeholder="5rt6... or 0x318..."
      class="form-field"
      id="address"
      disabled={!!webRequest}
      data-testid="address"
    />
  </div>
  {#if !webRequest}
    <div class="grid place-items-center mt-2">
      <CaptchaV2 captchaKey={PUBLIC_CAPTCHA_KEY ?? ""} on:token={onToken} theme="dark" />
    </div>
    <button class="submit-btn" type="submit" data-testid="submit-button" disabled={!formValid}>
      Get some {$testnet.currency}s
    </button>
  {:else}
    <button class="submit-btn" disabled>Loading...</button>
  {/if}
</form>

<style lang="postcss">
  .field-group {
    margin-bottom: 1rem;
  }
</style>
