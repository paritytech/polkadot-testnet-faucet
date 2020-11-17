## Canvas Faucet 

This repo should most likely disapear asp and merged with
* https://gitlab.parity.io/parity/infrastructure/rococo-faucet-bot
* https://gitlab.parity.io/chains/westend-faucet

become ONE generic repsitory to managing all the testnet faucets!

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
