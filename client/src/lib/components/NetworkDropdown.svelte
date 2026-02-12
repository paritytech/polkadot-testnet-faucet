<script lang="ts">
  import { type NetworkData, Networks } from "$lib/utils/networkData";

  import Chevron from "./icons/Chevron.svelte";

  export let currentNetwork: NetworkData;
</script>

<div class="field-group">
  <span class="form-label">Network</span>
  <div class="dropdown w-full">
    <div tabindex="-1" class="form-field cursor-pointer" data-testid="network-select">
      <div class="w-full flex justify-between items-center">
        <span>{currentNetwork.dropdownTitle}</span>
        <Chevron />
      </div>
    </div>
    <ul tabindex="-1" class="dropdown-content z-10 menu w-full">
      {#each Networks as { network, url }}
        <li class:selected={network.networkName === currentNetwork.networkName}>
          <a data-testid={`network-${network.networkName}`} href={url}>{network.dropdownTitle}</a>
        </li>
      {/each}
      <li>
        <a href="https://faucet.testnet.frequency.xyz">Frequency</a>
      </li>
    </ul>
  </div>
</div>

<style lang="postcss">
  .field-group {
    margin-bottom: 1rem;
  }
</style>
