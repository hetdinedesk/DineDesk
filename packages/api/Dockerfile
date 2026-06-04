FROM node:18-slim

# Cache bust 2026-05-28-19:10
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate

# Note: Migrations run at container start (not build) to ensure DATABASE_URL is available
# The railway.toml startCommand should handle this, but we also include it here as fallback

CMD ["sh", "-c", "npx prisma migrate deploy && node src/scripts/ensureTimezoneColumn.js && node src/index.js"]
