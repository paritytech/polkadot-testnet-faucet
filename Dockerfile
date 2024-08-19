FROM docker.io/library/node:22.6-alpine3.20

ARG VCS_REF=master
ARG BUILD_DATE=""
ARG REGISTRY_PATH=docker.io/paritytech
ARG PROJECT_NAME=""

LABEL io.parity.image.authors="cicd-team@parity.io" \
    io.parity.image.vendor="Parity Technologies" \
    io.parity.image.title="${REGISTRY_PATH}/${PROJECT_NAME}-faucet" \
    io.parity.image.description="Generic Faucet for Substrate based chains" \
    io.parity.image.source="https://github.com/paritytech/${PROJECT_NAME}/blob/${VCS_REF}/Dockerfile" \
    io.parity.image.documentation="https://github.com/paritytech/${PROJECT_NAME}/blob/${VCS_REF}/README.md" \
    io.parity.image.revision="${VCS_REF}" \
    io.parity.image.created="${BUILD_DATE}"

WORKDIR /faucet

COPY .yarn/ ./.yarn/
COPY .papi/ ./.papi/
COPY package.json env.faucet.config.json yarn.lock .yarnrc.yml ./
RUN yarn --immutable

COPY . .
RUN yarn papi
RUN yarn build

CMD yarn migrations:run && yarn start
