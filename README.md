## Generic Faucet for Substrate based chains

[![GitHub Issue Sync](https://github.com/paritytech/polkadot-testnet-faucet/actions/workflows/github-issue-sync.yml/badge.svg)](https://github.com/paritytech/polkadot-testnet-faucet/actions/workflows/github-issue-sync.yml)

## Development

#### Setup dependencies and git hooks

```bash
yarn install
yarn simple-git-hooks
```

#### start local database:
```bash
yarn dev:db
```

#### run migrations:
```bash
yarn migrations:run
```

#### creating migrations:
* update entities in `src/db/entity`
* run `yarn migrations:generate src/db/migration/<migration_name>`
* import generated migration to `src/db/dataSource.ts`

#### To launch a hot-reloading dev environment

```bash
yarn dev
```

## Environment variables

Definition with explanation is in `./env.faucet.config.json`

Copy example file to real env and change its values:
```bash
$ cp example.env .env
```

## End-to-end tests

Please refer to the [E2E Readme](./e2e/README.md).

Example requests:

```bash
curl -X POST \
  localhost:5555/drip/web \
  -H "Content-Type: application/json" \
  -d '{"address": "xxx", "parachain_id": "1002", "recaptcha": "captcha_token"}'
```

In React:

```tsx
import ReCAPTCHA from "react-google-recaptcha";

(...)

const [captcha, setCaptcha] = useState<string | null>(null)

(...)

<ReCAPTCHA
  sitekey="xxx"
  onChange={setCaptcha}
/>

(...)

const request = async () => {
  const body = {
    address: "xxx",
    parachain_id: "1002",
    recaptcha: captcha_token
  }

  const fetchResult = await fetch("http://localhost:5555/drip/web", {
    method: "POST", body: JSON.stringify(body), headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  })
  const result = await fetchResult.json()
}
```

Where the `captcha_token` is a recaptcha token created with a `sitekey`
is matching the recaptcha secret specified in `SMF_BACKEND_RECAPTCHA_SECRET`.

For testing, you can use a public, testing recaptcha secret which will allow any captcha token to pass.

```shell
# Public testing secret, will accept all tokens.
SMF_BACKEND_RECAPTCHA_SECRET="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
```

### Helm chart

An official [substrate-faucet helm chart](https://github.com/paritytech/helm-charts/tree/main/charts/substrate-faucet) is available for deploying the faucet.

### Misc:

* Bump API: `yarn upgrade @polkadot/util@latest @polkadot/wasm-crypto@latest @polkadot/keyring@latest @polkadot/x-randomvalues@latest @polkadot/api@latest @polkadot/keyring@latest @polkadot/util-crypto@latest`
* Server can be queried for Prometheus metrics via `/metrics`
* Readiness check URL via `ready`
* Health check URL via `/health`
