<script lang="ts">
  import { IconButton, } from "@frequency-chain/style-guide";
  import XLogo from "$lib/components/icons/XLogo.svelte";
  import DiscordLogo from "$lib/components/icons/DiscordLogo.svelte"
  import FrequencyLogo from "$lib/components/icons/FrequencyLogo.svelte"

  export let privacyHref: string = 'https://www.frequency.xyz/privacy';
  export let type: 'light' | 'dark' = 'light';

  let fgColorText = {
    dark: 'text-white',
    light: 'text-black',
  }[type];
  let fgColorBg = {
    dark: 'bg-white',
    light: 'bg-black',
  }[type];
</script>

<div class="px-[10px] sm:px-[30px] md:px-[40px] lg:px-[80px] ">
  <footer
    class="sm md:md mx-auto my-0 flex max-w-screen-xl flex-col items-center gap-f16 border-t-[2px] border-current py-f48 md:gap-f48 {fgColorText}"
  >
    <div class="px-f24">
      <FrequencyLogo fill="#000000"/>
    </div>
    <aside class="flex flex-col items-center space-y-4 text-center leading-none md:flex-row md:space-x-4 md:space-y-0">
      <div>
        © {new Date().getFullYear()} Frequency Network Foundation <span class="md:hidden">All Rights Reserved</span>
      </div>
      <div class="hidden w-[2px] self-stretch md:block {fgColorBg}"></div>
      <div class="hidden md:block">All Rights Reserved</div>
      <div class="hidden w-[2px] self-stretch md:block {fgColorBg}"></div>
      <div>
        <a href={privacyHref} class="underline transition duration-[0.3s] hover:text-teal">Privacy Policy</a>
      </div>
    </aside>
    <div class="flex gap-f16" aria-label="Social Links">
      <IconButton {type} label="X/Twitter" href={'https://x.com/frequency_xyz'}>
        <XLogo />
      </IconButton>
      <IconButton {type} label="Discord" href="https://discord.com/invite/JchmHX5afV">
        <DiscordLogo />
      </IconButton>
    </div>
  </footer>
</div>
