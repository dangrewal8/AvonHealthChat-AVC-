# Avon Health RAG System - Local Demo Guide

**Complete guide for running the RAG system as a local demo**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Testing the Demo](#testing-the-demo)
5. [Architecture Overview](#architecture-overview)
6. [Troubleshooting](#troubleshooting)
7. [Managing the Demo](#managing-the-demo)

---

## Quick Start

If everything is already installed, start the demo with:

```bash
cd /home/dangr/Avonhealthtest
./start-demo.sh
```

Then open http://localhost in your browser!

---

## Prerequisites

### Required Software

1. **Docker & Docker Compose**
   ```bash
   # Check if installed
   docker --version
   docker-compose --version
   
   # If not installed
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   ```

2. **Ollama with AI Models**
   - Ollama should be installed and running
   - Required models:
     - `meditron` (7B medical LLM)
     - `nomic-embed-text` (768-dim embeddings)
   
   ```bash
   # Check Ollama is running
   curl http://localhost:11434/api/tags
   
   # Install models if needed
   ollama pull meditron
   ollama pull nomic-embed-text
   ```

3. **Avon Health API Credentials** (Already configured in `.env.production`)
   - Client ID: `soXn0taz9hcA5sGbQNBKHO9ks6a9YF3x`
   - Account: `prosper`
   - Base URL: `https://demo-api.avonhealth.com`

### System Requirements

- **CPU**: 2+ cores recommended (4+ cores ideal)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free space
- **OS**: Linux (Ubuntu 24.04 LTS recommended)

---

## Setup Instructions

### Step 1: Verify Ollama is Running

```bash
# Start Ollama if not running
export PATH="$HOME/ollama-bin:$PATH"
ollama serve &

# Verify it's accessible
curl http://localhost:11434/api/tags
```

### Step 2: Verify Docker is Installed

```bash
# Check Docker
docker --version

# Check Docker Compose
docker-compose --version

# If needed, add user to docker group to run without sudo
sudo usermod -aG docker $USER
# Then log out and back in
```

### Step 3: Navigate to Project Directory

```bash
cd /home/dangr/Avonhealthtest
```

### Step 4: Start the Demo

```bash
./start-demo.sh
```

This script will:
1. ✅ Verify Ollama is running
2. ✅ Check required AI models are installed
3. ✅ Build Docker containers
4. ✅ Start frontend and backend services
5. ✅ Run health checks
6. ✅ Display access URLs

**Expected output:**
```
==========================================
Demo Environment Ready!
==========================================

Access Points:
  • Frontend UI:    http://localhost
  • Backend API:    http://localhost:3001
  • Health Check:   http://localhost:3001/health

Test Patient ID:  user_n15wtm6xCNQGrmgfMCGOVaqEq0S2
```

---

## Testing the Demo

### Option 1: Automated Testing (Recommended)

Run the automated test suite:

```bash
./test-demo.sh
```

This will test:
- ✅ Health endpoints
- ✅ Medication queries
- ✅ Care plan queries
- ✅ Clinical notes queries

### Option 2: Web UI Testing

1. **Open the UI**
   ```
   http://localhost
   ```

2. **Enter Test Patient ID**
   ```
   user_n15wtm6xCNQGrmgfMCGOVaqEq0S2
   ```

3. **Try Sample Queries:**
   - "What medications is the patient taking?"
   - "What care plans are active?"
   - "Summarize recent visit notes"
   - "What is the patient's treatment plan?"

### Option 3: API Testing with cURL

```bash
# Test backend health
curl http://localhost:3001/health

# Test RAG query
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What medications is the patient taking?",
    "patient_id": "user_n15wtm6xCNQGrmgfMCGOVaqEq0S2"
  }' | python3 -m json.tool
```

### Available Test Data

The demo account has:
- **1 Patient**: Sample Patient
- **4 Care Plans**
- **1 Medication**: Ibuprofen Oral Capsule 200 MG
- **3 Clinical Notes**

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                     http://localhost                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Port 80)                          │
│           React + Vite + Nginx (Container)                   │
│                                                               │
│  - Serves static React app                                   │
│  - Proxies /api requests to backend                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api proxy
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Port 3001)                      │
│        Node.js + Express + RAG Pipeline (Container)          │
│                                                               │
│  1. Authenticates with Avon Health API                       │
│  2. Fetches patient data                                     │
│  3. Generates embeddings via Ollama                          │
│  4. Searches FAISS vector index                              │
│  5. Generates answers via Meditron                           │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ▼                      ▼
  ┌────────────────────┐   ┌─────────────────────────┐
  │  Avon Health API   │   │   Ollama (Host)         │
  │  (External)        │   │   Port 11434            │
  │                    │   │                         │
  │  - Patient data    │   │  - Meditron 7B (LLM)    │
  │  - Care plans      │   │  - nomic-embed-text     │
  │  - Medications     │   │    (Embeddings)         │
  │  - Notes           │   │                         │
  └────────────────────┘   └─────────────────────────┘
```

### Docker Networking

- **Frontend**: Listens on port 80 (host)
- **Backend**: Listens on port 3001 (host)
- **Ollama**: Runs on host, accessible via `host.docker.internal:11434`
- **Containers**: Share `avonhealth-network` bridge network

### Data Flow

1. **User Query** → Frontend UI
2. **HTTP Request** → Frontend → Nginx proxy → Backend API
3. **Authentication** → Backend → Avon Health API (OAuth2 + JWT)
4. **Data Fetch** → Backend → Avon Health API (Patient records)
5. **Embedding** → Backend → Ollama (nomic-embed-text)
6. **Vector Search** → Backend → FAISS index
7. **Answer Generation** → Backend → Ollama (Meditron)
8. **Response** → Backend → Frontend → User

---

## Troubleshooting

### Ollama Not Running

**Symptom:**
```
✗ Ollama is not running
```

**Solution:**
```bash
export PATH="$HOME/ollama-bin:$PATH"
ollama serve &
```

### Models Not Installed

**Symptom:**
```
✗ Meditron model not found
✗ nomic-embed-text model not found
```

**Solution:**
```bash
ollama pull meditron
ollama pull nomic-embed-text
```

### Docker Permission Denied

**Symptom:**
```
Got permission denied while trying to connect to the Docker daemon
```

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then try again
```

### Backend Not Responding

**Symptom:**
```
✗ Backend API: Not responding
```

**Solution:**
```bash
# Check backend logs
docker-compose logs backend

# Check if Ollama is accessible from container
docker exec avon-backend curl http://host.docker.internal:11434/api/tags

# Restart services
./stop-demo.sh
./start-demo.sh
```

### API Authentication Errors

**Symptom:**
```
401 Unauthorized / auth/invalid_credentials
```

**Solution:**
The credentials in `.env.production` are already configured correctly. If you see this error:

1. Check `.env.production` file exists
2. Verify all three required headers are being sent:
   - `Authorization: Bearer {token}`
   - `x-jwt: {jwt}`
   - `account: prosper` ← Critical!

### Port Already in Use

**Symptom:**
```
Bind for 0.0.0.0:80 failed: port is already allocated
```

**Solution:**
```bash
# Find what's using port 80
sudo lsof -i :80

# Stop the service or change docker-compose.yml to use different port
# Edit docker-compose.yml, change "80:80" to "8080:80"
```

---

## Managing the Demo

### Start the Demo

```bash
./start-demo.sh
```

### Stop the Demo

```bash
./stop-demo.sh
```

### Check Status

```bash
./status-demo.sh
```

Shows:
- Ollama status
- AI models installed
- Container health
- Service endpoints
- Resource usage

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up --build -d

# Or use the script
./stop-demo.sh
./start-demo.sh
```

### Clean Up Everything

```bash
# Stop and remove containers
docker-compose down

# Remove images too
docker-compose down --rmi all

# Remove volumes (data will be lost!)
docker-compose down -v
```

---

## Available Patient Data

### Test Patient

- **ID**: `user_n15wtm6xCNQGrmgfMCGOVaqEq0S2`
- **Name**: Sample Patient
- **Email**: sample+prosper@demo.com
- **Account**: prosper

### Medical Records

- **Medications**: 1 record
  - Ibuprofen Oral Capsule 200 MG
  
- **Care Plans**: 4 records
  - Sample Care Plan Template (multiple instances)
  
- **Clinical Notes**: 3 records
  - Sample Visit Note Template
  - Various clinical documentation

**Total**: 9 medical records available for querying

---

## Next Steps

After successful local demo:

1. **Test thoroughly** with different queries
2. **Review logs** to understand system behavior
3. **Monitor resource usage** with `./status-demo.sh`
4. **Plan for remote hosting** (see `REMOTE_HOSTING_GUIDE.md`)

---

## Files and Directories

```
Avonhealthtest/
├── backend/
│   ├── .env.production          # Backend API credentials
│   ├── Dockerfile               # Backend container config
│   ├── data/                    # FAISS index storage
│   └── logs/                    # Application logs
├── frontend/
│   ├── .env.production          # Frontend config
│   ├── Dockerfile               # Frontend container config
│   └── nginx.conf               # Nginx proxy config
├── docker-compose.yml           # Multi-container orchestration
├── start-demo.sh               # Start script
├── stop-demo.sh                # Stop script
├── status-demo.sh              # Status check script
├── test-demo.sh                # Testing script
└── LOCAL_DEMO_GUIDE.md         # This file
```

---

## Security Notes

### For Local Demo (Current Setup)

- ✅ API credentials in `.env.production` (local file)
- ✅ Services accessible only on localhost
- ✅ No external access by default
- ✅ Ollama runs locally (HIPAA compliant)

### For Remote Hosting

When deploying remotely, you MUST:
- 🔒 Use environment variables or secrets manager
- 🔒 Enable HTTPS with SSL certificates
- 🔒 Add authentication for frontend access
- 🔒 Implement rate limiting
- 🔒 Set up firewall rules
- 🔒 Regular security updates

See `REMOTE_HOSTING_GUIDE.md` for details.

---

## Support

For issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `docker-compose logs -f`
3. Check status: `./status-demo.sh`
4. Verify Ollama: `curl http://localhost:11434/api/tags`

---

**Demo Version**: 1.0.0  
**Last Updated**: 2025-11-09  
**System**: Local Docker Demo
