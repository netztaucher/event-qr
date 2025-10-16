# 📊 Project Status: QR Event Ticket System

## 🚧 Current Issues

### 1. Frontend Serving Issues (404 Errors)
- Frontend app returns 404 when accessing `/qr/`
- Static files are not being served correctly
- SPA routing fallback not working
- Current nginx error: `open() "/app/frontend/dist/qr/index.html" failed (2: No such file or directory)`

### 2. Infrastructure Issues
- SSH connection to server is unstable (frequent disconnects)
- Server performance needs monitoring during deployments

### 3. Configuration Chain Problems
- Multiple nginx configurations in play:
  - Plesk nginx (external)
  - Container nginx (internal)
  - Path mapping confusion between `/qr/` and static files

### 4. Deployment Workflow
- No automated deployment process
- Manual configuration changes required in multiple places
- No rollback procedure defined

### Frontend Serving Issues
The frontend application under `/qr/` is currently not being served correctly. The following configuration needs to be implemented and tested:

```nginx
# Handle all routes under /qr/
location /qr/ {
    # Try static files first
    try_files $uri @qr_backend;

    # Cache settings for static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # No caching for HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, must-revalidate";
    }
}

# Proxy all unmatched requests to backend
location @qr_backend {
    proxy_pass http://127.0.0.1:7085;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

This configuration will:
1. Try to serve static files first
2. Forward all other requests to the backend
3. Implement proper caching for static assets
4. Use try_files for clean fallback handling

## ✅ Working Features
- Backend health check (`/qr/health`) responds correctly
- Docker containers are running and healthy
- Environment variables are correctly set
- Database connection is working

## 📝 Next Steps

### Frontend Fixes (Priority)
1. Implement and test the updated nginx configuration
2. Fix static file serving path issues:
   - Verify correct path mapping in container
   - Ensure frontend files are in correct location
   - Test static asset loading
3. Implement and test SPA routing fallback

### Infrastructure Improvements
1. Implement SSH connection retry logic
2. Set up server monitoring:
   - Resource usage during deployments
   - Error log aggregation
   - Performance metrics

### Configuration Management
1. Document and streamline nginx configuration chain:
   - Plesk → Container relationship
   - Path mapping documentation
   - Configuration precedence rules

### Deployment Process
1. Create automated deployment script
2. Implement configuration backup procedure
3. Define and document rollback process
4. Add deployment health checks

## 🔄 Recent Changes
- Updated backend to serve frontend files under `/qr/`
- Fixed port configuration (80 instead of 5000)
- Implemented health check endpoint
- Added proper nginx proxy configuration

## 📌 Notes
- SSH connection to the server is unstable - consider implementing retry logic
- Monitor server performance during deployment
- Document deployment process once stable

## 🎯 Next Deployment
When implementing the new nginx configuration:
1. Back up current configuration
2. Apply new configuration in Plesk
3. Verify all endpoints
4. Monitor error logs for any issues