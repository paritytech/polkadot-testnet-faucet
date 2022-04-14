## Generic Faucet for Substrate based chains

## Development

Setup dependencies and git hooks

```bash
yarn install
yarn simple-git-hooks
```

To launch a hot-reloading dev environment

```bash
yarn dev:backend
yarn dev:bot
```

## Server and Bot environment variables

The only common variable between the bot and the server is the NETWORK_DECIMALS.
Also the server's `PORT` should be part of the bot's `BACKEND_URL`.

```bash
# BACKEND
FAUCET_ACCOUNT_MNEMONIC #required - mnemonic seed from faucet account (create via polkadot.js.org)
FAUCET_BALANCE_CAP # optional - Upper limit cap on whether or not the account can receive more tokens. Defaults to 100.
INJECTED_TYPES #optional - if any type must be overridden
NETWORK_DECIMALS #optional - decimal amount for the network
PORT #optional - the port you want the server to listen on
RPC_ENDPOINT #required - ws rpc node endpoint
FAUCET_IGNORE_LIST #required - A list of Matrix accounts that will be silently (but logged) ignored, comma separated. Example: "@alice:matrix.org,@bob:domain.com"

# BOT
BACKEND_URL #optional - full url for the bot to reach the backend
DRIP_AMOUNT #optional - default amount of token to send
MATRIX_ACCESS_TOKEN #required - your bot access token here is how to find it https://t2bot.io/docs/access_tokens/.
MATRIX_BOT_USER_ID #required - your bot user id
NETWORK_DECIMALS #optional - decimal amount for the network
NETWORK_UNIT #optional - token unit for the network
```

Copy example file to real env and change its values:
```bash
$ cp example.env .env
```

## Helm deployment / Adding a new faucet

0. Create an account for your MATRIX_BOT_USER_ID at https://matrix.org/, login and retrieve MATRIX_ACCESS_TOKEN in `Settigns -> Help and about -> click to reveal`

1. Create a *chainName-values.yaml* file and define all non default variables. Secret variables (MATRIX_ACCESS_TOKEN & FAUCET_ACCOUNT_MNEMONIC) you need to supply externally
via CI / command line / ...

2. Create a new CI-Job / Environment in *.gitlab-ci.yml* file and add Secrets (in clear / non-base64 encoded format) to `gitlab -> CI/CD Settings -> Secret Variables`).

4. Run CI/CD or use `helm` to deploy.


### Example Helm usage:

```
helm template westend . \
 --values ./westend-values.yaml \
 --set server.secret.FAUCET_ACCOUNT_MNEMONIC='ich und du muellers esel das bist du' \
 --set server.image.dockerTag=latest \
 --set bot.secret.MATRIX_ACCESS_TOKEN='asdf-not-a-secret-asfd'

helm -n faucetbots ls --all

helm -n faucetbots rollback westend 2
```

### Misc:
* Bump API: `yarn upgrade @polkadot/util@latest @polkadot/wasm-crypto@latest @polkadot/keyring@latest @polkadot/x-randomvalues@latest @polkadot/api@latest @polkadot/keyring@latest @polkadot/util-crypto@latest`
* Server can be queried for Prometheus metrics via http://$BACKEND_URL/metrics
* Readiness check URL  via http://$BACKEND_URL/ready
* Health check URL  via http://$BACKEND_URL/health
