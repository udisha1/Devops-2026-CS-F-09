FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
