<script lang="ts">
  import { base } from "$app/paths";
  import logo from "$lib/assets/logo.svg";
</script>

<div class="navigation-bar">
  <div class="flex-1">
    <div class="w-36">
      <a href={`${base}/`}><img src={logo} alt="polkadot logo" /></a>
    </div>
  </div>
  <div class="flex-none">
    <a class="questions-btn" href="#faq"> &#8594; Questions? </a>
  </div>
</div>

<style lang="postcss">
  .questions-btn {
    display: none;
    align-items: center;
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #d6d3d1;
    background-color: transparent;
    border: 1px solid #44403c;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .questions-btn:hover {
    color: #fafaf9;
    border-color: #57534e;
    background-color: #292524;
  }

  @media (min-width: 768px) {
    .questions-btn {
      display: inline-flex;
    }
  }

  .navigation-bar {
    @apply navbar px-4 md:px-8;
    position: sticky;
    top: 0;
    z-index: 40;
    height: 4rem;
    background-color: rgba(15, 15, 15, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid #292524;
  }
</style>
