FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# 1. Root dependencies
COPY package*.json ./
RUN npm install

# 2. Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# 3. Client build
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# 4. Copy backend source code
COPY src/ ./src/

# 5. FINAL CHECK: Confirm files are in /app/client-dist
RUN ls -la /app/client-dist && ls -la /app/client-dist/index.html

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Use 'npx prisma db push' for database sync
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
