# Production Deployment Guide

**Avon Health RAG System - HIPAA-Compliant Ollama Deployment**

This guide provides step-by-step instructions for deploying the Ollama-based RAG system to production.

---

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Ollama Installation](#ollama-installation)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [Monitoring](#monitoring)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling](#scaling)
10. [Security Hardening](#security-hardening)
11. [Troubleshooting](#troubleshooting)

---

## Server Requirements

### Minimum Hardware Specifications

**For CPU-Only Deployment (Development/Testing)**:
- **CPU**: 8 cores (Intel Xeon or AMD EPYC)
- **RAM**: 16 GB
- **Disk**: 100 GB SSD
- **Network**: 1 Gbps

**Performance**: Expect 20-40s LLM response times, 2-5s embedding generation.

**For GPU-Accelerated Deployment (Production Recommended)**:
- **CPU**: 8 cores (Intel Xeon or AMD EPYC)
- **RAM**: 32 GB
- **GPU**: NVIDIA GPU with 8+ GB VRAM (RTX 3060 Ti or better)
  - Recommended: RTX 4090 (24 GB), A100 (40 GB), or H100
- **Disk**: 200 GB NVMe SSD
- **Network**: 1 Gbps

**Performance**: Expect 2-5s LLM response times, 100-200ms embedding generation.

### Recommended Production Specifications

**Single-Server Production**:
- **CPU**: 16 cores (Intel Xeon Gold or AMD EPYC)
- **RAM**: 64 GB ECC
- **GPU**: NVIDIA A40 (48 GB) or A100 (40 GB)
- **Disk**: 500 GB NVMe SSD (RAID 1)
- **Network**: 10 Gbps

**High-Availability Production**:
- **3x Application Servers** (specs above)
- **Load Balancer** (nginx or HAProxy)
- **Dedicated PostgreSQL Server** (32 GB RAM, 500 GB SSD)
- **Monitoring Server** (Prometheus + Grafana)

### Operating System Requirements

**Recommended**: Ubuntu Server 22.04 LTS

**Also Supported**:
- Ubuntu 20.04 LTS
- Debian 11
- CentOS 8 Stream
- Red Hat Enterprise Linux 8+

**Requirements**:
- 64-bit OS
- systemd init system
- CUDA 11.8+ (for GPU acceleration)

### Network Requirements

**Inbound Ports**:
- `443` (HTTPS) - Frontend + API
- `80` (HTTP) - Redirect to HTTPS
- `22` (SSH) - Server management (restrict to admin IPs)

**Outbound Ports**:
- `443` (HTTPS) - Avon Health API
- `5432` (PostgreSQL) - If using external database

**Internal Ports**:
- `3001` - Backend API (not exposed publicly)
- `11434` - Ollama API (localhost only)

### Security Considerations

**HIPAA Requirements**:
- ✅ No PHI transmitted to external services
- ✅ All AI processing local (Ollama)
- ✅ Encrypted at rest (disk encryption)
- ✅ Encrypted in transit (TLS 1.3)
- ✅ Access logging and audit trails
- ✅ Role-based access control
- ✅ Automatic session timeout

**Server Hardening**:
- Firewall (ufw or iptables)
- Fail2ban for SSH protection
- SELinux or AppArmor
- Automatic security updates
- Regular vulnerability scanning

---

## Pre-Deployment Checklist

Before deployment, ensure you have:

- [ ] Production server with required specifications
- [ ] Ubuntu 22.04 LTS installed
- [ ] Root or sudo access
- [ ] Domain name configured (DNS)
- [ ] SSL/TLS certificate (Let's Encrypt or commercial)
- [ ] Avon Health API credentials (client ID + secret)
- [ ] PostgreSQL database (local or managed)
- [ ] Backup storage solution
- [ ] Monitoring infrastructure
- [ ] Incident response plan

---

## Ollama Installation

### Step 1: Install Ollama

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Verify installation
ollama --version
```

### Step 2: Configure Ollama as System Service

Create systemd service file:

```bash
sudo nano /etc/systemd/system/ollama.service
```

Add the following content:

```ini
[Unit]
Description=Ollama Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ollama
Group=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_NUM_THREADS=8"

# GPU Configuration (if available)
# Environment="OLLAMA_GPU_LAYERS=35"
# Environment="OLLAMA_MAX_VRAM=16"

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/ollama

[Install]
WantedBy=multi-user.target
```

Create ollama user:

```bash
# Create system user
sudo useradd -r -s /bin/false -d /var/lib/ollama -m ollama

# Set permissions
sudo mkdir -p /var/lib/ollama
sudo chown -R ollama:ollama /var/lib/ollama
```

Enable and start service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable ollama

# Start service
sudo systemctl start ollama

# Check status
sudo systemctl status ollama
```

### Step 3: Download Production Models

```bash
# Download Meditron (Medical LLM)
ollama pull meditron

# Download nomic-embed-text (Embeddings)
ollama pull nomic-embed-text

# Verify models
ollama list
```

Expected output:
```
NAME                    ID              SIZE    MODIFIED
meditron:latest         abc123def456    4.1 GB  3 minutes ago
nomic-embed-text:latest xyz789ghi012    274 MB  2 minutes ago
```

### Step 4: Test Ollama

```bash
# Test LLM
ollama run meditron "What is diabetes?"

# Test embedding API
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test"
}'
```

### Step 5: Configure GPU (If Available)

**For NVIDIA GPUs**:

```bash
# Install NVIDIA drivers
sudo apt install -y nvidia-driver-535

# Install CUDA toolkit
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt update
sudo apt install -y cuda-toolkit-11-8

# Verify GPU
nvidia-smi

# Restart Ollama
sudo systemctl restart ollama

# Verify GPU usage
ollama run meditron "test"
nvidia-smi  # Should show GPU utilization
```

---

## Backend Deployment

### Step 1: Install Node.js 18+

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x or higher
npm --version
```

### Step 2: Create Application User

```bash
# Create app user
sudo useradd -r -s /bin/bash -d /opt/avon-health -m avonhealth

# Create directories
sudo mkdir -p /opt/avon-health/{backend,frontend,logs}
sudo chown -R avonhealth:avonhealth /opt/avon-health
```

### Step 3: Deploy Backend Code

```bash
# Switch to app user
sudo su - avonhealth

# Clone or copy backend code
cd /opt/avon-health/backend
# (Copy your backend code here)

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build
```

### Step 4: Configure Environment

```bash
# Create production environment file
cd /opt/avon-health/backend
nano .env
```

Add the following configuration:

```env
# ============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Avon Health RAG System
# ============================================================================

# Server Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Avon Health API
AVON_CLIENT_ID=your_production_client_id
AVON_CLIENT_SECRET=your_production_client_secret
AVON_BASE_URL=https://api.avonhealth.com

# AI Provider (Ollama - HIPAA Compliant)
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=meditron
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.1

# Vector Database (FAISS)
VECTOR_DB_TYPE=faiss
FAISS_DIMENSION=768
FAISS_INDEX_PATH=./data/faiss

# PostgreSQL (Metadata)
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=avon_health_rag
PG_USER=avonhealth
PG_PASSWORD=secure_password_here

# Cache Configuration
CACHE_ENABLED=true
CACHE_EMBEDDING_TTL=300000
CACHE_QUERY_RESULTS_TTL=300000
CACHE_PATIENT_INDEX_TTL=1800000

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Security**: Set strict file permissions:

```bash
chmod 600 .env
chown avonhealth:avonhealth .env
```

### Step 5: Set Up Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Switch to app user
sudo su - avonhealth
cd /opt/avon-health/backend

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [{
    name: 'avon-health-backend',
    script: 'dist/index.js',
    cwd: '/opt/avon-health/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/opt/avon-health/logs/backend-error.log',
    out_file: '/opt/avon-health/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
  }],
};
```

Start backend with PM2:

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 auto-start
sudo pm2 startup systemd -u avonhealth --hp /opt/avon-health

# Check status
pm2 status
pm2 logs
```

### Step 6: Verify Backend

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected: {"status":"ok"}
```

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
# On development machine or CI/CD
cd frontend
npm ci
npm run build

# Transfer dist/ directory to production server
scp -r dist/ avonhealth@your-server:/opt/avon-health/frontend/
```

### Step 2: Install nginx

```bash
# Install nginx
sudo apt install -y nginx

# Verify installation
nginx -v
```

### Step 3: Configure nginx

Create nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/avon-health
```

Add the following:

```nginx
# Avon Health RAG System - nginx Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Frontend (React)
    root /opt/avon-health/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/avon-health-access.log;
    error_log /var/log/nginx/avon-health-error.log;
}
```

Enable site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/avon-health /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: Set Up SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

Certbot will automatically configure nginx for HTTPS and set up auto-renewal.

### Step 5: Verify Frontend

```bash
# Test HTTPS
curl https://yourdomain.com

# Check SSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## Database Setup

### Step 1: Install PostgreSQL

```bash
# Install PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-contrib-14

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database and User

```bash
# Switch to postgres user
sudo su - postgres

# Create database and user
psql << EOF
-- Create database
CREATE DATABASE avon_health_rag;

-- Create user
CREATE USER avonhealth WITH ENCRYPTED PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE avon_health_rag TO avonhealth;

-- Connect to database
\c avon_health_rag

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO avonhealth;
EOF

# Exit postgres user
exit
```

### Step 3: Initialize Database Schema

```bash
# Switch to app user
sudo su - avonhealth
cd /opt/avon-health/backend

# Run database migrations (if available)
# npm run db:migrate

# Or manually create schema
psql -h localhost -U avonhealth -d avon_health_rag < schema.sql
```

### Step 4: Configure PostgreSQL for Production

Edit PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Recommended settings:

```conf
# Memory Configuration
shared_buffers = 4GB                  # 25% of RAM
effective_cache_size = 12GB           # 75% of RAM
maintenance_work_mem = 1GB
work_mem = 64MB

# Connection Configuration
max_connections = 200

# Performance
random_page_cost = 1.1                # For SSD
effective_io_concurrency = 200        # For SSD

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_duration = off
log_statement = 'none'
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## Monitoring

### Step 1: Health Check Endpoints

The backend exposes health check endpoints:

```bash
# Application health
curl http://localhost:3001/health

# Ollama health (internal)
curl http://localhost:11434/api/tags
```

### Step 2: Set Up Prometheus

```bash
# Install Prometheus
sudo apt install -y prometheus

# Configure Prometheus
sudo nano /etc/prometheus/prometheus.yml
```

Add scrape configuration:

```yaml
scrape_configs:
  - job_name: 'avon-health-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
```

Restart Prometheus:

```bash
sudo systemctl restart prometheus
```

### Step 3: Set Up Grafana

```bash
# Install Grafana
sudo apt install -y apt-transport-https software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

sudo apt update
sudo apt install -y grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

Access Grafana at `http://your-server:3000` (default credentials: admin/admin).

### Step 4: Log Aggregation

Use PM2 for log management:

```bash
# View logs
pm2 logs avon-health-backend

# Rotate logs
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Step 5: Error Tracking

Consider integrating error tracking:

- **Sentry** (recommended for production)
- **Rollbar**
- **Custom logging to file + log rotation**

### Step 6: Performance Monitoring

Monitor key metrics:

- **Request latency** (p50, p95, p99)
- **Embedding generation time**
- **LLM response time**
- **Cache hit rate**
- **Memory usage**
- **CPU usage**
- **Disk I/O**
- **Network throughput**

---

## Backup & Recovery

### Step 1: Vector Index Backups

```bash
# Create backup script
sudo nano /opt/avon-health/scripts/backup-faiss.sh
```

Add the following:

```bash
#!/bin/bash
# FAISS Vector Index Backup Script

BACKUP_DIR="/opt/backups/faiss"
SOURCE_DIR="/opt/avon-health/backend/data/faiss"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="faiss_index_${DATE}.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" -C "$(dirname $SOURCE_DIR)" "$(basename $SOURCE_DIR)"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "faiss_index_*.tar.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}"
```

Make executable and schedule:

```bash
chmod +x /opt/avon-health/scripts/backup-faiss.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/avon-health/scripts/backup-faiss.sh
```

### Step 2: Database Backups

```bash
# Create database backup script
sudo nano /opt/avon-health/scripts/backup-postgres.sh
```

Add the following:

```bash
#!/bin/bash
# PostgreSQL Backup Script

BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="avon_health_rag_${DATE}.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U avonhealth avon_health_rag | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "avon_health_rag_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: ${BACKUP_FILE}"
```

Make executable and schedule:

```bash
chmod +x /opt/avon-health/scripts/backup-postgres.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/avon-health/scripts/backup-postgres.sh
```

### Step 3: Application Code Backups

Use version control (Git) for code backups:

```bash
# Initialize git repository (if not already)
cd /opt/avon-health
git init
git remote add origin your-git-repo-url

# Tag releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### Step 4: Disaster Recovery Plan

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 24 hours

**Recovery Steps**:

1. **Provision new server** (30 min)
2. **Install OS and dependencies** (30 min)
3. **Install Ollama and download models** (30 min)
4. **Restore application code from Git** (15 min)
5. **Restore database from backup** (30 min)
6. **Restore FAISS index from backup** (30 min)
7. **Configure and test** (1 hour)
8. **Update DNS** (15 min)

**Test Recovery**: Quarterly disaster recovery drills

---

## Scaling

### Horizontal Scaling (Multiple Ollama Instances)

For high-traffic production environments:

**Architecture**:
```
                      ┌──────────────┐
                      │ Load Balancer│
                      │   (nginx)    │
                      └──────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼────┐   ┌─────▼────┐   ┌────▼─────┐
        │ Backend 1│   │ Backend 2│   │ Backend 3│
        │ + Ollama │   │ + Ollama │   │ + Ollama │
        └──────────┘   └──────────┘   └──────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                     ┌───────▼────────┐
                     │   PostgreSQL   │
                     │    (Shared)    │
                     └────────────────┘
```

### Load Balancer Configuration

```bash
sudo nano /etc/nginx/nginx.conf
```

Add upstream configuration:

```nginx
upstream avon_health_backend {
    least_conn;
    server 10.0.1.10:3001 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3001 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3001 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration...

    location /api/ {
        proxy_pass http://avon_health_backend;
        # Proxy headers...
    }
}
```

### Caching Strategies

**Application-Level Caching** (already implemented):
- Embedding cache (TTL: 5 min, LRU eviction)
- Query results cache (TTL: 5 min)
- Patient index cache (TTL: 30 min)

**nginx Caching** (for API responses):

```nginx
# Add to nginx configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/public/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_bypass $http_cache_control;
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://avon_health_backend;
}
```

**Redis Caching** (optional, for distributed caching):

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 2gb
# Set: maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
```

### Database Read Replicas

For read-heavy workloads, set up PostgreSQL replication:

```bash
# On primary server
sudo nano /etc/postgresql/14/main/postgresql.conf
# Add: wal_level = replica
# Add: max_wal_senders = 3

# Create replication user
sudo -u postgres psql
CREATE ROLE replicator WITH REPLICATION PASSWORD 'replica_password' LOGIN;

# Configure pg_hba.conf for replication
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host replication replicator replica-server-ip/32 md5
```

---

## Security Hardening

### Step 1: Firewall Configuration

```bash
# Install ufw
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (restrict to admin IPs)
sudo ufw allow from your-admin-ip to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Step 2: Fail2ban for SSH Protection

```bash
# Install Fail2ban
sudo apt install -y fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

Add:

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
```

Start Fail2ban:

```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Step 3: Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades

# Enable automatic updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

### Step 4: Audit Logging

Enable comprehensive audit logging:

```bash
# Install auditd
sudo apt install -y auditd

# Configure audit rules
sudo nano /etc/audit/rules.d/audit.rules
```

Add:

```bash
# Log file access
-w /opt/avon-health/backend/.env -p wa -k env_config
-w /opt/avon-health/backend/data/ -p wa -k data_access

# Log authentication
-w /var/log/auth.log -p wa -k auth_log
```

Start auditd:

```bash
sudo systemctl start auditd
sudo systemctl enable auditd
```

### Step 5: Regular Security Scanning

```bash
# Install vulnerability scanner
sudo apt install -y lynis

# Run security audit
sudo lynis audit system
```

---

## Troubleshooting

### Common Issues

**Issue**: Backend fails to start
- Check PM2 logs: `pm2 logs`
- Verify Ollama is running: `sudo systemctl status ollama`
- Check environment variables: `cat .env`
- Test database connection: `psql -h localhost -U avonhealth -d avon_health_rag`

**Issue**: Slow LLM responses
- Check GPU utilization: `nvidia-smi`
- Verify GPU is being used by Ollama
- Check system resources: `htop`
- Review Ollama configuration (OLLAMA_NUM_THREADS, OLLAMA_GPU_LAYERS)

**Issue**: nginx 502 Bad Gateway
- Check backend is running: `pm2 status`
- Verify backend port: `curl http://localhost:3001/health`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

**Issue**: High memory usage
- Check Ollama memory: `ps aux | grep ollama`
- Review OLLAMA_MAX_LOADED_MODELS setting
- Consider using smaller model quantization
- Monitor with: `free -h` and `htop`

### Logs Location

- **Backend**: `/opt/avon-health/logs/backend-*.log`
- **nginx**: `/var/log/nginx/avon-health-*.log`
- **PostgreSQL**: `/var/log/postgresql/postgresql-*.log`
- **Ollama**: `sudo journalctl -u ollama -f`
- **PM2**: `pm2 logs`

### Support Resources

- **Documentation**: See `backend/TROUBLESHOOTING.md`
- **Deployment Checklist**: Verify all components before deploying
- **Ollama Docs**: https://github.com/jmorganca/ollama
- **System Status**: `pm2 status`, `sudo systemctl status ollama nginx postgresql`

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Ollama is running and models are loaded
- [ ] Backend is running (PM2 status)
- [ ] Frontend is accessible via HTTPS
- [ ] Health check endpoint responds
- [ ] SSL certificate is valid
- [ ] Database is accessible
- [ ] FAISS index is initialized
- [ ] Test complete RAG pipeline (`npx tsx scripts/final-ollama-test.ts`)
- [ ] Monitoring is configured (Prometheus + Grafana)
- [ ] Backups are scheduled
- [ ] Firewall is configured
- [ ] Security hardening is complete
- [ ] Logs are being collected
- [ ] Performance is acceptable (< 5s LLM response)
- [ ] HIPAA compliance verified (local processing only)

---

**Deployment Complete** 🎉

Your Avon Health RAG system is now deployed and ready for production use with HIPAA-compliant local AI processing.

For ongoing maintenance, refer to:
- `backend/IMPLEMENTATION.md` - Implementation guide
- `backend/TROUBLESHOOTING.md` - Troubleshooting guide

**Last Updated**: November 4, 2025
