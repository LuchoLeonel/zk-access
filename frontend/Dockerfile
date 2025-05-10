# Usa la imagen base de Node.js
FROM node:23.3.0-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

# Habilitar Corepack para usar Yarn 3+
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

COPY . .


ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_BASE_SEPOLIA_VERIFIER
ENV NEXT_PUBLIC_BASE_URL=https://zk-access.aichallenge.fun
ENV NEXT_PUBLIC_BACKEND_URL=https://api.zk-access.aichallenge.fun
ENV NEXT_PUBLIC_BASE_SEPOLIA_VERIFIER=0x20c0aa08d78cbcf3634b38ad587a9cc75b250ffc

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