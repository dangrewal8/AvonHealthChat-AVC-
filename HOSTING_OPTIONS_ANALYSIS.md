# Avon Health RAG Demo - Hosting Options Analysis

**Date**: 2025-01-09
**System**: Avon Health RAG with Meditron 7B + FAISS + React Frontend

---

## Executive Summary

| Factor | Local PC Hosting | AWS Hosting |
|--------|-----------------|-------------|
| **Initial Cost** | $0 | $50-150/month |
| **Setup Time** | 1-2 hours | 2-4 hours |
| **Complexity** | Low | Medium |
| **Performance** | Excellent | Excellent |
| **Accessibility** | Limited (your network) | Global (internet) |
| **Uptime** | When PC is on | 24/7 |
| **Security** | Your responsibility | Shared responsibility |
| **Scalability** | Limited | Unlimited |
| **Maintenance** | Manual | Automated options |

**Recommendation**: **Start with Local PC**, then migrate to AWS if needed for broader access.

---

## Your Current System Specs

✅ **Your PC is MORE than capable of running this demo:**

- **CPU**: Intel i7-13700KF (24 cores) - **Excellent**
- **RAM**: 16GB (11GB free) - **Perfect** (needs ~8GB)
- **Disk**: 935GB free - **More than enough** (needs ~5GB)
- **OS**: Ubuntu 24.04 LTS - **Ideal**
- **Network**: Public IP available (108.83.128.135)

**Verdict**: Your PC exceeds all requirements for local hosting.

---

## Option 1: Local PC Hosting (Recommended to Start)

### What You Get

✅ **Free hosting** - No monthly costs
✅ **Fast performance** - Direct access to your hardware
✅ **Easy setup** - 5 simple steps
✅ **Full control** - Complete access to system
✅ **Privacy** - Data never leaves your machine
✅ **Perfect for demos** - Great for testing and showing locally

### Limitations

⚠️ **Requires PC to be on** - Demo only works when your computer is running
⚠️ **Network dependent** - Need to configure firewall/router for external access
⚠️ **Your IP only** - Either localhost or your home IP address
⚠️ **Manual updates** - You handle all updates and maintenance
⚠️ **Limited scalability** - Can't handle many simultaneous users

### Resource Requirements

| Component | Size | RAM Usage | Notes |
|-----------|------|-----------|-------|
| Ollama | 395MB disk | - | Already installed ✅ |
| Meditron model | 3.8GB disk | 5-6GB RAM | Already installed ✅ |
| nomic-embed-text | 274MB disk | 512MB RAM | Already installed ✅ |
| Backend (Node.js) | 179MB disk | 256-512MB RAM | Ready to run ✅ |
| Frontend (React) | 316KB disk | Negligible | Ready to run ✅ |
| PostgreSQL (optional) | ~100MB disk | 128-256MB RAM | Not required for demo |
| **TOTAL** | **~5GB disk** | **~7-8GB RAM** | **You have plenty** ✅ |

### Setup Steps (Local PC)

#### Step 1: Install Docker (15 minutes)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

#### Step 2: Configure for Local Access (5 minutes)
```bash
cd /home/dangr/Avonhealthtest

# Create production environment file
cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=3001

# Ollama (already running locally)
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_EMBEDDING_DIMENSIONS=768
OLLAMA_LLM_MODEL=meditron
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.1

# Vector Database
VECTOR_DB_TYPE=faiss
FAISS_DIMENSION=768
FAISS_INDEX_PATH=./data/faiss

# CORS - allow frontend
CORS_ORIGIN=http://localhost:3000,http://localhost

# Mock Avon Health API (since real API not working)
AVON_CLIENT_ID=demo
AVON_CLIENT_SECRET=demo
AVON_BASE_URL=http://mock-api

# Logging
LOG_LEVEL=info

# Security
RATE_LIMIT_ENABLED=true
EOF

# Build frontend with backend URL
cat > frontend/.env.production << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=Avon Health RAG Demo
EOF
```

#### Step 3: Start Services (5 minutes)
```bash
cd /home/dangr/Avonhealthtest

# Make sure Ollama is running
export PATH="$HOME/ollama-bin:$PATH"
pkill ollama 2>/dev/null
nohup ollama serve > ~/ollama.log 2>&1 &
sleep 3

# Build and start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### Step 4: Access the Demo
```
Frontend: http://localhost
Backend API: http://localhost:3001
Health Check: http://localhost:3001/health
```

#### Step 5: Share Demo on Local Network (Optional)
```bash
# Find your local IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# Example: If your local IP is 192.168.1.100
# Share with others on same network:
# http://192.168.1.100
```

### Accessing from Internet (Advanced - Optional)

If you want others to access from outside your network:

**Option A: ngrok (Easiest - Free for demo)**
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Sign up at ngrok.com and get auth token
ngrok config add-authtoken YOUR_TOKEN

# Expose frontend
ngrok http 80

# You'll get a public URL like: https://abc123.ngrok.io
```

**Option B: Router Port Forwarding (Free but requires router access)**
1. Login to your router (usually 192.168.1.1 or 192.168.0.1)
2. Find "Port Forwarding" settings
3. Forward external port 80 → your PC IP:80
4. Forward external port 3001 → your PC IP:3001
5. Access via: http://YOUR_PUBLIC_IP (108.83.128.135)

**Option C: Tailscale VPN (Free - Secure)**
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Share with specific people via Tailscale network
# They can access http://YOUR_TAILSCALE_IP
```

---

## Option 2: AWS Hosting (For 24/7 Public Access)

### What You Get

✅ **24/7 uptime** - Always available
✅ **Global access** - Anyone can access from anywhere
✅ **Scalable** - Can handle more users if needed
✅ **Professional URL** - Can use custom domain
✅ **Automated backups** - AWS handles reliability
✅ **DDoS protection** - AWS infrastructure security

### Costs

| Service | Specification | Cost/Month | Purpose |
|---------|--------------|------------|---------|
| **EC2 Instance** | t3.xlarge (4 vCPU, 16GB RAM) | ~$120 | Run Ollama + Backend |
| **EBS Storage** | 30GB SSD | ~$3 | Model storage |
| **Data Transfer** | First 1GB free, then $0.09/GB | ~$5-10 | API requests |
| **Load Balancer** (optional) | Application LB | ~$20 | Better reliability |
| **Route 53** (optional) | DNS hosting | ~$1 | Custom domain |
| **TOTAL (minimum)** | - | **$128/month** | Basic setup |
| **TOTAL (recommended)** | - | **$149/month** | With LB + DNS |

**Alternative: AWS Lightsail** - Fixed pricing, simpler setup
- 16GB RAM instance: $80/month (all-inclusive)
- **Recommended for demos**

### Why AWS Costs More

The main cost driver is **Meditron 7B model**:
- Requires 5-6GB RAM when running
- Needs powerful CPU for inference
- Can't use small/cheap instances

**Cost Comparison**:
- **t3.small (2GB RAM)**: $15/month - ❌ Too small for Meditron
- **t3.medium (4GB RAM)**: $30/month - ❌ Barely enough, will struggle
- **t3.large (8GB RAM)**: $60/month - ⚠️ Minimal, might work
- **t3.xlarge (16GB RAM)**: $120/month - ✅ Recommended
- **Lightsail 16GB**: $80/month - ✅ Best value for demo

### Setup Steps (AWS)

#### Prerequisites
- AWS account (free tier available)
- Credit card (for billing)
- Domain name (optional, ~$12/year)

#### Step 1: Launch EC2 Instance (15 minutes)
```
1. Go to AWS Console → EC2
2. Click "Launch Instance"
3. Choose:
   - Name: avon-health-rag-demo
   - OS: Ubuntu 24.04 LTS
   - Instance type: t3.xlarge (16GB RAM)
   - Storage: 30GB gp3 SSD
   - Security Group:
     - Port 22 (SSH) - Your IP only
     - Port 80 (HTTP) - 0.0.0.0/0
     - Port 443 (HTTPS) - 0.0.0.0/0
     - Port 3001 (Backend) - 0.0.0.0/0
4. Create or select key pair for SSH access
5. Launch instance
```

#### Step 2: Connect and Install Dependencies (20 minutes)
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Ollama
curl -L https://github.com/ollama/ollama/releases/download/v0.1.17/ollama-linux-amd64 -o ollama
chmod +x ollama
sudo mv ollama /usr/local/bin/

# Start Ollama
nohup ollama serve > ollama.log 2>&1 &

# Pull models
ollama pull meditron
ollama pull nomic-embed-text

# Transfer your code
# Use SCP or git clone from your repository
```

#### Step 3: Deploy Application (10 minutes)
```bash
# Same docker-compose setup as local
cd /home/ubuntu/Avonhealthtest

# Configure environment files
# (same as local PC instructions)

# Start services
docker-compose up -d
```

#### Step 4: Configure Domain (Optional - 10 minutes)
```
1. Go to Route 53
2. Create hosted zone for your domain
3. Create A record pointing to EC2 Elastic IP
4. Configure SSL with Let's Encrypt (free)
```

#### Step 5: Access Demo
```
Public URL: http://YOUR_EC2_IP
Or: https://your-domain.com (if configured)
```

### AWS Cost Optimization Tips

1. **Use Lightsail instead of EC2** - Fixed pricing, simpler
2. **Use Spot Instances** - Up to 70% cheaper (but can be terminated)
3. **Stop instance when not demoing** - Only pay for storage (~$3/month)
4. **Use smaller model** - llama3:8b uses less RAM (but not medical-specific)
5. **Free tier** - First 12 months includes 750hrs/month of t2.micro (too small for this)

---

## Comparison Matrix

### Performance

| Metric | Local PC | AWS |
|--------|----------|-----|
| LLM Inference Speed | 5-10 tokens/sec | 5-10 tokens/sec |
| API Response Time | <100ms | 100-300ms (latency) |
| Concurrent Users | 5-10 | 50-100+ |
| Uptime | When PC on | 99.99% |

### Security

| Feature | Local PC | AWS |
|---------|----------|-----|
| Firewall | Your router | AWS Security Groups |
| DDoS Protection | Limited | Built-in |
| SSL/HTTPS | Manual setup | Free with ACM |
| Data Privacy | Complete control | Shared infrastructure |
| HIPAA Compliance | Easier to audit | Requires BAA with AWS |

### Maintenance

| Task | Local PC | AWS |
|------|----------|-----|
| OS Updates | Manual | Manual or automated |
| Backups | Manual | Automated snapshots |
| Monitoring | Manual | CloudWatch (built-in) |
| Scaling | Buy more hardware | Click to upgrade |
| Disaster Recovery | None | Multi-region options |

---

## Hybrid Approach (Best of Both Worlds)

**Recommendation for Your Use Case:**

### Phase 1: Development & Initial Demos (Local PC)
- Use your PC for initial development
- Demo to colleagues on local network
- Test with small group of users
- Cost: **$0**
- Timeline: **Today** (can be ready in 2 hours)

### Phase 2: Limited Public Access (ngrok)
- When you need to show external stakeholders
- Use ngrok to create temporary public URL
- Share link for specific demo sessions
- Cost: **$0-8/month** (free tier or paid for custom domain)
- Timeline: **5 minutes to set up**

### Phase 3: Full Public Deployment (AWS Lightsail)
- When you need permanent 24/7 access
- After validating demand/interest
- Professional setup with custom domain
- Cost: **$80/month**
- Timeline: **2-3 hours to set up**

---

## Recommended Path Forward

### Immediate: Local PC Demo ⭐ **(RECOMMENDED)**

**Why:**
- Your PC has MORE than enough power
- Zero cost
- Can be running in 1-2 hours
- Perfect for initial demos and testing
- Easy to iterate and improve

**Steps:**
1. Install Docker (15 min)
2. Configure environment files (5 min)
3. Run `docker-compose up` (5 min)
4. Access at http://localhost
5. **Total time: ~30 minutes**

**For External Access:**
- Use ngrok for temporary public URLs (free)
- Or configure port forwarding on your router

### If You Need 24/7 Public Access: AWS Lightsail

**Why Lightsail over EC2:**
- Simpler setup
- Fixed pricing ($80/month for 16GB RAM)
- Includes data transfer
- Easier to manage
- Perfect for demos that need to be always-on

**When to choose:**
- Multiple stakeholders need access
- Need to demo at any time
- Want professional URL (yourdomain.com)
- Need 24/7 uptime

---

## Decision Tree

```
Do you need the demo accessible 24/7?
│
├─ NO → Use Local PC + ngrok
│        Cost: $0-8/month
│        Setup time: 30 min
│        Perfect for: Demos, testing, development
│
└─ YES → Do you need to demo to many people simultaneously?
         │
         ├─ NO (1-10 users) → AWS Lightsail 16GB
         │                     Cost: $80/month
         │                     Setup time: 2 hours
         │                     Perfect for: Always-on demos, small teams
         │
         └─ YES (10+ users) → AWS EC2 t3.xlarge + Load Balancer
                               Cost: $149/month
                               Setup time: 3 hours
                               Perfect for: Production, many users
```

---

## Mock Data Solution (Since Avon Health API is Down)

Since the Avon Health API authentication isn't working, you have two options:

### Option 1: Use Existing Mock Data ✅ **(Recommended)**

Your project already has comprehensive mock data:

```bash
backend/data/golden_dataset.json        # 90 test cases
backend/data/golden_dataset_compact.json # Compact version
```

This includes:
- Care plans
- Medications
- Clinical notes
- All properly formatted for the RAG system

**To use:**
1. Modify backend to load from these files instead of API
2. Everything else works identically
3. Can still demo full RAG functionality

### Option 2: Create Mock API Endpoint

Create a simple mock API server that returns this data:

```javascript
// backend/src/mock-api.ts
import express from 'express';
import goldenDataset from '../data/golden_dataset.json';

const app = express();

app.get('/v2/care_plans', (req, res) => {
  // Return mock care plans
  res.json(goldenDataset.entries.filter(e => e.category === 'care_plan'));
});

// Similar for medications, notes, etc.
```

---

## Next Steps - Your Choice

### Option A: Quick Local Demo (Recommended) ⏰ 30 minutes

**Pros**: Free, fast, perfect for testing
**Cons**: Not accessible 24/7
**When**: You want to start immediately

**Steps**:
1. Say "let's do local hosting"
2. I'll guide you through Docker installation
3. Configure environment files
4. Launch demo
5. You'll have working demo in 30 minutes

### Option B: AWS Public Hosting ⏰ 2-3 hours

**Pros**: Always accessible, professional
**Cons**: Costs $80-150/month
**When**: You need permanent public access

**Steps**:
1. Say "let's do AWS hosting"
2. Create AWS account (if needed)
3. I'll guide you through EC2/Lightsail setup
4. Transfer code and configure
5. You'll have public demo in 2-3 hours

### Option C: Both (Recommended Path)

**Start**: Local PC demo today (30 min, $0)
**Then**: Evaluate if you need AWS (after testing)
**Finally**: Move to AWS only if needed ($80/month)

---

## My Recommendation

**Start with Local PC hosting using Docker.**

**Why:**
1. ✅ Your PC exceeds all requirements
2. ✅ Zero cost
3. ✅ Ready in 30 minutes
4. ✅ Perfect for demos and testing
5. ✅ Easy to iterate and improve
6. ✅ Can always move to AWS later

**Use ngrok** ($0-8/month) when you need to:
- Show external stakeholders
- Demo to remote team members
- Get temporary public URL for meetings

**Move to AWS** ($80/month) only if you need:
- Permanent 24/7 access
- Professional custom domain
- Multiple simultaneous users
- Always-on availability

---

**Ready to proceed?** Let me know which option you prefer, and I'll guide you through the detailed setup steps!
