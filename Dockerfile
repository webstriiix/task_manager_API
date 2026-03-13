FROM node:20-alpine

# Install OpenSSL and libc6-compat for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# 1. Install root dependencies
COPY package*.json ./
RUN npm install

# 2. Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# 3. Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# 4. Copy the rest of the source code
COPY . .

# 5. Build the React frontend
RUN cd client && npm run build

EXPOSE 8080

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
