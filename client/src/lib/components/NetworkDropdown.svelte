<script lang="ts">
  import { Networks, type NetworkData } from "$lib/utils/networkData";

  import Chevron from "./icons/Chevron.svelte";

  export let currentNetwork: NetworkData;
</script>

<div class="dropdown w-full mb-14">
  <label class="label" for="address">
    <span class="form-label">Network</span>
  </label>
  <div tabindex="-1" class="chain-dropdown w-full" data-testid="network-select">
    <div class="w-full flex justify-between bg-transparent">
      <div>
        {currentNetwork.networkName}
      </div>
      <Chevron />
    </div>
  </div>
  <ul tabindex="-1" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full text-white">
    {#each Networks as { network, url }}
      <li class:selected={network.networkName === currentNetwork.networkName}>
        <a data-testid={`network-${network.networkName}`} href={url}>{network.networkName} </a>
      </li>
    {/each}
  </ul>
</div>

<style lang="postcss">
  .chain-dropdown {
    @apply input w-full text-sm text-white flex flex-col justify-center items-center cursor-pointer;
    background-color: #191924;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .form-label {
    @apply label-text text-white;
    font-weight: 500;
    font-size: 16px;
  }

  .selected {
    @apply bg-primary;
  }
</style>
