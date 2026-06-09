<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { testnet } from "$lib/utils/stores";

  import { getChainName } from "../utils/networkData";
  import Chevron from "./icons/Chevron.svelte";

  export let network: number = -1;
  let disabled: boolean = false;
  let input: HTMLInputElement;

  let customValue: boolean = false;
  let customBtnMessage = "Use preselected chains";

  $: customBtnMessage = !customValue ? "Use custom chain id" : "Use preselected chains";
  $: customValue = !getChainName($testnet, network);

  function switchCustomValue() {
    if (!customValue) {
      input.value = "";
    } else {
      network = $testnet.chains[0]?.id ?? -1;
      input.value = network.toString();
    }
    customValue = !customValue;
  }

  function selectChain(chain: number) {
    // calling blur closes the dropdown
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem?.blur();
    }
    network = chain;
    $page.url.searchParams.set("parachain", chain.toString());

    goto(`?${$page.url.searchParams.toString()}`);
  }
</script>

<div class="field-group">
  <span class="form-label">Chain</span>
  <input
    type="number"
    bind:value={network}
    bind:this={input}
    placeholder="Add custom chain id"
    class="form-field"
    id="network"
    {disabled}
    data-testid="network"
    max="9999"
    pattern="\d*"
    class:hidden={!customValue}
  />
  {#if !customValue}
    <div class="dropdown dropdown-top md:dropdown-bottom w-full">
      <div tabindex="0" class="form-field cursor-pointer" data-testid="dropdown">
        <div class="w-full flex justify-between items-center">
          <span>{getChainName($testnet, network)}</span>
          <Chevron />
        </div>
      </div>
      <ul tabindex="0" class="dropdown-content menu w-full">
        {#each $testnet.chains as chain, i}
          <li class:selected={network === chain.id} data-testid={`network-${i}`}>
            <a on:click={() => selectChain(chain.id)}>{chain.name}</a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  <div class="switch-row">
    <div class="custom-chain-switch" on:click={switchCustomValue} data-testid="custom-network-button">
      &#8594; {customBtnMessage}
    </div>
    {#if !customValue && network >= 0}
      <span class="chain-id-hint" data-testid="chain-id-hint">Chain ID: {network}</span>
    {/if}
  </div>
</div>

<style lang="postcss">
  .field-group {
    margin-bottom: 1rem;
  }

  .switch-row {
    @apply flex items-center justify-between;
    margin-top: 0.375rem;
  }

  .custom-chain-switch {
    @apply text-left hover:underline hover:cursor-pointer;
    color: #ff2867;
    font-weight: 400;
    font-size: 0.813rem;
  }

  .chain-id-hint {
    font-size: 0.813rem;
    color: #78716c;
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }
</style>
