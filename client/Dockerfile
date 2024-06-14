FROM node:22 AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/
RUN yarn install --immutable
COPY . ./

RUN yarn run check
RUN yarn build

FROM node:22-slim

WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn/ ./.yarn/

RUN yarn workspaces focus --production

COPY --from=build /app/build .

CMD [ "node", "./index.js" ]
