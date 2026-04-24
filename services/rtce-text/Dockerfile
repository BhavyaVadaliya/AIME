FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Ensure we start with a clean build
RUN rm -rf dist && npm run build
EXPOSE 3002
CMD ["node", "dist/index.js"]
