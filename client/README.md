# Web Faucet

Web Client to access the faucet. Powered by Catpcha v2

## Why?

The objective of this project is to simplify the use of the Faucet through a standalone webpage and open ability to share it via social networks & google search.

Two current options are to [access Matrix and contact a bot](https://wiki.polkadot.network/docs/learn-DOT#getting-tokens-on-the-rococo-testnet) or [ink! documentation](https://use.ink/faucet).

## Development

To develop you need two env variables:

- `PUBLIC_CAPTCHA_KEY`: The [reCaptcha v2 site key](https://www.google.com/u/0/recaptcha/admin).
- `PUBLIC_FAUCET_URL`: The endpoint to contact the faucet backend. Keep unset to run client-side code with production backend.

The reason for which these variables have `PUBLIC_` as a prefix is a security measure to not upload any unnecessary data. [More info here](https://kit.svelte.dev/docs/modules#$env-static-public)

If you wish to only interact with the flow but do not wish to contact the faucet, you can set the following env variable to true `PUBLIC_DEMO_MODE`.
This will show that the application is running on Demo mode and will not contact the faucet but simulate the flow.

## Scripts

- `yarn run dev`: To deploy a development instance of the project
- `yarn run build`: To build the project in the `build` directory
- `yarn run check`: To lint the project of unnecessary code

### Build static site

If you wish to build the site as a static site, when building add the environment variable `STATIC=true`. This will disable any kind of server side rendering
and will pre-render all the content. You won't be able to dynamically load environment variables if you do this.

## Deployment

[![GitHub Pages deploy](https://github.com/paritytech/polkadot-testnet-faucet/actions/workflows/deploy-site.yml/badge.svg?event=push)](https://github.com/paritytech/polkadot-testnet-faucet/actions/workflows/deploy-site.yml)

We have a GitHub action that evaluates and builds the website, deploying it to GitHub Pages.

## URL Parameters

| Param | Example | Effect |
|-------|---------|--------|
| `parachain` | `?parachain=1000` | Preselects a parachain by ID |
| `network` | `?network=westend` | Overrides the default Paseo network |
| `address` | `?address=5Grwva...` | Prefills the address input |
| `embed` | `?embed=true` | Hides NavBar, Footer, FAQ, structured data — shows only the faucet card |

Example:
```
https://faucet.polkadot.io?network=paseo&parachain=1000&address=5Grwva...
```

## Discovering Available Networks

Fetch `/networks.json` for a machine-readable list of supported networks and their parachains:

```bash
curl https://faucet.polkadot.io/networks.json
```

```json
[
  {
    "network": "paseo",
    "currency": "PAS",
    "dripAmount": "5000",
    "parachains": [
      { "name": "Hub (smart contracts)", "id": -1 },
      { "name": "Paseo Relay", "id": 0 },
      { "name": "BridgeHub", "id": 1002 },
      { "name": "People", "id": 1004 },
      { "name": "Coretime", "id": 1005 }
    ]
  },
  {
    "network": "westend",
    "currency": "WND",
    "dripAmount": "10",
    "parachains": [
      { "name": "Hub (smart contracts)", "id": -1 },
      { "name": "Westend Relay", "id": 0 },
      { "name": "Collectives", "id": 1001 },
      { "name": "BridgeHub", "id": 1002 },
      { "name": "People", "id": 1004 },
      { "name": "Coretime", "id": 1005 }
    ]
  }
]
```

Use `network` and parachain `id` values as URL parameters. The endpoint is pre-rendered at build time and stays in sync with the source of truth in `src/lib/utils/networkData.ts`.

## Embedding as an iframe

Other apps can embed the faucet in a modal or panel. When `?embed=true` is set, the faucet sends `postMessage` events to the parent window:

### Messages

| Type | When | Payload |
|------|------|---------|
| `faucet:ready` | Faucet has mounted | — |
| `faucet:success` | Drip transaction confirmed | `{ hash, blockHash }` |
| `faucet:error` | Drip failed | `{ error }` |

### Example

```html
<iframe
  src="https://faucet.polkadot.io?embed=true&network=paseo&address=5Grwva..."
  style="width:480px; height:600px; border:none; border-radius:16px;"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
/>
```

```js
window.addEventListener("message", (event) => {
  if (event.data?.type === "faucet:success") {
    const { hash, blockHash } = event.data.payload;
    // close modal, refresh balance, etc.
  }
});
```

> **Note:** reCAPTCHA requires `allow-popups` in the sandbox attribute for its challenge window. The embedding domain must also be added to the reCAPTCHA allowed domains in the Google admin console.
