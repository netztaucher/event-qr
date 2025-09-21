# Multi-stage Dockerfile für event-qr System
# Optimiert für Produktion mit qr.joerghalfmann.de

# Stage 1: Frontend Build
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend Setup
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install PM2 für process management
RUN npm install -g pm2

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S eventqr -u 1001

# Create app directory
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend ./backend
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy PM2 ecosystem file
COPY docker/ecosystem.config.js ./

# Create necessary directories
RUN mkdir -p /app/logs
RUN mkdir -p /app/uploads
RUN mkdir -p /app/data

# Set correct permissions
RUN chown -R eventqr:nodejs /app
USER eventqr

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node backend/healthcheck.js || exit 1

EXPOSE 5000
EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]