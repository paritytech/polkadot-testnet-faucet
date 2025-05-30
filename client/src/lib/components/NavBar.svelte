<script lang="ts">
	import { base } from "$app/paths";
	import { Button, Assets } from '@frequency-chain/style-guide';
</script>

<div class="flex mt-f12 px-f16 md:px-f32 lg:px-f120 justify-between w-full">
    <a href={`${base}/`}>
      <Assets.FrequencyLogo class="lg:w-f224 w-f160" />
    </a>
	<Button href="#faq" size="sm">&#8594; Questions?</Button>
</div>
