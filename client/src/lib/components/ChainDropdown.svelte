<script lang="ts">
	import { testnet } from "$lib/utils/stores";
	import { Frequency, getChainName } from "../utils/networkData";
	import Chevron from "./icons/Chevron.svelte";

	export let network: number = -1;
	let disabled: boolean = false;
	let input: HTMLInputElement;

	let customValue: boolean = false;
	let customBtnMessage = "Use preselected chains";
	$: customBtnMessage = !customValue ? "Use custom chain id" : "Use preselected chains";
	$: customValue = !getChainName(Frequency, network);

	function switchCustomValue() {
		if (!customValue) {
			input.value = "";
		} else {
			network = -1;
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
	}
</script>

<div class="inputs-container">
	<label class="label" for="address">
		<span class="form-label">Chain</span>
	</label>
	<input
		type="number"
		bind:value={network}
		bind:this={input}
		placeholder="Add custom chain id"
		class="input w-full text-sm form-background text-black inter"
		id="network"
		{disabled}
		data-testid="network"
		max="9999"
		pattern="\d*"
		class:hidden={!customValue}
	/>
	{#if !customValue}
		<div class="dropdown dropdown-top md:dropdown-bottom w-full">
			<div tabindex="0" class="chain-dropdown" data-testid="dropdown">
				<div class="w-full flex justify-between">
					<div>
						{getChainName($testnet, network)}
					</div>
					<Chevron />
				</div>
			</div>
			<ul
				tabindex="0"
				class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full text-black"
			>
				{#each $testnet.chains as chain, i}
					<li class:selected={network === chain.id} data-testid={`network-${i}`}>
						<a on:click={() => selectChain(chain.id)}>{chain.name}</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	<!-- <div class="custom-chain-switch" on:click={switchCustomValue} data-testid="custom-network-button">
    &#8594; {customBtnMessage}
  </div> -->
</div>

<style lang="postcss">
	.inputs-container {
		margin-bottom: 1.5rem;
	}

	.form-background {
		border: 1px solid #c8cdd0;
	}

	.form-label {
		@apply label-text text-black;
		font-weight: 500;
		font-size: 16px;
	}

	.selected {
		@apply bg-primary;
	}

	.custom-chain-switch {
		@apply text-left hover:underline hover:cursor-pointer;
		color: #c4affa;
		font-weight: 400;
		font-size: 14px;
		margin-top: 8px;
	}

	.chain-dropdown {
		@apply input w-full text-sm form-background text-black flex flex-col justify-center items-center cursor-pointer;
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
