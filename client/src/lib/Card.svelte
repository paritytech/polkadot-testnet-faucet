<script lang="ts">
  import polkadot from "../assets/polkadot.png";
  import {DEMO_MODE} from "./utils";
</script>

<div class="card md:w-2/4 w-5/6 bg-base-100 shadow-xl">
  <figure class="px-10 pt-10 transition duration-500 hover:scale-105">
    <img src={polkadot} alt="Polkadot" class="rounded-xl"/>
  </figure>
  <div class="card-body items-center text-center">

    <slot/>

  </div>
</div>

{#if DEMO_MODE}
  <div class="toast toast-start">
    <div class="alert alert-warning" transition:fly="{{ y: 200, duration: 2000 }}">
      <div>
        <span>Demo mode enabled. Faucet will <b>not</b> be contacted</span>
      </div>
    </div>
  </div>
{/if}
