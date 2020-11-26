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
DRIP_AMOUNT=5
MATRIX_ACCESS_TOKEN="ThisIsNotARealAccessToken"
MATRIX_BOT_USER_ID="@test_bot_faucet:matrix.org"
NETWORK_DECIMALS=12
NETWORK_UNIT="CAN"
```

### k8s deployment
0. make sure you have the credentials to access the GCP *parity-testnet* and https://hub.docker.com/u/paritytech registry at hand.

1. create k8s namespace
   `export NS="canvas-faucet" ; kubectl create ns $NS`

2. Generate k8s secret containing the
   `kubectl create secret generic ${NS}-config -n $NS --from-literal=matrix-access-token='<put token here>' --from-literal=mnemonic='<put mnemonic here>'`

3. Deploy like this: `export CI_PROJECT_NAME=$NS; export DOCKER_IMAGE=$NS; export DOCKER_TAG=latest ; cat deployment.template.yaml |envsubst|  kubectl -n $NS apply -f -`

NOTE: in case of an update do a `kubectl -n $NS delete deployment canvas-faucet` before 3.
---

### dockerize

```
docker build -t paritytech/canvas-faucet-bot:latest -f Dockerfile-bot .
docker push paritytech/canvas-faucet-bot:latest
```
and

```
docker build -t paritytech/canvas-faucet-server:latest -f Dockerfile-server .
docker push paritytech/canvas-faucet-server:latest
```
