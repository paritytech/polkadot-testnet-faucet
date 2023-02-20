FROM docker.io/library/node:16.10-alpine

# uncomment to fix build on MacOS Apple Silicon chip
# RUN apk add --no-cache python3 make g++
RUN apk add git==2.30.6-r0

ARG VCS_REF=master
ARG BUILD_DATE=""
ARG REGISTRY_PATH=docker.io/paritytech
ARG PROJECT_NAME=""

LABEL io.parity.image.authors="cicd-team@parity.io" \
    io.parity.image.vendor="Parity Technologies" \
    io.parity.image.title="${REGISTRY_PATH}/${PROJECT_NAME}-server" \
    io.parity.image.description="Generic Faucet for Substrate based chains (server)" \
    io.parity.image.source="https://github.com/paritytech/${PROJECT_NAME}/blob/${VCS_REF}/server_injected.Dockerfile" \
    io.parity.image.documentation="https://github.com/paritytech/${PROJECT_NAME}/blob/${VCS_REF}/README.md" \
    io.parity.image.revision="${VCS_REF}" \
    io.parity.image.created="${BUILD_DATE}"

WORKDIR /backend

COPY ./package.json ./yarn.lock ./
RUN yarn --network-concurrency 1 --frozen-lockfile

COPY . .
RUN yarn build

CMD yarn start:backend
