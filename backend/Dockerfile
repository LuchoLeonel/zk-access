FROM node:22-slim

RUN apt-get update && apt-get install -y git build-essential python3

WORKDIR /app

RUN corepack enable \
  && corepack prepare yarn@3.2.3 --activate \
  && yarn set version 3.2.3

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3000
CMD ["yarn", "dev"]
