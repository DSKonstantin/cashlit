FROM node:22-slim AS frontend

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build
