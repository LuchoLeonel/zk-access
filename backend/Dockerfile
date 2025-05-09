FROM node:22-slim

RUN apt-get update && apt-get install -y git build-essential python3

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 5000
CMD ["yarn", "dev"]