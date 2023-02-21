<script lang="ts">
  import Form from './lib/Form.svelte'
  import Card from "./lib/Card.svelte";
  import SocialTags from "./lib/SocialTags.svelte";
</script>

<main>
  <SocialTags/>
  <h1>Substrate Faucet</h1>

  <div class="flex items-center justify-center my-16">
    <Card>
      <Form/>
    </Card>
  </div>

  <p class="read-the-docs">
    Check out <a href="https://use.ink/" target="_blank" rel="noreferrer">Ink!</a>, the official Substrate
    documentation!
  </p>
</main>

<style>
  .read-the-docs {
    color: #888;
  }
</style>
