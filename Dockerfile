# ETAPA 1: Construcción (Build)
FROM node:lts-alpine AS runtime
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la web estática (genera la carpeta dist/)
RUN npm run build

# ETAPA 2: Servidor Web (Nginx) - Para producción
FROM nginx:alpine

# Copiamos lo que generó la etapa 1 a la carpeta de Nginx
COPY --from=runtime /app/dist /usr/share/nginx/html

# Configuración básica de Nginx (opcional, la por defecto suele valer para estáticos)
EXPOSE 80