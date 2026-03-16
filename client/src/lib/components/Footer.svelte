<script lang="ts">
  import { PUBLIC_FORUM } from "$env/static/public";
</script>

<footer data-testid="footer">
  <div class="footer-inner">
    <p class="copyright">2026 All rights reserved &middot; Parity Technologies</p>
    <div class="links">
      <b class="questions">Questions?</b>
      <a class="forum-link" href={PUBLIC_FORUM} target="_blank">Polkadot Forum</a>
    </div>
  </div>
</footer>

<style lang="postcss">
  footer {
    border-top: 1px solid #292524;
    padding: 1.5rem 1rem;
  }

  @media (min-width: 768px) {
    footer {
      padding: 1.5rem 2rem;
    }
  }

  .footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .copyright {
    font-size: 0.75rem;
    color: #78716c;
    margin: 0;
  }

  .links {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .questions {
    font-size: 0.75rem;
    font-weight: 600;
    color: #a8a29e;
  }

  .forum-link {
    font-size: 0.75rem;
    font-weight: 500;
    color: #a8a29e;
  }

  .forum-link:hover {
    color: #fafaf9;
  }
</style>
