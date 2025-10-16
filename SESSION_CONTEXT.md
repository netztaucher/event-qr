# Session Context - 2025-10-16

## Changes Made
- Simplified routing structure (removed /qr prefix)
- Added dynamic Google Sheets integration
- Improved error handling and environment variable management

## Configuration
- Google Sheets Integration
  - Uses GOOGLE_CREDENTIALS env var for auth
  - SHEET_ID for target spreadsheet
  - Optional SHEET_NAME for explicit sheet name
  - Auto-detects first sheet name if not specified

## API Endpoints
- `/` - Frontend SPA
- `/api/*` - API routes
- `/api/auth/*` - Authentication
- `/api/generate-qr` - QR code generation
- `/health` - Health check

## Sheet Structure
Column layout in Google Sheet:
- A: TKT-ID (e.g. "TKT-16035-15-1-393d6d")
- B: Name
- C: Email
- D: Phone
- E: Ticket Type
- F: Status

## Testing

### Automated Tests
Test script available at `scripts/test-docker-stack.sh`:
```bash
# Run full test suite
./scripts/test-docker-stack.sh
```

The script tests:
- Container build and startup
- Service health checks (MongoDB, Backend)
- Frontend accessibility
- API endpoints (health, QR generation)
- Error checking in logs

### Manual Testing
```bash
# Build and run containers
docker-compose up -d

# Test endpoints
curl http://localhost:7085/health
curl -X POST http://localhost:7085/api/generate-qr -d '{"from":2,"to":3}'
```