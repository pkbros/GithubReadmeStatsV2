# 1. Use the official lightweight Node.js 20 image
FROM node:24-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json first to cache layers
COPY package*.json ./

# 4. Install only production dependencies
RUN npm ci --only=production

# 5. Copy the rest of the application files
COPY . .

# 6. Expose the port (Cloud Run sets the PORT env variable automatically)
EXPOSE 8080

# 7. Command to start the application
CMD [ "npm", "start" ]