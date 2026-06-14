FROM node:18-slim

# Cache bust 2026-06-14-19:17
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate

CMD ["node", "src/index.js"]
