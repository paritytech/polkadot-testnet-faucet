<script lang="ts">
  import { PUBLIC_FORUM } from "$env/static/public";
</script>

<footer class="footer items-center p-4 text-white px-1 md:px-6">
  <div class="items-center grid-flow-col">
    <p>2024 All rights reserved</p>
  </div>
  <div class="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
    <b class="questions">Questions?</b>
    <a class="text-white text-opacity-80 cursor-pointer" href={PUBLIC_FORUM} target="_blank"> Avail Forum </a>
  </div>
</footer>

<style lang="postcss">
  footer {
    font-family: "Inter", sans-serif;
  }

  .questions {
    font-weight: 700;
    @apply font-bold;
  }
</style>
