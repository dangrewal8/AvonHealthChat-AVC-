# Docker Deployment Guide

Complete guide for running the Avon Health backend using Docker.

## Quick Start

```bash
# 1. Create environment file
cp .env.example .env
# Edit .env with your API credentials

# 2. Build and run with Docker Compose
docker-compose up

# 3. Verify health
curl http://localhost:3001/health
```

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Image](#building-the-image)
- [Running with Docker](#running-with-docker)
- [Running with Docker Compose](#running-with-docker-compose)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Logging](#logging)
- [Volumes & Data Persistence](#volumes--data-persistence)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- Avon Health API credentials

---

## Building the Image

### Build with Docker

```bash
# Build the image
docker build -t avonhealth-backend:latest .

# View built image
docker images | grep avonhealth-backend
```

### Build with Docker Compose

```bash
# Build the image
docker-compose build

# Build without cache
docker-compose build --no-cache
```

### Multi-stage Build Details

The Dockerfile uses a multi-stage build for optimization:

1. **Builder stage**: Installs all dependencies and builds TypeScript
2. **Production stage**: Copies only built files and production dependencies

Benefits:
- Smaller image size (~150MB vs ~300MB)
- Faster deployment
- More secure (no dev dependencies)

---

## Running with Docker

### Basic Usage

```bash
docker run -p 3001:3001 \
  -e PORT=3001 \
  -e AVON_CLIENT_ID=your_client_id \
  -e AVON_CLIENT_SECRET=your_secret \
  -e OPENAI_KEY=your_openai_key \
  avonhealth-backend:latest
```

### With Environment File

```bash
docker run -p 3001:3001 \
  --env-file .env \
  avonhealth-backend:latest
```

### Detached Mode

```bash
docker run -d \
  --name avonhealth-backend \
  -p 3001:3001 \
  --env-file .env \
  avonhealth-backend:latest

# View logs
docker logs -f avonhealth-backend

# Stop container
docker stop avonhealth-backend

# Remove container
docker rm avonhealth-backend
```

### Interactive Mode (for debugging)

```bash
docker run -it \
  --name avonhealth-backend \
  -p 3001:3001 \
  --env-file .env \
  avonhealth-backend:latest sh

# Inside container
ls -la
cat package.json
node healthcheck.js
```

---

## Running with Docker Compose

### Start Services

```bash
# Start in foreground
docker-compose up

# Start in background
docker-compose up -d

# Start and rebuild
docker-compose up --build
```

### Stop Services

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Check Status

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats avonhealth-backend
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

---

## Environment Variables

### Required Variables

```bash
# Avon Health API (Required)
AVON_CLIENT_ID=your_client_id_here
AVON_CLIENT_SECRET=your_client_secret_here
AVON_BASE_URL=https://demo-api.avonhealth.com

# OpenAI (Required)
OPENAI_KEY=your_openai_key_here
```

### Server Configuration

```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0  # Important for Docker!
```

### CORS Configuration

```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true
```

### Optional Variables

See `.env.example` for all available variables.

---

## Health Checks

### Docker Health Check

The container includes automatic health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' avonhealth-backend

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' avonhealth-backend
```

Health check configuration:
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start period**: 5 seconds (grace period)
- **Retries**: 3

### Manual Health Check

```bash
# From host
curl http://localhost:3001/health

# From inside container
docker exec avonhealth-backend node healthcheck.js
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "uptime": 123.45
}
```

---

## Logging

### View Logs

```bash
# Docker
docker logs -f avonhealth-backend

# Docker Compose
docker-compose logs -f backend
```

### Log Configuration

Logs are written to stdout/stderr and collected by Docker.

Configure log driver in `docker-compose.yml`:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### External Log Aggregation

Forward logs to external services:

```yaml
logging:
  driver: "syslog"
  options:
    syslog-address: "tcp://logs.example.com:514"
```

Or use fluentd, gelf, etc.

---

## Volumes & Data Persistence

### Persistent Data

Uncomment volume mounts in `docker-compose.yml`:

```yaml
volumes:
  # FAISS index persistence
  - ./data:/app/data

  # Logs persistence
  - ./logs:/app/logs

  # Or use named volumes
  - backend-data:/app/data
```

### Named Volumes

```yaml
volumes:
  backend-data:
    driver: local
```

Create and manage volumes:

```bash
# Create volume
docker volume create backend-data

# List volumes
docker volume ls

# Inspect volume
docker volume inspect backend-data

# Remove volume
docker volume rm backend-data
```

---

## Production Deployment

### Security Best Practices

1. **Use non-root user** (already configured in Dockerfile)
2. **Scan for vulnerabilities**:
   ```bash
   docker scan avonhealth-backend:latest
   ```

3. **Use secrets management**:
   ```bash
   # Docker secrets (Swarm mode)
   docker secret create api_token -
   ```

4. **Enable read-only filesystem**:
   ```yaml
   read_only: true
   tmpfs:
     - /tmp
   ```

5. **Drop capabilities**:
   ```yaml
   cap_drop:
     - ALL
   cap_add:
     - NET_BIND_SERVICE
   ```

### Resource Limits

Configure in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Restart Policies

```yaml
restart: unless-stopped  # Recommended for production
# or
restart: always
```

### Reverse Proxy

Use nginx or traefik for SSL termination:

```yaml
# nginx example
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs avonhealth-backend

# Common issues:
# - Missing environment variables
# - Port already in use
# - Build errors
```

### Health Check Failing

```bash
# Run health check manually
docker exec avonhealth-backend node healthcheck.js

# Common issues:
# - Application not listening on correct port
# - /health endpoint not responding
# - Network issues
```

### High Memory Usage

```bash
# Check memory usage
docker stats avonhealth-backend

# Increase memory limit in docker-compose.yml
limits:
  memory: 1G
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Or use different port
docker run -p 3002:3001 ...
```

### Build Errors

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t avonhealth-backend .
```

### Container Keeps Restarting

```bash
# Check exit code
docker inspect avonhealth-backend --format='{{.State.ExitCode}}'

# Common exit codes:
# 0 - Success (shouldn't restart)
# 1 - General error
# 137 - Out of memory (killed by OOM)
# 139 - Segmentation fault
```

### Network Issues

```bash
# Test connectivity from inside container
docker exec avonhealth-backend curl https://demo-api.avonhealth.com

# Check network
docker network ls
docker network inspect avonhealth-network
```

---

## Advanced Configuration

### Multi-Container Setup

Example with PostgreSQL:

```yaml
services:
  backend:
    # ...
    depends_on:
      - postgres
    environment:
      - PG_HOST=postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

### Development vs Production

Create multiple compose files:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**docker-compose.dev.yml**:
```yaml
services:
  backend:
    volumes:
      - ./src:/app/src
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
```

**docker-compose.prod.yml**:
```yaml
services:
  backend:
    restart: always
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build image
        run: docker build -t avonhealth-backend:${{ github.sha }} .

      - name: Test image
        run: |
          docker run -d --name test -p 3001:3001 \
            -e AVON_CLIENT_ID=${{ secrets.AVON_CLIENT_ID }} \
            -e AVON_CLIENT_SECRET=${{ secrets.AVON_CLIENT_SECRET }} \
            -e OPENAI_KEY=${{ secrets.OPENAI_KEY }} \
            avonhealth-backend:${{ github.sha }}

          sleep 10
          curl http://localhost:3001/health

          docker logs test
          docker stop test

      - name: Push to registry
        run: |
          docker tag avonhealth-backend:${{ github.sha }} registry.example.com/avonhealth-backend:latest
          docker push registry.example.com/avonhealth-backend:latest
```

---

## Commands Reference

```bash
# Build
docker build -t avonhealth-backend .
docker-compose build

# Run
docker run -p 3001:3001 --env-file .env avonhealth-backend
docker-compose up -d

# Logs
docker logs -f avonhealth-backend
docker-compose logs -f backend

# Shell access
docker exec -it avonhealth-backend sh

# Health check
docker inspect --format='{{.State.Health.Status}}' avonhealth-backend

# Stop
docker stop avonhealth-backend
docker-compose stop

# Remove
docker rm avonhealth-backend
docker-compose down

# Clean up
docker system prune -a
docker volume prune
```

---

## Support

- **Documentation**: See `PROMPT_76_IMPLEMENTATION.md`
- **Issues**: Report at GitHub issues
- **Docker Docs**: https://docs.docker.com/

---

**Last Updated**: 2025-10-27
