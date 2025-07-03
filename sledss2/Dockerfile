# Frontend Dockerfile for React application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for React app
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# Build the React application
RUN npm run build

# Production image, serve with nginx
FROM nginx:alpine AS runner

# Copy built React app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3005

# Configure nginx to listen on port 3005
RUN sed -i 's/listen       80;/listen       3005;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]