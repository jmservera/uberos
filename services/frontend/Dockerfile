# UberOS frontend SPA (Svelte + Golden Layout v2).
# Multi-stage build: Vite compiles the app, then nginx serves the static output
# on :3000. See WP-9 in docs/specs/01-Init-research.md.

# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
