<script lang="ts">
  import { Footer } from "@frequency-chain/style-guide";
  import NavBar from "$lib/components/NavBar.svelte";

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="w-full flex flex-col items-center">
  <NavBar />
  {@render children?.()}
  <Footer intent="light" class="mx-f32 w-full" />
</div>
