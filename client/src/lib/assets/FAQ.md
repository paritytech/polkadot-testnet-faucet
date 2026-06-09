## What is this?

This is a polkadot-testnet faucet. You can use this to load testnet tokens into your account.

## What is a faucet?

A faucet is a developer tool to get a small amount of testnet tokens (<NETWORK-TOKEN>) in order to test and troubleshoot a decentralized application or protocol before going live on Polkadot, where one must use real DOT.

Most faucets require social authentication (e.g. Twitter post or login confirming you are a real human) or place you in a queue to wait for a testnet token through the faucet. The Polkadot faucet is free, fast, and does not require authentication.

## How do I use this?

To request funds, simply enter your <NETWORK-NAME> wallet address, fill the captcha, and hit "Submit".

## How much <NETWORK-TOKEN> will I receive?

You will receive <DRIP-AMOUNT> <NETWORK-TOKEN> per request.

## How often can I request tokens?

You can request tokens every 24h! If you request <NETWORK-TOKEN> for one account, you can't request more for another parachain in that period.

## Can I request tokens for a specific parachain?

Yes, you can! To do so, click on "Use custom chain id" and then add the ID of your parachain. You can also load the site with the parachain selected by adding the GET parameter to the site "?parachain=1001".

If you want to learn more about Parachains, check out [the docs](https://docs.polkadot.com/polkadot-protocol/parachain-basics/)!

## Can I create a custom link with the network, address, and chain pre-filled?

Yes! You can build a URL that selects the network, pre-fills the recipient address, and targets a specific chain — handy for sharing or bookmarking.

**Pick the network with the path:**

- `/` — Polkadot testnet (Paseo)
- `/westend` — Westend
- `/summit` — Summit

**Then add any of these query parameters:**

- `address` — pre-fill the recipient address, e.g. `?address=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- `parachain` — send to a specific chain by its ID. Use `0` for the relay chain, `1000` for the Asset Hub (where smart contracts live), or a parachain ID such as `1002` (BridgeHub) or `1004` (People). Not sure of the ID? Pick the chain in the "Chain" dropdown and its ID is shown right under it (next to "Use custom chain id") — use that value here.
- `network` — on the root path (`/`) only, add `?network=westend` to switch to Westend.
- `embed` — add `?embed=true` to render the faucet in a minimal layout meant for embedding in an `<iframe>`.

Combine parameters with `&`. For example, to pre-fill an address and target BridgeHub on Westend:

`/westend?address=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY&parachain=1002`

## What is a testnet token?

Testnet tokens are a test currency that allows you to test your Polkadot application before going live. Testnet tokens can be used in place of real tokens on testnets like <NETWORK-NAME>.
You can read more [here](https://polkadot.network/blog/rococo-v1-a-holiday-gift-to-the-polkadot-community/).

## Can I get real DOTs?

No, we will provide you with TEST DOTs, so you can do your testing and move it to any parachain whenever you are ready

## It worked! How can I say thank you?

You can star the repository in [GitHub](https://github.com/paritytech/substrate-matrix-faucet).

## What if I run into any other issues, or have questions?

You can [report an issue](https://github.com/paritytech/substrate-matrix-faucet/issues) in our repository or [ask in the forum](https://forum.polkadot.network/t/experiencing-trouble-accessing-our-rococo-faucet-please-post-here/2952)!
