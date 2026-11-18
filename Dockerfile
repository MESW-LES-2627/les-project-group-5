# One image for local development, used by both the "server" and the "web" services in compose.yaml.
# It only installs the dependencies: the source code is mounted from your computer at run time,
# so saving a file reloads the app without rebuilding the image.
# Same Node version as .nvmrc.
FROM node:24-slim

WORKDIR /app

# Copy only the package files first: Docker then reuses the "npm ci" layer until a dependency changes.
COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/web/package.json packages/web/
COPY packages/server/package.json packages/server/
# npm ci runs the postinstall script, which needs this file.
COPY scripts/copy-mediapipe-wasm.mjs scripts/

RUN npm ci