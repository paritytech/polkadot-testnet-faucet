FROM node:18 AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./

RUN yarn run check
RUN yarn build

CMD [ "node", "/app/build/index.js" ]
