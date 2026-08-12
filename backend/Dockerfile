# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Symlink or mirror config to dist/config/config.js for sequelize-cli
RUN mkdir -p ./dist/config && cp ./dist/src/config/config.js ./dist/config/config.js 2>/dev/null || true

# Copy migrations and configuration files
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/.sequelizerc ./.sequelizerc

EXPOSE 5000

CMD ["node", "dist/src/app.js"]
