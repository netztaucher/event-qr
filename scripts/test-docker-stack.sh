#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper function for logging
log() {
    echo -e "${2:-$YELLOW}➜ $1${NC}"
}

# Helper function for checking command success
check_status() {
    if [ $? -eq 0 ]; then
        log "$1 ✅" "$GREEN"
        return 0
    else
        log "$1 ❌" "$RED"
        return 1
    fi
}

# Wait for service to be ready
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy"; then
            return 0
        fi
        log "Waiting for $service (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done
    return 1
}

# Clean start
log "Stopping and removing existing containers..."
docker-compose down -v

# Build and start
log "Building containers..."
docker-compose build --no-cache
check_status "Build" || exit 1

log "Starting containers..."
docker-compose up -d
check_status "Startup" || exit 1

# Wait for services
log "Waiting for services to be ready..."
wait_for_service mongodb
check_status "MongoDB ready" || exit 1

wait_for_service event-qr
check_status "Backend ready" || exit 1

# Test Frontend
log "Testing Frontend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7085/)
if [ "$response" == "200" ]; then
    check_status "Frontend accessible"
else
    check_status "Frontend not accessible (HTTP $response)"
    exit 1
fi

# Test Health Endpoint
log "Testing Health Endpoint..."
response=$(curl -s http://localhost:7085/health)
if [[ "$response" == *"healthy"* ]]; then
    check_status "Health check passed"
else
    check_status "Health check failed"
    exit 1
fi

# Test API (QR Generation)
log "Testing QR Generation API..."
response=$(curl -s -X POST http://localhost:7085/api/generate-qr \
    -H "Content-Type: application/json" \
    -d '{"from":2,"to":3}')

if [[ "$response" == *"values"* ]] && [[ "$response" == *"TKT-"* ]]; then
    check_status "QR Generation successful"
else
    check_status "QR Generation failed"
    exit 1
fi

# Check Container Status
log "Checking container status..."
docker-compose ps | grep -q "event-qr.*healthy" && \
docker-compose ps | grep -q "mongodb.*healthy" && \
docker-compose ps | grep -q "nginx.*Up"
check_status "All containers healthy" || exit 1

# Check Logs for Errors
log "Checking logs for errors..."
# Exclude benign messages (e.g., MongoDB SIGTERM during restarts)
error_count=$(docker-compose logs --tail=200 | grep -iE "error|exception|fatal" \
    | grep -viE "Received signal|Terminated|Sessions collection is not set up" | wc -l)
if [ "$error_count" -eq 0 ]; then
    check_status "No critical errors in logs"
else
    check_status "Found $error_count critical errors in logs"
    docker-compose logs --tail=200 | grep -iE "error|exception|fatal" | grep -viE "Received signal|Terminated"
    exit 1
fi

# Show container details
log "\nContainer Details:" "$GREEN"
docker-compose ps

log "\nAll tests passed! 🎉" "$GREEN"