<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import Form from './lib/Form.svelte'
</script>

<main>
  <h1>Substrate Faucet</h1>

  <div class="flex items-center justify-center my-16">
    <Form />
  </div>

  <p class="read-the-docs">
    Check out <a href="https://use.ink/" target="_blank" rel="noreferrer">Ink!</a>, the official Polkadot documentation!
  </p>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
