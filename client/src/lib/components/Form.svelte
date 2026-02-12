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
  $: isLoading = !!webRequest;

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

{#if !isLoading}
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
    <div class="grid place-items-center mt-2">
      <CaptchaV2 captchaKey={PUBLIC_CAPTCHA_KEY ?? ""} on:token={onToken} theme="dark" />
    </div>
    <button class="submit-btn" type="submit" data-testid="submit-button" disabled={!formValid}>
      Get some {$testnet.currency}s
    </button>
  </form>
{:else}
  <div class="sending-animation">
    <div class="a1-orbit">
      <div class="a1-ring" />
      <div class="a1-ring a1-ring-2" />
      <div class="a1-ring a1-ring-3" />
      <div class="a1-dot a1-d1" />
      <div class="a1-dot a1-d2" />
      <div class="a1-dot a1-d3" />
      <div class="a1-dot a1-d4" />
      <div class="a1-center" />
    </div>

    <p class="sending-text">Sending {$testnet.currency}s</p>
    <p class="sending-subtext">Submitting your transaction to the network</p>
  </div>
{/if}

<style lang="postcss">
  .field-group {
    margin-bottom: 1rem;
  }

  /* ── Sending animation ── */
  .sending-animation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
  }

  .sending-text {
    font-family: "DM Serif Display", Georgia, serif;
    font-size: 1.25rem;
    color: #fafaf9;
    margin: 0 0 0.375rem;
    letter-spacing: -0.01em;
  }

  .sending-subtext {
    font-size: 0.875rem;
    color: #78716c;
    margin: 0;
    animation: fade-pulse 2s ease-in-out infinite;
  }

  @keyframes fade-pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  /* ════════════════════════════════════════
     Animation 1 — Orbiting dots
     ════════════════════════════════════════ */
  .a1-orbit {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 2rem;
  }

  .a1-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid #292524;
  }
  .a1-ring-2 {
    inset: 18px;
    border-color: #44403c;
    animation: a1-ring-pulse 2s ease-in-out infinite;
  }
  .a1-ring-3 {
    inset: 36px;
    border-color: #44403c;
    animation: a1-ring-pulse 2s ease-in-out 0.6s infinite;
  }

  .a1-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: #ff2867;
    box-shadow: 0 0 20px rgba(255, 40, 103, 0.4);
    animation: a1-center-glow 1.5s ease-in-out infinite;
  }

  .a1-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff2867;
  }
  .a1-d1 {
    top: 0;
    left: calc(50% - 3px);
    transform-origin: 3px 60px;
    animation: a1-spin 3s linear infinite;
  }
  .a1-d2 {
    top: calc(50% - 3px);
    right: 0;
    transform-origin: -57px 3px;
    animation: a1-spin 3s linear infinite;
    animation-delay: -0.75s;
  }
  .a1-d3 {
    top: 18px;
    left: calc(50% - 2px);
    width: 4px;
    height: 4px;
    background: #d6d3d1;
    opacity: 0.6;
    transform-origin: 2px 42px;
    animation: a1-spin 4s linear infinite reverse;
  }
  .a1-d4 {
    top: 36px;
    left: calc(50% - 2px);
    width: 4px;
    height: 4px;
    background: #a8a29e;
    opacity: 0.4;
    transform-origin: 2px 24px;
    animation: a1-spin 5s linear infinite;
  }

  @keyframes a1-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes a1-ring-pulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.7;
    }
  }
  @keyframes a1-center-glow {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(255, 40, 103, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 40, 103, 0.6);
      transform: scale(1.2);
    }
  }
</style>
