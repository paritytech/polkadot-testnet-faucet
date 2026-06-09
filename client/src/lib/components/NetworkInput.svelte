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
        <li class="custom-option" data-testid="custom-network-button">
          <a on:click={switchCustomValue}>Custom chain ID…</a>
        </li>
      </ul>
    </div>
    {#if network >= 0}
      <div class="chain-id-hint" data-testid="chain-id-hint">Chain ID: {network}</div>
    {/if}
  {:else}
    <div class="custom-chain-switch" on:click={switchCustomValue} data-testid="preset-chains-button">
      &#8592; Use a preset chain
    </div>
  {/if}
</div>

<style lang="postcss">
  .field-group {
    margin-bottom: 1rem;
  }

  .custom-chain-switch {
    @apply text-left hover:underline hover:cursor-pointer;
    color: #ff2867;
    font-weight: 400;
    font-size: 0.813rem;
    margin-top: 0.375rem;
  }

  .chain-id-hint {
    @apply text-left;
    margin-top: 0.375rem;
    font-size: 0.813rem;
    color: #78716c;
  }

  .custom-option {
    border-top: 1px solid #44403c;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
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
