/**
 * Product manifest for bulletin-deploy (RFC 0001).
 *
 * Picked up by the CLI when it walks up from the build dir. Only written
 * on production deploys — the PR-preview job in
 * .github/workflows/deploy-dotns.yml removes this file before invoking
 * the CLI so previews stay legacy-contenthash only.
 */
export default {
  domain: "faucet.dot",
  displayName: "Polkadot Testnet Faucet",
  description:
    "Get testnet tokens (WND, PAS, SUM) for Westend, Paseo, and Summit networks. Teleports to relay, system, and Asset Hub chains.",
  icon: { path: "./client/static/icon.png", format: "png" as const },
  executables: [
    {
      kind: "app" as const,
      path: "./client/build",
      appVersion: [0, 0, 1] as const,
    },
  ],
};
