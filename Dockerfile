# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código e builda
# As variáveis VITE_ precisam estar disponíveis em build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_SCHEMA
ARG VITE_N8N_WEBHOOK_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_SCHEMA=$VITE_SUPABASE_SCHEMA
ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL

COPY . .
RUN npm run build

# ── Stage 2: serve com nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia config customizada com SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build do Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
