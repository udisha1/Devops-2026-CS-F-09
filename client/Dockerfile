# Stage 1: Build the React application with Vite
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production Nginx web server
FROM nginx:alpine

# Copy compiled static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx template for dynamic backend URL substitution
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Default backend URL (points to Kubernetes service or Docker Compose service)
ENV BACKEND_URL=http://taskflow-server:5000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
