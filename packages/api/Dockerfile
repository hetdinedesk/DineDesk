FROM node:18-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node src/index.js"]
