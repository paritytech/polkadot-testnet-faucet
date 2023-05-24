<script lang="ts">
    import {PUBLIC_ELEMENT_CHANNEL} from "$env/static/public";
    </script>

<footer class="footer items-center p-4 text-white px-1 md:px-6">
    <div class="items-center grid-flow-col">
      <p>2023 All rights reserved · Parity Technologies</p>
    </div> 
    <div class="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
      <b class="questions">Questions?</b> <a class="text-white text-opacity-80" href={PUBLIC_ELEMENT_CHANNEL} target="_blank">Parity Element Channel</a>
    </div>
  </footer>

  <style lang="postcss">
    footer {
      font-family: 'Inter', sans-serif;
    }

    .questions {
        font-weight: 700;
        @apply font-bold;
    }
    </style>
