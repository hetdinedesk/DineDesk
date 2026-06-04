FROM node:18-slim

# Cache bust 2026-05-28-19:10
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate
RUN npx prisma db push --accept-data-loss

CMD ["node", "src/index.js"]
