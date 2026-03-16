<script>
  import "../app.css";
  import Footer from "$lib/components/Footer.svelte";
  import NavBar from "$lib/components/NavBar.svelte";
  import { embed, ready } from "$lib/utils/stores";
</script>

<div class="w-full">
  {#if $ready && !$embed}<NavBar />{/if}
  <slot />
  {#if $ready && !$embed}<Footer />{/if}
</div>
