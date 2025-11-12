FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

# Copy package files first for cached installs
COPY package*.json ./

RUN npm ci --only=production || npm install --production

# Copy app files
COPY . .

ENV PORT=3000
ENV PLAYWRIGHT_HEADLESS=true

EXPOSE 3000

CMD ["node", "src/server.js"]
