# Docker Architecture: Event QR System

## Overview
The Event QR system consists of three main containers orchestrated via docker-compose, providing a scalable and maintainable architecture for QR code generation and management.

## Container Structure

### 1. Frontend + Backend Container (`event-qr`)
Built using multi-stage Dockerfile for optimized size and security.

#### Build Stages
1. **Frontend Build Stage**
   ```dockerfile
   FROM node:18-alpine AS frontend-builder
   - Clean npm install (ci)
   - Builds React frontend
   - Outputs to /dist
   ```

2. **Backend Build Stage**
   ```dockerfile
   FROM node:18-alpine AS backend-builder
   - Clean npm install
   - Copies backend code
   ```

3. **Production Stage**
   ```dockerfile
   FROM node:18-alpine AS production
   - Combines frontend + backend
   - PM2 process manager
   - Non-root user (eventqr)
   - Health checks
   ```

#### Volumes
- `event_qr_logs`: `/app/logs`
- `event_qr_uploads`: `/app/uploads`
- `frontend_dist`: `/usr/share/nginx/html`

#### Environment Variables
- `NODE_ENV`: production mode
- `DB_URL`: MongoDB connection
- `JWT_SECRET`: Authentication
- `GOOGLE_CREDENTIALS`: Sheet access
- `SHEET_ID`: Target spreadsheet

### 2. Database Container (`mongodb`)
```yaml
image: mongo:4.4
volumes:
  - mongodb_data:/data/db
  - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
```
- Persistent storage
- Initialization script
- Health checks
- Network isolation

### 3. Reverse Proxy (`nginx`)
```yaml
image: nginx:alpine
volumes:
  - ./docker/nginx.conf:/etc/nginx/nginx.conf
  - ./docker/ssl:/etc/nginx/ssl
  - ./frontend/dist:/usr/share/nginx/html
```
- SSL termination
- Static file serving
- API routing
- Rate limiting

## Networking

### Internal Network (`event-qr-network`)
- Isolated bridge network
- Inter-container communication
- No direct external access except through nginx

### Port Mapping
- External: 7085
- Internal routing:
  - nginx → event-qr: 80
  - event-qr → mongodb: 27017

## Security Measures

### Container Security
1. **Non-root User**
   ```dockerfile
   RUN adduser -S eventqr -u 1001
   USER eventqr
   ```

2. **Read-only Volumes**
   ```yaml
   volumes:
     - ./config:/config:ro
   ```

3. **Container Isolation**
   - Separate network
   - Minimal exposed ports
   - Health checks

### Application Security
1. **JWT Authentication**
2. **Rate Limiting**
3. **SSL/TLS**
4. **Secure Headers**

## Deployment Process

### Local Development
```bash
# Build containers
docker-compose build --no-cache

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment
Handled by WordPress plugin:
1. Git pull latest code
2. Copy production .env
3. Build containers
4. Health check
5. Switch traffic

### Volumes & Persistence
```yaml
volumes:
  mongodb_data:    # Database files
  event_qr_logs:   # Application logs
  event_qr_uploads: # User uploads
  frontend_dist:   # Built frontend
```

## Monitoring & Health

### Health Checks
1. **MongoDB**
   ```yaml
   test: echo 'db.runCommand("ping").ok'
   interval: 10s
   retries: 5
   ```

2. **Backend**
   ```yaml
   test: wget --spider http://localhost/health
   interval: 30s
   retries: 3
   ```

### Logging
- Application logs: `event_qr_logs`
- Nginx access logs
- MongoDB logs
- Docker logs

## Version Control & Updates

### Container Versioning
- Built from git commits
- No separate container registry
- Built on deployment

### Update Process
1. Git pull new version
2. Build new containers
3. Health check
4. Switch traffic
5. Remove old containers

## Development Workflow

### Local Setup
```bash
# Clone repository
git clone https://github.com/netztaucher/event-qr.git

# Create .env
cp .env.example .env

# Start development environment
docker-compose up -d
```

### Making Changes
1. Update code
2. Rebuild affected containers
3. Test locally
4. Commit & push
5. Deploy via plugin

## Common Operations

### View Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f event-qr
```

### Restart Services
```bash
# All services
docker-compose restart

# Single service
docker-compose restart event-qr
```

### Update Deployment
```bash
# Pull changes
git pull

# Rebuild
docker-compose build --no-cache

# Deploy
docker-compose up -d
```

## Local vs Production Environment

### Architecture Differences
- Local: ARM (Apple Silicon)
- Production: Intel/AMD64

### Build Requirements
- Multi-architecture build support
- Platform flags for AMD64 compatibility
- `--platform linux/amd64` for production builds

### Solution Options
1. Multi-arch builds for all environments
2. Separate docker-compose files:
   - `docker-compose.dev.yml` (ARM-optimized)
   - `docker-compose.prod.yml` (AMD64)