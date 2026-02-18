# ---------- 1) Build-Stufe ----------
FROM node:22-alpine AS build
WORKDIR /app

# Kopiere nur package-Dateien und installiere Abhängigkeiten
COPY package*.json ./
RUN npm ci

# Kopiere den gesamten Anwendungscode und baue
COPY . .
RUN npm run build

# ---------- 2) Run-Stufe (nginx) ----------
FROM nginx:alpine

# nginx-Konfiguration (SPA-Routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fertiger Vite-Build befindet sich in /app/dist
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
