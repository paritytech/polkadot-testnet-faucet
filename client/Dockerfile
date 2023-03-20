FROM node:18 AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./

ARG DEMO
ENV VITE_DEMO ${DEMO}
ARG CAPTCHA_KEY
ENV VITE_CAPTCHA_KEY ${CAPTCHA_KEY}
ARG FAUCET_URL
ENV VITE_FAUCET_URL ${FAUCET_URL}

RUN yarn build

FROM nginx:1.22-alpine
COPY --from=build /app/dist /usr/share/nginx/html
