# End-to-end tests

## Components

The E2E tests consist of the following components:

1. Blockchain

We use a local, development chain of Polkadot.
A [Cumulus](https://github.com/paritytech/cumulus/) based parachain is added to it.
The startup is orchestrated by [Zombienet](https://github.com/paritytech/zombienet).

2. Matrix server

A local instance of a Matrix server is used.
We use a published docker image of [Synapse](https://github.com/matrix-org/synapse).

3. The faucet

The local code of the faucet is built and started as a docker container.

4. The test cases

A number of Jest test cases cover the external API of the faucet and the matrix-based interaction.

## Run the tests locally

1. Prepare the blockchain executables

We need several executables - `polkadot`, `polkadot-prepare-worker` and `polkadot-execute-worker`
for Polkadot relay chain, and `polkadot-parachain` for Cumulus based parachain.
It is recommended to use released versions of those (as opposed to code from `master`)

Decide, where to put the binaries (replace `<bin_path>` with it, for all examples) and add it to `PATH`,
so that `zombienet` will be able to find them:
```bash
export PATH="<bin_path>:$PATH"
```

**Linux**:

For example, to download a `v1.8.0` release of `polkadot` and a corresponding version of a parachain:

```bash
cd <bin_path>
wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.8.0/polkadot
wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.8.0/polkadot-prepare-worker
wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.8.0/polkadot-execute-worker
wget https://github.com/paritytech/polkadot-sdk/releases/download/polkadot-v1.8.0/polkadot-parachain
chmod +x ./polkadot*
```

**Apple Silicon Macs**:

There are no pre-built binaries, so we need to build the binaries from source:

```bash
git clone https://github.com/paritytech/polkadot-sdk.git
git checkout polkadot-v1.8.0
cd polkadot-sdk/polkadot
cargo build --release --locked
cp ../target/release/polkadot <bin_path>/
cp ../target/release/polkadot-execute-worker <bin_path>/
cp ../target/release/polkadot-prepare-worker <bin_path>/

cd ../cumulus/polkadot-parachain
cargo build --release --locked
cp ../../target/release/polkadot-parachain <bin_path>/
```

2. Run zombienet

First, make sure that all the binaries are in `PATH`. If not, go back to step `1.`.

```bash
command -v polkadot || echo "No polkadot in PATH"
command -v polkadot-parachain || echo "No polkadot-parachain in PATH"
command -v polkadot-prepare-worker || echo "No polkadot-prepare-worker in PATH"
command -v polkadot-execute-worker || echo "No polkadot-execute-worker in PATH"
```

Next, in the root of this repository, start the Zombienet:

```bash
npx --yes @zombienet/cli@1.3.93 --provider native --dir e2e/zombienet_logs spawn e2e/zombienet.native.toml
```

Verify that it's working correctly by opening the [relaychain](https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/explorer) and [parachain](https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9945#/explorer) explorers,
and by asserting that it responds to RPC requests:

```bash
# Relay chain
curl localhost:9944
# Expecting: Used HTTP Method is not allowed. POST or OPTIONS is required

# Parachain
curl localhost:9945
# Expecting: Used HTTP Method is not allowed. POST or OPTIONS is required
```

3. Build the faucet

- Prepare a `.env` file with necessary configuration for the faucet

```bash
yarn build:docker
```

4. Generate PAPI types for e2e tests

```bash
yarn generate:papi:e2e
```

These types are generated based on `.scale` files in `e2e/` directory. To regenerate these files using live zombienet nodes, use `papi update --config e2e/polkadot-api-e2e.json` command.

5. Run the tests

```bash
yarn test:e2e
```

Logs of the application container will be avaiable at `e2e/containter_logs/faucet-test-app.log`
Logs of matrix container will be avaiable at `e2e/containter_logs/faucet-test-matrix.log`
Logs of zombienet nodes will be available at `e2e/zombienet_logs/`

The whole suite of tests can take tens of seconds,
because it depends on the blockchain to mine blocks and execute the XCM teleportation process.
