<script lang="ts">
  import polkadot from "../assets/polkadot.png";
</script>

<div class="card md:w-2/4 w-5/6 bg-base-100 shadow-xl">
  <figure class="px-10 pt-10">
    <img src={polkadot} alt="Polkadot" class="rounded-xl"/>
  </figure>
  <div class="card-body items-center text-center">

    <slot/>

  </div>
</div>
