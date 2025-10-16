# Docker Architecture Requirements

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