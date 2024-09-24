## Frequency Testnet Faucet

Fork of [paritytech/polkadot-testnet-faucet](https://github.com/paritytech/polkadot-testnet-faucet)

E2E tests don't work right now, and the fork has diverged significantly and stopped being synched around v3.4

To test, follow instructions to launch the Faucet Server, then head over to the Faucet Client README and launch that.

## Faucet Client Development
See [Faucet Client README](https://github.com/frequency-chain/testnet-faucet/blob/main/client/README.md)

## Faucet Server Development
### 1. Install packages.
```bash
yarn install
```

### 2. start local database:

Uses sqlite file, no start needed.

### 3. run migrations:
```bash
yarn migrations:run
```

### 4. Configure environment variables

Definition with explanation is in `./env.faucet.config.json`

Copy example file to real env and change its values:
```bash
$ cp .env.example .env
```

### 5. launch a hot-reloading dev environment (faucet server only)

```bash
yarn dev
```

## POST request testing
For testing, you can use the public, [testing hCaptcha values](https://docs.hcaptcha.com/#integration-testing-test-keys).

Example request using the test hCaptcha token:
```bash
curl -X POST \
  localhost:5555/drip/web \
  -H "Content-Type: application/json" \
  -d '{"address": "xxx", "captcha": "10000000-aaaa-bbbb-cccc-000000000001"}'
```

## Other stuff
There are git hooks you can set up by running
```shell
yarn simple-git-hooks
```
#### creating migrations:
* update entities in `src/db/entity`
* run `yarn migrations:generate src/db/migration/<migration_name>`
* import generated migration to `src/db/dataSource.ts`

## End-to-end tests

Please refer to the [E2E Readme](./e2e/README.md).  They don't run.

### Helm chart

An official [substrate-faucet helm chart](https://github.com/paritytech/helm-charts/tree/main/charts/substrate-faucet) is available for deploying the faucet.

### Misc:

* Bump API: `yarn upgrade @polkadot/util@latest @polkadot/wasm-crypto@latest @polkadot/keyring@latest @polkadot/x-randomvalues@latest @polkadot/api@latest @polkadot/keyring@latest @polkadot/util-crypto@latest`
* Server can be queried for Prometheus metrics via `/metrics`
* Readiness check URL via `ready`
* Health check URL via `/health`
