# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for Vite env variables (injected at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GEMINI_API_KEY
ARG VITE_N8N_WEBHOOK_URL

# Write .env from build args so Vite can read them
RUN printf "VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\nVITE_GEMINI_API_KEY=%s\nVITE_N8N_WEBHOOK_URL=%s\n" \
  "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY" "$VITE_GEMINI_API_KEY" "$VITE_N8N_WEBHOOK_URL" > .env

# Build the app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
