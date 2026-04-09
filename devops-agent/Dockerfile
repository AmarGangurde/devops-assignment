FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs public ./public
COPY --chown=nodejs:nodejs package.json ./
USER nodejs
EXPOSE 4001
ENV NODE_ENV=production
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4001/health || exit 1
CMD ["node", "src/agent.js"]
