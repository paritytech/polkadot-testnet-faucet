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

## Setting a default parachain

If you want to have a parachain id set by default, you can add the get property with the `parachain` query:
`https://paritytech.github.io/polkadot-testnet-faucet/?parachain=1234`
