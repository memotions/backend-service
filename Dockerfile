# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json to install dependencies
COPY package.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Copy the Firebase Service Account file to the root of the image
COPY firebase-service-account.json /app/firebase-service-account.json

# Build the TypeScript application
RUN npm run build

# Stage 2: Run
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only necessary files and directories from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

# Install only production dependencies
RUN npm install --production

# Expose the port your application runs on
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"]
