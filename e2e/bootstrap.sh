#!/usr/bin/env bash
set -euo pipefail
cd $(dirname $0)

# Clean up potential data from previous runs,
# in order to start with a clean state.
docker-compose -f docker-compose.infrastructure.yml down -v
rm -rf ./matrix_data/homeserver.db* ../sqlite.db
docker network rm faucet-e2e || true


# Make sure Polkadot with a parachain are up.
# They should be started before running this script.
source wait_until.sh 'curl -s "127.0.0.1:9933"'
source wait_until.sh 'curl -s "127.0.0.1:9934"'


# Start Matrix and wait until it is up.
docker network create faucet-e2e
docker-compose -f docker-compose.infrastructure.yml up -d
source wait_until.sh 'curl -s "127.0.0.1:8008"'


# Generate users:
# one admin to create rooms, one faucet bot, one user that will be requesting funds.
docker exec e2e-matrix register_new_matrix_user \
  --user admin --password admin -c /data/homeserver.yaml --admin
docker exec e2e-matrix register_new_matrix_user \
  --user bot --password bot -c /data/homeserver.yaml --no-admin
docker exec e2e-matrix register_new_matrix_user \
  --user user --password user -c /data/homeserver.yaml --no-admin


# Retrieve access tokens (by logging in).
MATRIX_URL="http://localhost:8008"
ADMIN_ACCESS_TOKEN=$(curl -s -X POST $MATRIX_URL/_matrix/client/v3/login -H "Content-Type: application/json" -d '{"type":"m.login.password", "user":"admin", "password":"admin"}' | jq -r .access_token)
BOT_ACCESS_TOKEN=$(curl -s -X POST $MATRIX_URL/_matrix/client/v3/login -H "Content-Type: application/json" -d '{"type":"m.login.password", "user":"bot", "password":"bot"}' | jq -r .access_token)
USER_ACCESS_TOKEN=$(curl -s -X POST $MATRIX_URL/_matrix/client/v3/login -H "Content-Type: application/json" -d '{"type":"m.login.password", "user":"user", "password":"user"}' | jq -r .access_token)


# Create the faucet room and invite interested parties.
ROOM_ID=$(curl -s -X POST -d '{"room_alias_name":"faucet"}' "$MATRIX_URL/_matrix/client/v3/createRoom?access_token=$ADMIN_ACCESS_TOKEN" | jq -r .room_id)
curl -s -X POST -d '{"user_id":"@bot:parity.io"}' "$MATRIX_URL/_matrix/client/v3/rooms/$ROOM_ID/invite?access_token=$ADMIN_ACCESS_TOKEN"
curl -s -X POST -d '{"user_id":"@user:parity.io"}' "$MATRIX_URL/_matrix/client/v3/rooms/$ROOM_ID/invite?access_token=$ADMIN_ACCESS_TOKEN"
curl -s -X POST -d '{}' "$MATRIX_URL/_matrix/client/v3/rooms/$ROOM_ID/join?access_token=$BOT_ACCESS_TOKEN"
curl -s -X POST -d '{}' "$MATRIX_URL/_matrix/client/v3/rooms/$ROOM_ID/join?access_token=$USER_ACCESS_TOKEN"


# Prepare the .env that will be used to run the faucet bot and server.
cat << EOF > ./.env
SMF_CONFIG_NETWORK=e2e
SMF_CONFIG_BACKEND_URL="http://127.0.0.1:5555"

SMF_CONFIG_MATRIX_ACCESS_TOKEN="$BOT_ACCESS_TOKEN"
SMF_CONFIG_MATRIX_BOT_USER_ID="@bot:parity.io"
SMF_CONFIG_FAUCET_IGNORE_LIST=""
SMF_CONFIG_MATRIX_SERVER="http://matrix:8008"
SMF_CONFIG_DEPLOYED_REF=local
SMF_CONFIG_DEPLOYED_TIME=local

SMF_CONFIG_FAUCET_ACCOUNT_MNEMONIC="//Alice"
SMF_CONFIG_PORT=5555

# Local Zombienet relaychain node.
SMF_CONFIG_DEPLOYED_REF=local
SMF_CONFIG_DEPLOYED_TIME=local
SMF_CONFIG_EXTERNAL_ACCESS=true
SMF_CONFIG_RECAPTCHA_SECRET="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe" # Public testing secret, will accept all tokens.
EOF
