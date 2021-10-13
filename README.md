# Matrix faucet

> A generic faucet for Substrate based chains. The faucet is triggered via
text commands sent on Matrix.

## Usage

To trigger the bot, assuming it's installed in the Matrix room, run the command

```sh
!drip [ SS58 Address ]
```

## Local development

Install Node dependencies

```sh
$ yarn install
```

We use linting pre-commit hooks, so set them up if you'd like

```sh
$ yarn simple-git-hooks
```

To launch a hot-reloading dev environment

```sh
$ yarn dev
```

### Environment variables

We rely on a `.env` file existing for the server and bot to load environment
variables from. Copy the template `.env.example` over like so

```sh
cp .env.example .env
```

### Matrix account

The faucet bot relies on Matrix for sending tips. We will need to configure a
Matrix bot account for testing

0. Create an account for your MATRIX_BOT_USER_ID at https://matrix.org/, login and retrieve MATRIX_ACCESS_TOKEN in `Settigns -> Help and about -> click to reveal`

## Helm deployment

1. Create a _chainName-values.yaml_ file and define all non default variables. Secret variables (MATRIX_ACCESS_TOKEN & FAUCET_ACCOUNT_MNEMONIC) you need to supply externally
   via CI / command line / ...

2. Create a new CI-Job / Environment in _.gitlab-ci.yml_ file and add Secrets (in clear / non-base64 encoded format) to `gitlab -> CI/CD Settings -> Secret Variables`).

3. Run CI/CD or use `helm` to deploy.

### Example Helm usage:

```
helm template westend . \
 --values ./westend-values.yaml \
 --set server.secret.FAUCET_ACCOUNT_MNEMONIC='ich und du muellers esel das bist du' \
 --set server.image.dockerTag=latest \
 --set bot.secret.MATRIX_ACCESS_TOKEN='asdf-not-a-secret-asfd'

helm -n faucetbots ls --all

helm -n faucetbots rollback canvas 2
```

### Misc:

- Bump API: `yarn upgrade @polkadot/util@latest @polkadot/wasm-crypto@latest @polkadot/keyring@latest @polkadot/x-randomvalues@latest @polkadot/api@latest @polkadot/keyring@latest @polkadot/util-crypto@latest`
- Server can be queried for Prometheus metrics via http://$BACKEND_URL/metrics
- Healthcheck URL via http://$BACKEND_URL/health
