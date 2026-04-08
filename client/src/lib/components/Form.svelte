<script lang="ts">
  import { PUBLIC_CAPTCHA_KEY } from "$env/static/public";
  import type { HostAccount } from "$lib/utils/hostApi";
  import type { NetworkData } from "$lib/utils/networkData";
  import { embed, operation, testnet } from "$lib/utils/stores";
  import { getSs58AddressInfo } from "polkadot-api";

  import { fetchBalance, request as faucetRequest } from "../utils";
  import CaptchaV2 from "./CaptchaV2.svelte";
  import NetworkDropdown from "./NetworkDropdown.svelte";
  import NetworkInput from "./NetworkInput.svelte";

  export let initialAddress: string = "";
  export let hostAccount: HostAccount | null = null;
  export let isHost = false;
  export let overrideAddress = false;
  let address: string = "";
  let _addressInitialized = false;
  $: if (initialAddress && !_addressInitialized) {
    _addressInitialized = true;
    address = initialAddress;
  }
  export let network: number = -1;
  export let networkData: NetworkData;

  let useCustomAddress = false;
  let _overrideApplied = false;
  $: if (overrideAddress && !_overrideApplied) {
    _overrideApplied = true;
    useCustomAddress = true;
  }

  function shortenAddress(addr: string): string {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  }

  function switchToCustom() {
    useCustomAddress = true;
    address = "";
  }

  function switchToHost() {
    useCustomAddress = false;
    if (hostAccount) {
      address = hostAccount.address;
    }
  }
  /** True when the host account has signRaw capability — captcha not needed */
  $: canSignHost = !!hostAccount?.signRaw;

  let token: string = "";
  let formValid: boolean;
  $: formValid = !!address && (canSignHost || !!token) && network != null && !overCap;

  import type { AuthPayload, DripResult } from "../utils/faucetRequest";

  let webRequest: Promise<DripResult>;
  $: isLoading = !!webRequest;

  const txStages = [
    { label: "Broadcasting", desc: "Submitting transaction to the network" },
    { label: "In mempool", desc: "Waiting for block inclusion" },
    { label: "Included in block", desc: "Transaction confirmed on-chain" },
  ];
  let txStageIndex = 0;

  const statusToStage: Record<string, number> = {
    broadcasting: 0,
    broadcasted: 1,
    included: 2,
    finalized: 2,
  };

  let balance: { transferable: string; reserved: string; overCap: boolean } | null = null;
  $: overCap = balance?.overCap ?? false;
  let balanceLoading = false;
  let debounceTimer: ReturnType<typeof setTimeout>;

  function isValidAddress(addr: string): boolean {
    if (addr.startsWith("0x")) return addr.length === 42 && /^0x[0-9a-fA-F]{40}$/.test(addr);
    try {
      return getSs58AddressInfo(addr).isValid;
    } catch {
      return false;
    }
  }

  $: {
    clearTimeout(debounceTimer);
    balance = null;
    if (address && isValidAddress(address)) {
      balanceLoading = true;
      debounceTimer = setTimeout(async () => {
        balance = await fetchBalance(address, $testnet);
        balanceLoading = false;
      }, 500);
    } else {
      balanceLoading = false;
    }
  }

  async function buildAuth(): Promise<AuthPayload> {
    if (canSignHost && hostAccount?.signRaw) {
      const message = `faucet:${address}:${Date.now()}`;
      const signature = await hostAccount.signRaw(message);
      return { signature, message };
    }
    return { recaptcha: token };
  }

  function onSubmit() {
    txStageIndex = 0;
    webRequest = submitRequest(address);
    webRequest
      .then(({ hash, blockHash }) => {
        operation.set({ success: true, hash, blockHash });
      })
      .catch((error) => {
        operation.set({ success: false, error, hash: "" });
      });
  }

  function onToken(tokenEvent: CustomEvent<string>) {
    token = tokenEvent.detail;
  }

  async function submitRequest(address: string): Promise<DripResult> {
    const auth = await buildAuth();
    return faucetRequest(address, auth, $testnet, network, (status) => {
      const stage = statusToStage[status];
      if (stage !== undefined) {
        txStageIndex = stage;
      }
    });
  }
</script>

{#if !isLoading}
  <form on:submit|preventDefault={onSubmit} class="w-full">
    {#if !$embed}
      <div class="grid md:grid-cols-2 md:gap-x-4">
        <NetworkDropdown currentNetwork={networkData} />
        {#if networkData.teleportEnabled}
          <NetworkInput bind:network />
        {/if}
      </div>
    {/if}

    <div class="field-group">
      <span class="form-label">{$testnet.networkName} Address</span>
      {#if hostAccount && !useCustomAddress}
        <div class="host-account">
          <div class="host-account-info">
            <span class="host-account-name">{hostAccount.name ?? "Connected account"}</span>
            <span class="host-account-addr">{shortenAddress(hostAccount.address)}</span>
          </div>
          <button type="button" class="host-account-switch" on:click={switchToCustom}> Other address </button>
        </div>
      {:else}
        <input
          type="text"
          bind:value={address}
          placeholder="5rt6... or 0x318..."
          class="form-field"
          id="address"
          disabled={!!webRequest}
          data-testid="address"
          autocomplete="off"
          data-1p-ignore
        />
        {#if hostAccount}
          <button type="button" class="host-back-link" on:click={switchToHost}>
            &#8592; Use {hostAccount.name ?? "connected account"}
          </button>
        {/if}
      {/if}
      {#if balanceLoading}
        <div class="balance-info">Loading balance...</div>
      {:else if balance}
        <div class="balance-info">
          <span>Transferable: <strong>{balance.transferable} {$testnet.currency}</strong></span>
          <span class="balance-separator">|</span>
          <span>Reserved: <strong>{balance.reserved} {$testnet.currency}</strong></span>
        </div>
        {#if overCap}
          <div class="cap-warning">This account exceeds the balance cap. Request will be rejected.</div>
        {/if}
      {/if}
    </div>
    {#if !canSignHost}
      {#if isHost}
        <div class="pair-prompt">Pair your Polkadot App to proceed</div>
      {:else}
        <div class="grid place-items-center mt-2">
          <CaptchaV2 captchaKey={PUBLIC_CAPTCHA_KEY ?? ""} on:token={onToken} theme="dark" />
        </div>
      {/if}
    {/if}
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

    <div class="tx-stages">
      {#each txStages as stage, i}
        <div class="tx-stage" class:active={i === txStageIndex} class:done={i < txStageIndex}>
          <div class="stage-dot">{i < txStageIndex ? "\u2713" : ""}</div>
          <span class="stage-label">{stage.label}</span>
        </div>
        {#if i < txStages.length - 1}
          <div class="stage-line" class:done={i < txStageIndex} />
        {/if}
      {/each}
    </div>

    <p class="sending-subtext">{txStages[txStageIndex].desc}</p>
  </div>
{/if}

<style lang="postcss">
  .field-group {
    margin-bottom: 1rem;
  }

  .balance-info {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: #78716c;
  }

  .balance-info strong {
    color: #a8a29e;
    font-weight: 500;
  }

  .balance-separator {
    margin: 0 0.5rem;
    opacity: 0.4;
  }

  .cap-warning {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: #dc2626;
  }

  .pair-prompt {
    text-align: center;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.25);
    border-radius: 8px;
  }

  /* ── Host account ── */
  .host-account {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 2.75rem;
    padding: 0 0.875rem;
    background-color: #292524;
    border: 1px solid #44403c;
    border-radius: 8px;
  }

  .host-account-info {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    min-width: 0;
  }

  .host-account-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #fafaf9;
    white-space: nowrap;
  }

  .host-account-addr {
    font-size: 0.75rem;
    font-family: "JetBrains Mono", monospace;
    color: #78716c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .host-account-switch {
    font-size: 0.75rem;
    color: #ff2867;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: 0.75rem;
  }

  .host-account-switch:hover {
    color: #e6245d;
  }

  .host-back-link {
    display: inline;
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: #78716c;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .host-back-link:hover {
    color: #a8a29e;
  }

  /* ── Sending animation ── */
  .sending-animation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 0 2rem;
  }

  .sending-text {
    font-family: "DM Serif Display", Georgia, serif;
    font-size: 1.25rem;
    color: #fafaf9;
    margin: 0 0 0.75rem;
    letter-spacing: -0.01em;
  }

  .sending-subtext {
    font-size: 0.813rem;
    color: #78716c;
    margin: 0;
    animation: fade-pulse 2s ease-in-out infinite;
  }

  .tx-stages {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin: 1.75rem 0 2.75rem;
  }

  .tx-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    opacity: 0.3;
    transition: opacity 0.4s ease;
  }

  .tx-stage.active {
    opacity: 1;
  }

  .tx-stage.done {
    opacity: 0.6;
  }

  .stage-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid #c3c3c3;
    display: grid;
    place-items: center;
    font-size: 0.625rem;
    color: #44403c;
    flex-shrink: 0;
    transition: all 0.4s ease;
  }

  .tx-stage.active .stage-dot {
    border-color: #ff2867;
    background: #ff2867;
    box-shadow: 0 0 10px rgba(255, 40, 103, 0.3);
  }

  .tx-stage.done .stage-dot {
    border-color: #059669;
    color: #059669;
    background: transparent;
  }

  .stage-label {
    font-size: 0.688rem;
    color: #e8e8e8;
    white-space: nowrap;
  }

  .tx-stage.active .stage-label {
    color: #fafaf9;
  }

  .stage-line {
    width: 40px;
    height: 1px;
    background: #44403c;
    margin: 0 0.75rem;
    flex-shrink: 0;
    transition: background 0.4s ease;
    align-self: flex-start;
    margin-top: 10px;
  }

  .stage-line.done {
    background: #059669;
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
