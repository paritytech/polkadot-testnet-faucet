FROM docker.io/library/node:18.16.0-alpine

# uncomment to fix build on MacOS Apple Silicon chip
# RUN apk add --no-cache python3 make g++
RUN apk add git

LABEL maintainer="Frequency"
LABEL description="Frequency Rococo faucet backend"

WORKDIR /faucet

COPY ./package.json ./yarn.lock ./
RUN yarn --network-concurrency 1 --frozen-lockfile

COPY . .
RUN yarn build

CMD yarn start:backend
