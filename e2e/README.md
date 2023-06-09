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

We need two executables - one for Polkadot relay chain, and one for Cumulus based parachain.
It is recommended to use released versions of those (as opposed to code from `master`)

**Note:** The 1.0 release of Polkadot has NOT been tested yet.

For example, to download a `v0.9.38` release of `polkadot` and a corresponding version of a parachain:

```bash
wget https://github.com/paritytech/polkadot/releases/download/v0.9.38/polkadot
wget https://github.com/paritytech/cumulus/releases/download/v0.9.380/polkadot-parachain
chmod +x ./polkadot*
```

Next, add the binaries to `PATH` so that `zombienet` will be able to find them:

```bash
export PATH="${PWD}:$PATH"
```

**M1 Macs**:

There are no pre-built binaries, so we need to build the binaries from source.
Starting from cloning the code of Polkadot, we switch to a released version of code and compile the required package:

```bash
git clone https://github.com/paritytech/polkadot.git
cd polkadot
git checkout v0.9.38
cargo build --release --locked -p polkadot
cd -
```

Similarly for Cumulus:

```bash
git clone https://github.com/paritytech/cumulus.git
cd cumulus/polkadot-parachain
git checkout v0.9.380
cargo build --release --locked
cd -
```

Next, add the binaries to `PATH` so that `zombienet` will be able to find them:

```bash
export PATH="${PWD}/polkadot/target/release:$PATH"
export PATH="${PWD}/cumulus/target/release:$PATH"
```

2. Run zombienet

First, make sure that the `polkadot` and `polkadot-parachain` are in `PATH`. If not, go back to step `1.`.

```bash
command -v polkadot || echo "No polkadot in PATH"
command -v polkadot-parachain || echo "No polkadot-parachain in PATH"
```

Next, in the root of this repository, start the Zombienet:

```bash
npx --yes @zombienet/cli@1.3.43 --provider native spawn e2e/zombienet.native.toml
```

Verify that it's working correctly by opening the [relaychain](https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9933#/explorer) and [parachain](https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9934#/explorer) explorers,
and by asserting that it responds to RPC requests:

```bash
# Relay chain
curl localhost:9933
# Expecting: Used HTTP Method is not allowed. POST or OPTIONS is required

# Parachain
curl localhost:9934
# Expecting: Used HTTP Method is not allowed. POST or OPTIONS is required
```

3. Bootstrap the infrastructure and configuration

The next step is to run the scripts that will perform the following:

- Start the Synapse (Matrix) server
- Create Matrix users, rooms, invitations
- Prepare a `.env` file with necessary configuration for the fuacet

```bash
./e2e/bootstrap.sh
```

4. Start the faucet

Finally, we start the faucet which is the code that's being tested.

```bash
docker-compose -f e2e/docker-compose.deployment.yml up --build
```

5. Run the tests

```bash
yarn test:e2e
```

The whole suite of tests can take tens of seconds,
because it depends on the blockchain to mine blocks and execute the XCM teleportation process.
