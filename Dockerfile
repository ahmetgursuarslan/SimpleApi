# Node.js LTS
FROM node:22-alpine

# Small init process so SIGTERM reaches node and zombies get reaped.
RUN apk add --no-cache tini

WORKDIR /app

# Install production dependencies only. --ignore-scripts blocks arbitrary
# postinstall code from transitive packages at build time.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy source (see .dockerignore - .env and node_modules are excluded)
COPY --chown=node:node . .

ENV NODE_ENV=production
EXPOSE 3000

# Drop root before running the app.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health/live',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
