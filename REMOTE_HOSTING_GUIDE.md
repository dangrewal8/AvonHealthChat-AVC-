# Avon Health RAG System - Remote Hosting Migration Guide

**Guide for deploying the RAG system to a remote server with public access**

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Options](#deployment-options)
3. [AWS Deployment](#aws-deployment)
4. [Security Considerations](#security-considerations)
5. [Domain & SSL Setup](#domain--ssl-setup)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

This guide covers migrating from the local demo to a production-ready remote deployment.

### Key Differences: Local vs Remote

| Aspect | Local Demo | Remote Hosting |
|--------|------------|----------------|
| **Access** | localhost only | Public internet |
| **Security** | Minimal | HTTPS, auth, firewall |
| **Secrets** | .env files | Environment variables/secrets manager |
| **Ollama** | Host machine | Docker container or separate server |
| **Domain** | localhost | yourdomain.com |
| **Monitoring** | Manual | Automated monitoring |
| **Backups** | Manual | Automated backups |

---

## Deployment Options

### Option 1: AWS EC2 (Recommended)

**Pros:**
- Full control over server
- Can run Ollama with GPU support
- Easy to scale
- Well-documented

**Cons:**
- Requires server management
- Higher cost (~$80-150/month)

**Best for:** Production deployments, HIPAA compliance needs

### Option 2: AWS Lightsail

**Pros:**
- Simpler than EC2
- Fixed pricing
- Easier setup

**Cons:**
- Limited scaling options
- No GPU support

**Best for:** Small-scale deployments, prototypes

### Option 3: Digital Ocean Droplet

**Pros:**
- Simple pricing
- Good documentation
- Easy to use

**Cons:**
- Fewer options than AWS
- No managed secrets service

**Best for:** Simpler deployments, cost-conscious projects

---

## AWS Deployment

### Prerequisites

1. AWS Account
2. Domain name (optional but recommended)
3. SSH key pair
4. Basic AWS knowledge

### Step 1: Launch EC2 Instance

```bash
# Instance specifications:
Instance Type: t3.large (2 vCPU, 8GB RAM) minimum
              t3.xlarge (4 vCPU, 16GB RAM) recommended
              g4dn.xlarge (with GPU) for best performance

AMI: Ubuntu Server 24.04 LTS
Storage: 50GB SSD minimum, 100GB recommended
Security Group: Custom (see below)
```

**Security Group Rules:**

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| SSH | TCP | 22 | Your IP | Remote access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom | TCP | 3001 | 0.0.0.0/0 | API (optional, if not behind reverse proxy) |

### Step 2: Connect to Instance

```bash
# Download your .pem key from AWS
chmod 400 your-key.pem

# Connect
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull meditron
ollama pull nomic-embed-text

# Start Ollama as service
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Step 4: Deploy Application

```bash
# Clone or upload your code
# (Upload via scp or use git)

# Upload code from local machine
scp -i your-key.pem -r /home/dangr/Avonhealthtest ubuntu@your-ec2-ip:/home/ubuntu/

# On EC2 instance
cd /home/ubuntu/Avonhealthtest

# Start services
./start-demo.sh
```

### Step 5: Setup Reverse Proxy (Nginx)

For production, use Nginx on the host to:
- Handle SSL/TLS
- Add authentication
- Rate limiting
- Load balancing

```bash
# Install Nginx on host
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/avonhealth
```

**Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/avonhealth

upstream frontend {
    server localhost:80;
}

upstream backend {
    server localhost:3001;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/avonhealth /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure SSL in Nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Security Considerations

### 1. Environment Variables

**Never commit secrets to git!**

Use AWS Systems Manager Parameter Store or Secrets Manager:

```bash
# Store secrets in AWS Parameter Store
aws ssm put-parameter \
    --name "/avonhealth/prod/avon-client-secret" \
    --value "your-secret-here" \
    --type "SecureString"

# Update docker-compose.yml to pull from Parameter Store
# Or use ECS Task Definitions with secrets
```

### 2. Authentication

Add authentication to the frontend:

```nginx
# In Nginx config
location / {
    auth_basic "Avon Health RAG System";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    proxy_pass http://frontend;
    # ... rest of config
}
```

```bash
# Create password file
sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

### 3. API Key Protection

Add API key requirement for backend:

**Backend .env.production:**
```bash
API_KEY=your-secure-random-key-here
```

**Frontend requests:**
```typescript
// Add to API calls
headers: {
  'X-API-Key': 'your-secure-random-key-here'
}
```

### 4. Firewall Rules

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to backend (if using Nginx proxy)
# Only allow from localhost
sudo ufw deny 3001/tcp
```

### 5. HIPAA Compliance

For HIPAA compliance:
- ✅ Use encrypted connections (HTTPS)
- ✅ Keep Ollama local (no cloud AI APIs)
- ✅ Enable audit logging
- ✅ Regular security updates
- ✅ Access controls and authentication
- ✅ Data encryption at rest
- ✅ Regular backups with encryption

---

## Domain & SSL Setup

### Option 1: Using Route 53 (AWS)

```bash
# 1. Register domain in Route 53 or transfer existing domain
# 2. Create hosted zone
# 3. Add A record pointing to EC2 Elastic IP

# Get Elastic IP (so it doesn't change)
aws ec2 allocate-address --domain vpc

# Associate with instance
aws ec2 associate-address \
    --instance-id i-1234567890abcdef0 \
    --allocation-id eipalloc-12345678
```

### Option 2: Using External Domain Provider

1. Point A record to EC2 public IP
2. Wait for DNS propagation (up to 48 hours)
3. Run certbot for SSL

---

## Environment Configuration

### Production Environment Files

**backend/.env.production:**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Avon Health API
AVON_CLIENT_ID=${AVON_CLIENT_ID}  # From AWS Secrets Manager
AVON_CLIENT_SECRET=${AVON_CLIENT_SECRET}
AVON_BASE_URL=https://demo-api.avonhealth.com
AVON_ACCOUNT=prosper
AVON_USER_ID=${AVON_USER_ID}

# Ollama (running on host or separate container)
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=meditron

# Security
API_KEY=${API_KEY}  # Generate strong random key
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env.production:**
```bash
VITE_API_BASE_URL=https://yourdomain.com
VITE_APP_NAME=Avon Health RAG System
VITE_APP_VERSION=1.0.0
```

### Using Docker Compose with Secrets

```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - AVON_CLIENT_SECRET=${AVON_CLIENT_SECRET}
      - API_KEY=${API_KEY}
    secrets:
      - avon_client_secret
      - api_key

secrets:
  avon_client_secret:
    external: true
  api_key:
    external: true
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] EC2 instance launched and configured
- [ ] Security group rules configured
- [ ] Elastic IP allocated and associated
- [ ] Domain DNS configured (if using custom domain)
- [ ] SSL certificate obtained
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Backup strategy defined

### Deployment

- [ ] Code uploaded to server
- [ ] Environment variables configured
- [ ] Ollama installed and models downloaded
- [ ] Docker containers built and started
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall rules configured

### Post-Deployment

- [ ] Health checks passing
- [ ] SSL certificate valid and auto-renewing
- [ ] Monitoring configured
- [ ] Backups running
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Documentation updated

### Testing

- [ ] Can access frontend via HTTPS
- [ ] API queries work correctly
- [ ] Authentication working (if implemented)
- [ ] Rate limiting working
- [ ] Error handling working
- [ ] Logs being captured

---

## Monitoring & Maintenance

### CloudWatch (AWS)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure to monitor:
# - CPU usage
# - Memory usage
# - Disk usage
# - Docker container health
# - Application logs
```

### Automated Backups

```bash
# Backup script
#!/bin/bash
# /home/ubuntu/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"

# Backup FAISS index
tar -czf $BACKUP_DIR/faiss_$DATE.tar.gz \
    /home/ubuntu/Avonhealthtest/backend/data

# Upload to S3
aws s3 cp $BACKUP_DIR/faiss_$DATE.tar.gz \
    s3://your-backup-bucket/faiss/

# Keep only last 7 days
find $BACKUP_DIR -name "faiss_*.tar.gz" -mtime +7 -delete

# Add to crontab:
# 0 2 * * * /home/ubuntu/backup.sh
```

### Updates

```bash
# Create update script
#!/bin/bash
# /home/ubuntu/update.sh

cd /home/ubuntu/Avonhealthtest

# Pull latest code
git pull

# Rebuild containers
docker-compose build

# Restart with zero downtime
docker-compose up -d

# Clean up old images
docker image prune -f
```

---

## Cost Estimation

### AWS Monthly Costs

| Service | Configuration | Cost |
|---------|--------------|------|
| EC2 t3.large | 24/7 | ~$60 |
| EBS Storage | 100GB SSD | ~$10 |
| Data Transfer | 100GB/month | ~$9 |
| Route 53 | 1 hosted zone | ~$0.50 |
| Elastic IP | 1 address | Free (if associated) |
| **Total** | | **~$80/month** |

For better performance with GPU:
- g4dn.xlarge: ~$400/month

---

## Migration from Local to Remote

1. **Test locally first**: Ensure everything works on local demo
2. **Set up remote server**: Launch EC2, install dependencies
3. **Upload code**: Use git or scp
4. **Configure secrets**: Move from .env to Secrets Manager
5. **Update configuration**: Change domains, enable security
6. **Deploy**: Run deployment scripts
7. **Test thoroughly**: Verify all functionality
8. **Monitor**: Watch logs and metrics
9. **Optimize**: Adjust resources as needed

---

## Rollback Plan

If deployment fails:

```bash
# Keep previous version
cp -r Avonhealthtest Avonhealthtest.backup

# To rollback
cd Avonhealthtest.backup
./start-demo.sh

# Or use git
git checkout previous-stable-tag
docker-compose up --build -d
```

---

## Support Resources

- AWS Documentation: https://docs.aws.amazon.com
- Docker Documentation: https://docs.docker.com
- Nginx Documentation: https://nginx.org/en/docs
- Let's Encrypt: https://letsencrypt.org/docs
- Ollama Documentation: https://ollama.com/docs

---

**Guide Version**: 1.0.0  
**Last Updated**: 2025-11-09  
**For**: Production Remote Deployment
