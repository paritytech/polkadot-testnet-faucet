## Generic Faucet for Substrate based chains

## Server environment variables

The only common variable between the bot and the server is the NETWORK_DECIMALS.
Also the server's `PORT` should be part of the bot's `BACKEND_URL`.

Setup a .env file with the following variables
```bash

FAUCET_ACCOUNT_MNEMONIC #required - mnemonic seed from faucet account
INJECTED_TYPES #optional - if any type must be overriden
NETWORK_DECIMALS #optional - decimal amount for the network
PORT #optional - the port you want the server to listen on
RPC_ENDPOINT #optional - required - ws rpc node endpoint
```

example:
```bash
FAUCET_ACCOUNT_MNEMONIC="this is a fake mnemonic"
INJECTED_TYPES="{ "Address": "AccountId", "LookupSource": "AccountId" }"
NETWORK_DECIMALS=12
PORT=5555
RPC_ENDPOINT="wss://canvas-rpc.parity.io/"
```

## Bot environment variables

Setup a .env file with the following variables

``` bash
BACKEND_URL #optional - full url for the bot to reach the backend
DRIP_AMOUNT #optional - default amount of token to send
MATRIX_ACCESS_TOKEN #required - your bot access token here is how to find it https://t2bot.io/docs/access_tokens/
MATRIX_BOT_USER_ID #required - your bot user id
NETWORK_DECIMALS #optional - decimal amount for the network
NETWORK_UNIT #optional - token unit for the network
```

example:
```bash
BACKEND_URL="http://localhost:5555"
DRIP_AMOUNT=10
MATRIX_ACCESS_TOKEN="ThisIsNotARealAccessToken"
MATRIX_BOT_USER_ID="@test_bot_faucet:matrix.org"
NETWORK_DECIMALS=12
NETWORK_UNIT="CAN"
```
---

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

helm -n faucetbots rollback canvas 2
```

### Misc:

* Server can be queried for Prometheus metrics via http://$BACKEND_URL/metrics
* Healthcheck URL  via http://$BACKEND_URL/health
