## Generic Faucet for Substrate based chains 

## Environment

Setup a .env file with the following variables
```bash
MATRIX_ACCESS_TOKEN #your bot access token here is how to find it https://t2bot.io/docs/access_tokens/
MATRIX_BOT_USER_ID #your bot user id
FAUCET_ACCOUNT_MNEMONIC #mnemonic seed from faucet account
BACKEND_URL #full url for the bot to reach the backend
RPC_ENDPOINT #ws rpc node endpoint
DRIP_AMOUNT #default amount of token to send
NETWORK_DECIMALS #decimal amount for the network
NETWORK_UNIT #token unit for the network
INJECTED_TYPES #optional if any type must be overriden
```
example:
```bash
MATRIX_ACCESS_TOKEN="ThisIsNotARealAccessToken"
MATRIX_BOT_USER_ID="@test_bot_faucet:matrix.org"
FAUCET_ACCOUNT_MNEMONIC="this is a fake mnemonic"
BACKEND_URL="http://localhost:5555"
RPC_ENDPOINT="wss://canvas-rpc.parity.io/"
DRIP_AMOUNT=5
NETWORK_DECIMALS=12
NETWORK_UNIT="CAN"
INJECTED_TYPES="{ "Address": "AccountId", "LookupSource": "AccountId" }"
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
