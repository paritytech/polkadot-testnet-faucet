FROM docker.io/library/node:20-alpine

# uncomment to fix build on MacOS Apple Silicon chip
# RUN apk add --no-cache python3 make g++
RUN apk add git

LABEL maintainer="Frequency"
LABEL description="Frequency Testnet faucet backend"

WORKDIR /faucet

COPY ./package.json ./yarn.lock ./
RUN yarn --frozen-lockfile

COPY . .
RUN yarn build

CMD yarn migrations:run && yarn start
