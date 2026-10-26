# Production Node.js Server Dockerfile
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create app directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy server code
COPY . .

# Set non-root user for security
USER node

# Expose API port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
