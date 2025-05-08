# Etapa 1: Construcción
FROM node:23.3.0-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

# Habilitar Corepack y Yarn 3.2.3
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

# Instalar paquetes
# Copia package.json y yarn.lock antes para aprovechar la cache de Docker
COPY package.json yarn.lock ./

# Instala dependencias
RUN yarn install

# Copia el resto de la app
COPY . .

# Expone el puerto que usa Next.js por defecto
EXPOSE 3000

# Comando por defecto para dev
CMD ["yarn", "dev"]