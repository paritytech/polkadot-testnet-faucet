<script lang="ts">
	import type { ChainData } from "$lib/utils/networkData";
	import { createEventDispatcher } from "svelte";

	///** modal id */
	export let id: string;
	export let selectedNetwork: number;
	export let networks: ChainData[];

	const mapChains: Map<number, string> = new Map(networks.map((ch) => [ch.id, ch.name]));
	const dispatch = createEventDispatcher<{ selectNetwork: number }>();
	let button: HTMLElement;
	let customChain: number | string;
	$: customChain = selectedNetwork > 0 ? selectedNetwork : "";

	export function toggle() {
		button.click();
	}

	function onSelect(network?: number) {
		dispatch("selectNetwork", network);
		toggle();
	}

	function selectCustomChain() {
		console.log(customChain);
		onSelect(+customChain);
	}
</script>

<input bind:this={button} type="checkbox" {id} class="modal-toggle" />
<label for={id} class="modal cursor-pointer">
	<label class="modal-box relative" for="">
		<div class="justify-between flex">
			<h3 class="text-lg font-bold">Select a network</h3>
			<label for={id} class="text-xl hover:cursor-pointer"> &#10005; </label>
		</div>
		<div class="divider mb-0" />
		<div class="overflow-y-auto max-h-96">
			<ul class="menu bg-base-100">
				{#each networks.map((n) => n.id) as network}
					<li>
						<button
							class:active={network === selectedNetwork}
							type="button"
							on:click={() => onSelect(network)}
						>
							<div class="flex gap-3">
								<div class="text-left">
									<h2 class="font-bold">{mapChains.get(network)}</h2>
									{#if network > 0}
										<h5 class="text-xs">{network}</h5>
									{/if}
								</div>
							</div>
						</button>
					</li>
				{/each}
				<div class="divider" />
				<div class="inputs-container md:grid md:grid-cols-3 md:gap-4 ">
					<div class="form-control w-full max-w-xs col-span-2">
						<input
							bind:value={customChain}
							type="number"
							placeholder={true ? "Parachain id" : "Using Relay chain"}
							min="1000"
							max="9999"
							pattern="\d*"
							class="input input-bordered input-primary w-full max-w-xs"
							data-testid="parachain"
						/>
					</div>
					<button
						type="button"
						class="btn btn-primary"
						disabled={!customChain || customChain < 1000}
						on:click={selectCustomChain}
					>
						Custom chain
					</button>
				</div>
			</ul>
		</div>
	</label>
</label>
