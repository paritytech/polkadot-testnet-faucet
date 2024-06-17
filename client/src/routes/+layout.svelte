<script>
  import "../app.css";
  import Footer from "$lib/components/Footer.svelte";
  import NavBar from "$lib/components/NavBar.svelte";
</script>

<div class="w-full">
  <NavBar />
  <slot />
  <Footer />
</div>
