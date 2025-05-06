# Usa la imagen base de Node.js
FROM node:23.3.0-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

# Habilitar Corepack para usar Yarn 3+
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

COPY . .

RUN yarn install

RUN yarn build

# Etapa 2: Production
FROM node:23.3.0-slim

# -- Add curl and any other needed utilities
RUN apt-get update && apt-get install -y curl

WORKDIR /app

RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

# Copy only essential files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn*.lock ./
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js


EXPOSE 3001

CMD ["yarn", "start"]