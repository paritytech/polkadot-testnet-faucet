<script lang="ts">
  import Tick from "./icons/Tick.svelte";
  import polkadot from "../assets/polkadot.png";
  import Cross from "./icons/Cross.svelte";

  let address: string = '';

  let webRequest: Promise<boolean> = null;

  function onSubmit() {
    console.log("YES!");
    webRequest = boilerplateRequest(address);
  }

  async function boilerplateRequest(address: string) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (address === "error") {
      throw new Error("This is a terrible error!");
    }
    return true;
  }
</script>

<div class="card md:w-2/4 w-5/6 bg-base-100 shadow-xl">
  <figure class="px-10 pt-10">
    <img src={polkadot} alt="Polkadot" class="rounded-xl"/>
  </figure>
  <div class="card-body items-center text-center">
    <form on:submit|preventDefault={onSubmit}>
      <input
        type="text"
        bind:value={address}
        placeholder="Enter your address"
        class="input w-full input-primary mb-6"
        disabled={!!webRequest}
      />
      {#if !webRequest}
        <button
          class="btn btn-primary"
          type="submit"
          disabled={!address}
        >
          Submit
        </button>
      {:else}
        {#await webRequest}
          <button class="btn btn-primary loading" disabled>
            Loading
          </button>
        {:then result}
          <div class="alert alert-success shadow-lg">
            <div>
              <Tick/>
              <span>
                Successfully transferred the tokens to your
                account!
              </span>
            </div>
          </div>
        {:catch error}
          <div class="alert alert-error shadow-lg">
            <div>
              <Cross/>
              <span>{error}</span>
            </div>
          </div>
        {/await}
      {/if}
    </form>
  </div>
</div>
