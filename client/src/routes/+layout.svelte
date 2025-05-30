<script lang="ts">
  import NavBar from "$lib/components/NavBar.svelte";
  import { Footer } from '@frequency-chain/style-guide';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="w-full flex flex-col items-center">
  <NavBar />
  {@render children?.()}
  <div class="px-[10px] sm:px-[30px] md:px-[40px] lg:px-[80px] bg-navy w-full pt-f48">
    <Footer intent="light" class="vertical-lg:w-[100%] w-full" />
  </div>
</div>
