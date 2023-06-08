<script>
	import Footer from "$lib/components/Footer.svelte";
	import NavBar from "$lib/components/NavBar.svelte";
	import "../app.css";
	import { page } from "$app/stores";
</script>

<div class="w-full">
	<NavBar currentUrl={$page.url.pathname} />
	<slot />
	<Footer />
</div>
