<script lang="ts">
	import type { ChainData } from "$lib/utils/networkData";
	import { createEventDispatcher } from "svelte";

	///** modal id */
	export let id: string;
	export let selectedNetwork: number;
	export let networks: ChainData[];

	const mapChains: Map<number, string> = new Map(networks.map((ch) => [ch.id, ch.name]));
	mapChains.set(-1, "Relay chain");
	const dispatch = createEventDispatcher<{ selectNetwork: number }>();
	let button: HTMLElement;

	export function toggle() {
		button.click();
	}

	function onSelect(network?: number) {
		dispatch("selectNetwork", network);
		toggle();
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
			</ul>
		</div>
	</label>
</label>
