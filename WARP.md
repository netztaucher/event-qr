# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend tests (from backend directory)
npm test

# Generate test QR code
node test-qr-generation.js
```

### Docker Development
```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f event-qr
docker-compose logs -f mongodb
docker-compose logs -f nginx

# Rebuild containers (after changes)
docker-compose build --no-cache
docker-compose up -d
```

## Architecture

This is a full-stack web application split into three main components:

### Backend (Node.js/Express)
- `backend/controllers/` - Route handlers for admin, events, and QR functionality
- `backend/services/` - Business logic, particularly Google Sheets integration
- `backend/models/` - MongoDB schemas for admins and events
- `backend/middlewares/` - Auth and validation middlewares
- `backend/routes/` - API route definitions

Key Features:
- JWT-based authentication
- Google Sheets API integration for QR code storage
- MongoDB for event and admin data
- Bulk QR code generation capability

### Frontend (React/Vite)
- Single-page application for QR code management
- QR code scanning functionality via device camera
- Event management interface
- Admin authentication flows

### Infrastructure
- Nginx reverse proxy
- MongoDB database
- Docker containerization
- SSL/TLS encryption

Critical Dependencies:
- Google Service Account credentials required for Sheets API
- MongoDB connection
- JWT secret for authentication