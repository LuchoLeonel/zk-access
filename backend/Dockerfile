# Etapa 1: Construcción
FROM node:23.3.0-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

# Habilitar Corepack y Yarn 3.2.3
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

# Instalar git
RUN apt-get update && apt-get install -y git

COPY . .

# Instalar dependencias sin modificar yarn.lock
RUN yarn install

# Compilar la app NestJS
RUN yarn build

# Etapa 2: Producción
FROM node:23.3.0-slim

RUN apt-get update && apt-get install -y curl

WORKDIR /app

# Copiar archivos esenciales desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]
