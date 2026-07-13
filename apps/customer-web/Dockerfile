FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/customer-web/package*.json apps/customer-web/
RUN npm install
COPY tsconfig.base.json ./
COPY apps/customer-web apps/customer-web
ARG VITE_API_BASE_URL=/api
ARG VITE_LINE_LIFF_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LINE_LIFF_ID=$VITE_LINE_LIFF_ID
WORKDIR /app/apps/customer-web
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/apps/customer-web/dist /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
