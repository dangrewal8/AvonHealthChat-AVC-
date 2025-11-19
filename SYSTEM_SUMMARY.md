# Avon Health RAG System - Technical Summary

## Overview

Avon Health RAG is a **Retrieval-Augmented Generation (RAG)** healthcare chat system designed to provide intelligent, context-aware responses to medical queries. The system combines local LLM inference with vector-based document retrieval to deliver accurate, relevant healthcare information.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend      │     │   AI Services   │
│   (React)       │────▶│   (Express)     │────▶│   (Ollama)      │
│   Port 8080     │     │   Port 3001     │     │   Port 11434    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │              ┌───────┴───────┐               │
         │              │               │               │
         │        ┌─────▼─────┐   ┌─────▼─────┐         │
         │        │ PostgreSQL│   │   FAISS   │         │
         │        │ (pgvector)│   │  (Vector) │         │
         │        └───────────┘   └───────────┘         │
         │
    ┌────▼────┐
    │Cloudflare│
    │ Tunnel   │──────▶ Public Internet Access
    └─────────┘        chat.missionvalley.dev
```

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - REST API framework
- **TypeScript** - Type-safe backend code

### AI/ML Components
- **Ollama** - Local LLM inference server
- **Llama 3.2 3B** - Primary language model (lightweight, fast)
- **nomic-embed-text** - Text embedding model for vector search
- **FAISS** - Facebook AI Similarity Search (vector database)

### Database
- **PostgreSQL** - Primary data store
- **pgvector** - Vector similarity extension for embeddings

### Deployment
- **Cloudflare Tunnel** - Zero-trust secure public access
- **Direct Node.js** - No Docker containerization (simplified deployment)

---

## Key Features

### 1. RAG Pipeline
The system uses Retrieval-Augmented Generation to enhance LLM responses:
1. User submits a healthcare query
2. Query is embedded using nomic-embed-text
3. FAISS performs similarity search against document vectors
4. Relevant context is retrieved (medications, care plans, clinical notes)
5. Context + query sent to Llama 3.2 for response generation
6. Response returned with source citations

### 2. Healthcare Data Integration
- **193 Medications** - Drug information, dosages, interactions
- **83 Care Plans** - Treatment protocols and guidelines
- **769 Clinical Notes** - Patient encounter summaries

### 3. Smart Fallback System
- Graceful degradation when AI services unavailable
- Cached responses for common queries
- Circuit breaker pattern for service resilience

### 4. Security Features
- JWT token authentication
- Rate limiting on API endpoints
- Content Security Policy headers
- CORS protection
- Input sanitization

---

## API Endpoints

### Health & Status
```
GET /health              - Service health check
GET /api/status          - Detailed system status
```

### Chat & Query
```
POST /api/chat           - Main chat endpoint (RAG-enabled)
POST /api/query          - Direct database query
```

### Data Management
```
GET /api/medications     - List medications
GET /api/care-plans      - List care plans
GET /api/clinical-notes  - List clinical notes
```

---

## Deployment Configuration

### Cloudflare Tunnel Setup
The system uses Cloudflare Tunnel for secure public access without exposing ports:

**Tunnel ID:** `1363d14d-f8b3-46a1-857e-25813e90406f`

**Public Endpoints:**
- `https://chat.missionvalley.dev` → Frontend (localhost:8080)
- `https://api.missionvalley.dev` → Backend (localhost:3001)

**Configuration:** `cloudflared/config.yml`
```yaml
tunnel: 1363d14d-f8b3-46a1-857e-25813e90406f
credentials-file: /path/to/credentials.json

ingress:
  - hostname: chat.missionvalley.dev
    service: http://localhost:8080
  - hostname: api.missionvalley.dev
    service: http://localhost:3001
  - service: http_status:404
```

### Starting Services
```bash
# Start all services
./start-all.sh

# Or individually:
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run dev -- --port 8080 --host 0.0.0.0

# Tunnel
cloudflared tunnel --config ~/.cloudflared/config.yml run avon-health-chat
```

---

## How RAG Works in This System

### 1. Document Ingestion (One-time setup)
```
Healthcare Documents → Text Extraction → Chunking → Embedding → FAISS Index
```

### 2. Query Processing (Runtime)
```
User Query → Embed Query → Vector Search → Retrieve Top-K Chunks →
Construct Prompt → LLM Generation → Response with Sources
```

### 3. Context Window Management
- Maximum context: 4096 tokens
- Top-K retrieval: 5 most relevant chunks
- Chunk overlap: 200 tokens for continuity

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Average response time | 2-5 seconds |
| Embedding dimension | 768 |
| Vector index type | FAISS IVF-Flat |
| Model parameters | 3B (Llama 3.2) |
| Memory usage | ~4GB RAM |

---

## File Structure

```
/home/dangr/Avonhealthtest/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server entry
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic (RAG, embeddings)
│   │   └── utils/            # Helpers (auth, validation)
│   ├── dist/                 # Compiled JavaScript
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── components/       # UI components
│   │   └── services/         # API client
│   ├── vite.config.ts        # Vite configuration
│   └── package.json
├── cloudflared/
│   ├── config.yml            # Tunnel routing
│   ├── cert.pem              # Auth certificate
│   └── *.json                # Tunnel credentials
├── start-all.sh              # Main startup script
└── start-servers.sh          # Server startup script
```

---

## Dependencies Summary

### Production Dependencies
- `express` - Web framework
- `pg` / `pg-pool` - PostgreSQL client
- `faiss-node` - Vector similarity search
- `jsonwebtoken` - JWT authentication
- `helmet` - Security headers
- `express-rate-limit` - API rate limiting

### AI/ML Dependencies
- Ollama (external service)
- Llama 3.2 3B model
- nomic-embed-text model

---

## Monitoring & Logs

**Log Locations:**
- Backend: `/tmp/backend.log`
- Frontend: `/tmp/frontend.log`
- Tunnel: `/tmp/tunnel.log`

**Health Checks:**
```bash
curl http://localhost:3001/health
curl http://localhost:8080
```

---

## Security Considerations

1. **Authentication**: JWT tokens with configurable expiration
2. **Rate Limiting**: 100 requests/15 minutes per IP
3. **Input Validation**: All user inputs sanitized
4. **HTTPS**: Enforced via Cloudflare Tunnel
5. **Credential Storage**: Tunnel credentials in private repo (rotate before production)

---

## Future Enhancements

- [ ] Multi-model support (GPT-4, Claude API fallback)
- [ ] User session persistence
- [ ] Advanced analytics dashboard
- [ ] HIPAA compliance audit logging
- [ ] Horizontal scaling with load balancer

---

## Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 8080 | http://localhost:8080 |
| Backend | 3001 | http://localhost:3001 |
| Ollama | 11434 | http://localhost:11434 |
| PostgreSQL | 5432 | localhost:5432 |
| Public Chat | - | https://chat.missionvalley.dev |
| Public API | - | https://api.missionvalley.dev |

---

*Document generated: November 2024*
*System Version: 1.0.0*
