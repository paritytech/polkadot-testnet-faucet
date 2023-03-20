# Web Faucet

Web Client to access the faucet. Powered by Catpcha v3

## Why?

The objective of this project is to simplify the use of the Faucet through a standalone webpage and open ability to share it via social networks & google search.

Two current options are to [access Matrix and contact a bot](https://wiki.polkadot.network/docs/learn-DOT#getting-tokens-on-the-rococo-testnet) or [Ink! documentation](https://use.ink/faucet).

## Development

To develop you need two env variables:
- `VITE_CAPTCHA_KEY`: The [reCaptcha v3 site key](https://www.google.com/u/1/recaptcha/admin).
- `VITE_FAUCET_URL`: The endpoint to contact the faucet.

The reason for which these variables have `VITE` as a prefix is a security meassure to not upload any unnecesary data. [More info here](https://vitejs.dev/guide/env-and-mode.html#env-files)

If you wish to only interact with the flow but do not wish to contact the faucet, you can set the following env variable to true `VITE_DEMO`.
This will show that the application is running on Demo mode and will not contact the faucet but simulate the flow.

## Scripts

- `yarn run dev`: To deploy a development instance of the project
- `yarn run build`: To build the project in the `dist` directory
- `yarn run check`: To lint the project of unnecessary code

## Deployment

[![GitHub Pages deploy](https://github.com/paritytech/substrate-matrix-faucet/actions/workflows/deploy-site.yml/badge.svg?event=push)](https://github.com/paritytech/substrate-matrix-faucet/actions/workflows/deploy-site.yml)

We have a GitHub action that evaulates and builds the website, deploying it to GitHub Pages.

## Setting a default parachain

If you want to have a parachain id set by default, you can add the get property with the `parachain` query:
`https://paritytech.github.io/substrate-matrix-faucet/?parachain=1234`

## Building the docker image

There is a `Dockerfile` available in this directory. To build a docker image, run the following command:
```bash
docker build --build-arg CAPTCHA_KEY="your-captcha-site-key" --build-arg FAUCET_URL="https://your-faucet.com/drip" -t web-faucet .
```
