FROM node:23.3.0-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

# Instala Git y otras dependencias necesarias
RUN apt-get update && apt-get install -y git

WORKDIR /app

# Habilitar Corepack y Yarn 3.2.3
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]
