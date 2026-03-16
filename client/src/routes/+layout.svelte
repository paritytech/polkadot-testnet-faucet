<script>
  import "../app.css";
  import Footer from "$lib/components/Footer.svelte";
  import NavBar from "$lib/components/NavBar.svelte";
  import { embed } from "$lib/utils/stores";
</script>

<div class="w-full">
  {#if !$embed}<NavBar />{/if}
  <slot />
  {#if !$embed}<Footer />{/if}
</div>
