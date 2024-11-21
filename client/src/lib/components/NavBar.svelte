<script lang="ts">
	import { base } from "$app/paths";
  import FrequencyLogo  from "$lib/components/icons/FrequencyLogo.svelte"
</script>

<div class="flex mt-f12 px-f16 md:px-f32 lg:px-f120 justify-between">
	<div class="w-f160 md:w-[200px]">
    <a href={`${base}/`}>
      <FrequencyLogo width="100%"/>
    </a>
	</div>
	<div class="my-auto min-w-f120 md:w-f192">
		<a href="#faq">
			<button class="freq-btn btn-primary p-f8 font-sans md:p-inherit"> &#8594; Questions? </button>
		</a>
	</div>
</div>
