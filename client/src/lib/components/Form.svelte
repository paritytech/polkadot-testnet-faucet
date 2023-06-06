<script lang="ts">
	import { PUBLIC_CAPTCHA_KEY } from "$env/static/public";
	import { operation, testnet } from "$lib/utils/stores";
	import { fly } from "svelte/transition";
	import { request as faucetRequest } from "../utils";
	import CaptchaV2 from "./CaptchaV2.svelte";
	import NetworkInput from "./NetworkInput.svelte";
	import Cross from "./icons/Cross.svelte";
	import Tick from "./icons/Tick.svelte";

	let address: string = "";
	export let network: number = -1;
	let token: string = "";
	let formValid: boolean;
	$: formValid = !!address && !!token && !!network;

	let webRequest: Promise<string>;

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

<form on:submit|preventDefault={onSubmit} class="w-full">
	<NetworkInput bind:network />

	<div class="inputs-container">
		<label class="label" for="address">
			<span class="form-label">{$testnet.networkName} Address</span>
		</label>
		<input
			type="text"
			bind:value={address}
			placeholder="5rt6..."
			class="input w-full text-sm form-background text-white"
			id="address"
			disabled={!!webRequest}
			data-testid="address"
		/>
	</div>
	{#if !webRequest}
		<div class="grid place-items-center">
			<CaptchaV2 captchaKey={PUBLIC_CAPTCHA_KEY ?? ""} on:token={onToken} theme="dark" />
		</div>
		<button class="submit-btn" type="submit" data-testid="submit-button" disabled={!formValid}>
			Get some {$testnet.currency}
		</button>
	{:else}
		{#await webRequest}
			<button class="btn btn-primary loading" disabled> Loading</button>
		{:then result}
			<div in:fly={{ y: 30, duration: 500 }} class="alert alert-success shadow-lg">
				<div>
					<Tick />
					<span class="text-left">
						Your funds have been sent.<br />
						<a
							href={`${$testnet.explorer}/extrinsic/${result}`}
							target="_blank"
							rel="noreferrer"
							class="link link-neutral"
						>
							Click here to see the transaction
						</a>
					</span>
				</div>
			</div>
		{:catch error}
			<div class="alert alert-error shadow-lg" data-testid="error">
				<div>
					<Cross />
					<span class="text-left">{error}</span>
				</div>
			</div>
		{/await}
	{/if}
</form>

<style lang="postcss">
	.inputs-container {
		margin-bottom: 1.5rem;
	}

	form {
		font-family: "Inter", sans-serif;
	}

	.form-background {
		background-color: #191924;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.form-label {
		@apply label-text text-white;
		font-weight: 500;
		font-size: 16px;
	}
</style>
