FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/admin-web/package*.json apps/admin-web/
RUN npm install
COPY tsconfig.base.json ./
COPY apps/admin-web apps/admin-web
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app/apps/admin-web
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
