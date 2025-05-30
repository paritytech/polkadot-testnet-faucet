# Web Faucet

Web Client to access the Frequency Paseo Testnet faucet. Powered by SvelteKit and hCaptcha.

## Development

Set up the following variables:

- `PUBLIC_CAPTCHA_KEY`: The hCaptcha v2 site key. Test values on the [hCaptcha Development documentation](https://docs.hcaptcha.com/#integration-testing-test-keys)
- `PUBLIC_FAUCET_URL`: The endpoint to contact the faucet server. Keep unset to run client-side code with production backend. Set to `http://localhost:5555/drip/web` to use a local instance of the faucet server.
- `PUBLIC_DEMO_MODE`: for testing only the front end. It will not try to contact any faucet server. Leave blank if you want to test end-to-end.

The other environment variables don't need to change, typically.

The reason for which these variables have `PUBLIC_` as a prefix is a security measure to not upload any unnecessary data. [More info here](https://kit.svelte.dev/docs/modules#$env-static-public)

### Quick start / testing

from `src/client`:

```shell
yarn install
cp env.sample .env
```

Edit the .env file as desired and launch the client in watch mode:

```shell
yarn dev
```

## Other Scripts

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
