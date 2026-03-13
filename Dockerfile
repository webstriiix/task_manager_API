# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the backend and final image
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy root package files and install production dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the backend source code
COPY src/ ./src/

# Copy the built frontend from Stage 1
# Note: vite.config.js is configured to output to '../client-dist' relative to client/
COPY --from=frontend-builder /app/client-dist ./client-dist

EXPOSE 8080

# Use a shorter CMD to avoid shell issues and ensure PORT is respected
# If you are on Leapcell, you may want to use npx prisma db push instead of migrate deploy for first time
CMD ["sh", "-c", "npx prisma db push && npm start"]
