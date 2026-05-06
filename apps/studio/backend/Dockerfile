## ── dev: node --watch con hot-reload ──────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3005
CMD ["node", "--watch", "server.js"]

## ── prod: solo dependencias de producción ─────────────────
FROM node:20-alpine AS prod

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3005
CMD ["node", "server.js"]
