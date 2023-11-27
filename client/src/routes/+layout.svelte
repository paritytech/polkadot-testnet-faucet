<script>
  import Footer from "$lib/components/Footer.svelte";
  import NavBar from "$lib/components/NavBar.svelte";
  import "../app.css";
</script>

<div class="w-full">
  <NavBar />
  <slot />
  <Footer />
</div>
