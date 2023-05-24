<script lang="ts">
	import { Rococo } from "../utils/networkData";
	import Chevron from "./icons/Chevron.svelte";

	export let network: number = -1;
	let disabled: boolean = false;
	let input: HTMLInputElement;

	let customValue: boolean = false;
	let customBtnMessage = "Use preselected chains";
	$: customBtnMessage = customValue ? "Use custom chain id" : "Use preselected chains";
	$: customValue = !Rococo.getChainName(network);

	function switchCustomValue() {
		if (!customValue) {
			input.value = "";
		}
		customValue = !customValue;
	}
</script>

<div class="inputs-container">
	<label class="label" for="address">
		<span class="form-label">Network {network}</span>
	</label>
	<input
		type="number"
		bind:value={network}
		bind:this={input}
		placeholder="Add custom chain id"
		class="input w-full text-sm form-background text-white inter"
		id="network"
		{disabled}
		data-testid="network"
		max="9999"
		pattern="\d*"
		class:hidden={!customValue}
	/>
	{#if !customValue}
		<div class="dropdown w-full">
			<div tabindex="0" class="chain-dropdown">
				<div class="w-full flex justify-between">
					<div>
						{Rococo.getChainName(network)}
					</div>
					<Chevron />
				</div>
			</div>
			<ul
				tabindex="0"
				class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full text-white"
			>
				{#each Rococo.chains as chain}
					<li class:selected={network === chain.id}>
						<a on:click={() => (network = chain.id)}>{chain.name}</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	<div class="custom-chain-switch" on:click={switchCustomValue}>
		&#8594; {customBtnMessage}
	</div>
</div>

<style lang="postcss">
	.inputs-container {
		margin-bottom: 1.5rem;
	}

	.inter {
		font-family: "Inter", sans-serif;
	}

	.form-background {
		background-color: #191924;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.form-label {
		@apply label-text text-white;
		font-weight: 500;
	}

	.selected {
		@apply bg-primary;
	}

	.custom-chain-switch {
		@apply text-left hover:underline hover:cursor-pointer;
		color: #c4affa;
		font-family: "Inter", sans-serif;
		font-weight: 400;
	}

	.chain-dropdown {
		@apply input w-full text-sm form-background text-white inter flex flex-col justify-center items-center cursor-pointer;
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
