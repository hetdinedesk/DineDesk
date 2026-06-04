FROM node:18-slim

# Cache bust 2026-05-28-19:10
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate

# Note: prisma db push runs in railway.toml startCommand (runtime, not build)
# to ensure DATABASE_URL env var is available

CMD ["node", "src/index.js"]
