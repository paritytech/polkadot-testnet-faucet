<script lang="ts">
	import { Button, Input } from '@frequency-chain/style-guide';
	import { operation, testnet } from "$lib/utils/stores";
	import { request as faucetRequest } from "../utils";
	import CaptchaV2 from "./CaptchaV2.svelte";
	import { validateAddress } from "@polkadot/util-crypto";

	let address: string = $state("");
	let network: number = -1;
	let token: string = $state("");
	let formValid: boolean = $derived(!!address && !!token && !!network);
	

	let webRequest: Promise<string> | null = $state(null);

	function onSubmit() {
	  webRequest = request(address);
	  webRequest
	    .then((hash) => {
	      operation.set({ success: true, hash });
	    })
	    .catch((error) => {
	      if (error.toString().match("TypeError: Failed to fetch")) {
	        operation.set({ success: false, error: "Could not connect to faucet server.", hash: "" });
	      } else {
	        operation.set({ success: false, error, hash: "" });
	      }
	    });
	}

	function addressValid() {
	  try {
	    return validateAddress(address);
	  } catch (error) {
	    console.error(error);
	    operation.set({ success: false, error: "Address is invalid", hash: "" });
	  }
	}

	function onToken(tokenEvent: CustomEvent<string>) {
	  token = tokenEvent.detail;
	}

	async function request(address: string): Promise<string> {
	  return faucetRequest(address, token, $testnet, network);
	}
</script>

<form onsubmit={onSubmit} class="flex flex-col items-center gap-f16 w-full">
		<Input
			label={`${$testnet.networkName} Address`}
			bind:value={address}
			placeholder="5rt6..."
			id="address"
			disabled={!!webRequest}
			data-testid="address"
			isRequired={true}
			onfocusout={() => addressValid()}
			error={undefined}
			class="w-full min-w-[400px] text-black"
		/>
	{#if !webRequest}
		<div class="grid place-items-center">
			<CaptchaV2 on:token={onToken} />
		</div>
		<Button intent="filled-light" type="submit" data-testid="submit-button" disabled={!formValid}>
			Get some {$testnet.currency}s
		</Button>
	{:else}
		<Button disabled intent="filled-light"><div class="loading"></div></Button>
	{/if}
</form>
