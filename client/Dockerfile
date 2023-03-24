FROM node:18 AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./

RUN yarn run check
RUN yarn build

FROM node:18-slim

WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock ./

RUN yarn --prod

COPY --from=build /app/build .

CMD [ "node", "./index.js" ]
