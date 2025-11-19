# Ollama Setup Guide for Advanced AI Features

**Date:** 2025-11-19
**Purpose:** Enable advanced AI features in Avon Health Chat RAG system

---

## Why Ollama is Required

Ollama provides the AI/LLM capabilities for **advanced features**:

✨ **Advanced Features (with Ollama):**
- 🧠 **Chain-of-thought reasoning** with Meditron medical AI
- ⭐ **Multi-level confidence assessment** (HIGH/MEDIUM/LOW/INSUFFICIENT)
- 📝 **Detailed source citations** with IDs, dates, providers, values
- 🤔 **Intelligent uncertainty handling** with helpful suggestions
- 🔗 **Full clinical context expansion** (timelines, relationships, effectiveness)

🔄 **Fallback Mode (without Ollama):**
- Basic pattern matching for questions
- Simple data retrieval
- Limited reasoning capabilities
- **Bug Fixed:** Now correctly returns conditions for condition queries (not medications)

---

## Automatic Startup Integration

The startup scripts have been **updated to automatically start Ollama**:

### Development Mode (`start-servers.sh`):
```bash
./start-servers.sh
# Automatically starts:
# 1. Ollama (AI service)
# 2. Backend API
# 3. Frontend UI
```

### Production Mode (`start-all.sh`):
```bash
./start-all.sh
# Automatically starts:
# 1. Ollama (AI service)
# 2. Backend API
# 3. Frontend UI
# 4. Cloudflare Tunnel (optional)
```

### Manual Ollama Control (`start-ollama.sh`):
```bash
./start-ollama.sh           # Start Ollama
./start-ollama.sh --check   # Check if running
./start-ollama.sh --pull    # Pull Meditron model
```

---

## Installation Options

### Option 1: Automatic Installation (Recommended)

Simply run the startup script - it will guide you:

```bash
./start-ollama.sh
```

If Ollama is not installed, you'll see installation instructions.

### Option 2: Docker (Recommended for Production)

**Install Docker:**
```bash
curl -fsSL https://get.docker.com | sh
```

**Start Ollama with Docker:**
```bash
docker run -d \
    --name ollama \
    --restart unless-stopped \
    -p 11434:11434 \
    -v ollama_data:/root/.ollama \
    ollama/ollama:latest
```

**Pull Meditron Model:**
```bash
docker exec ollama ollama pull meditron
```

**Verify:**
```bash
curl http://localhost:11434/api/tags
```

### Option 3: Native Binary (Linux)

**Install Ollama:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Start Ollama:**
```bash
ollama serve &
```

**Pull Meditron Model:**
```bash
ollama pull meditron
```

**Verify:**
```bash
curl http://localhost:11434/api/tags
```

### Option 4: Native Binary (macOS)

**Install Ollama:**
```bash
brew install ollama
```

**Start Ollama:**
```bash
ollama serve &
```

**Pull Meditron Model:**
```bash
ollama pull meditron
```

---

## Verification

### Check if Ollama is Running:

```bash
curl http://localhost:11434/api/tags
```

**Expected output:** JSON with list of models (should include "meditron")

### Check if Backend Detects Ollama:

Start the backend and look for this message:
```
✅ Ollama connected successfully
```

If Ollama is **not** running, you'll see:
```
⚠️  WARNING: Ollama service not available at http://localhost:11434
   Make sure Ollama is running: ollama serve
   The server will start but queries will fail.
```

---

## Testing Advanced Features

Once Ollama is running, test the advanced features:

### Test Query 1: Medical Conditions

```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what medical conditions does the patient have",
    "patient_id": "patient123",
    "options": {"detail_level": 3}
  }'
```

**With Ollama (Advanced):**
- Uses chain-of-thought reasoning
- Provides detailed citations with source IDs
- Includes confidence levels
- Shows reasoning steps

**Without Ollama (Fallback):**
- Uses pattern matching
- Basic data retrieval
- No reasoning chain
- Limited detail

### Test Query 2: Complex Medical Question

```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the patient being treated for and how effective is the treatment",
    "patient_id": "patient123",
    "options": {"detail_level": 3}
  }'
```

**With Ollama:**
- Multi-source synthesis
- Treatment effectiveness analysis
- Timeline construction
- Clinical reasoning

**Without Ollama:**
- Lists medications and care plans
- No analysis or synthesis
- No effectiveness assessment

---

## Troubleshooting

### Issue: "Ollama service not available"

**Solution 1:** Start Ollama manually
```bash
# Docker
docker start ollama
# OR
./start-ollama.sh
```

**Solution 2:** Check if Ollama is actually running
```bash
ps aux | grep ollama
# Should show ollama process
```

**Solution 3:** Check port 11434
```bash
netstat -tulpn | grep 11434
# Should show ollama listening on 11434
```

### Issue: "Model 'meditron' not found"

**Solution:** Pull the Meditron model
```bash
# Docker
docker exec ollama ollama pull meditron

# Native
ollama pull meditron
```

### Issue: "Out of memory" when loading Meditron

**Solution:** Meditron is a large model. Ensure you have:
- At least 8GB RAM available
- At least 10GB disk space for the model

**Alternative:** Use a smaller model temporarily
```bash
ollama pull llama2:7b
```

Then update `.env`:
```bash
OLLAMA_LLM_MODEL=llama2:7b
```

### Issue: Docker not installed

**Solution:** Install Docker
```bash
curl -fsSL https://get.docker.com | sh
```

---

## Configuration

### Environment Variables (`.env`):

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=meditron
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.1
```

### Change Ollama Settings:

1. **Use different model:**
   ```bash
   # In .env
   OLLAMA_LLM_MODEL=llama2
   ```

2. **Use remote Ollama instance:**
   ```bash
   # In .env
   OLLAMA_BASE_URL=http://your-server:11434
   ```

3. **Adjust temperature (creativity):**
   ```bash
   # In .env
   OLLAMA_TEMPERATURE=0.3  # Higher = more creative, Lower = more deterministic
   ```

---

## Docker Commands Cheat Sheet

```bash
# Start Ollama
docker start ollama

# Stop Ollama
docker stop ollama

# Restart Ollama
docker restart ollama

# View logs
docker logs -f ollama

# Check status
docker ps | grep ollama

# Pull a model
docker exec ollama ollama pull meditron

# List models
docker exec ollama ollama list

# Remove container (if you need to recreate)
docker rm -f ollama

# Remove model data (frees space)
docker volume rm ollama_data
```

---

## Native Binary Commands Cheat Sheet

```bash
# Start Ollama (background)
nohup ollama serve > /tmp/ollama.log 2>&1 &

# Stop Ollama
pkill ollama

# Pull a model
ollama pull meditron

# List models
ollama list

# Check version
ollama --version

# View logs
tail -f /tmp/ollama.log
```

---

## Performance Notes

### Model Sizes:
- **Meditron:** ~7GB (medical-specialized, recommended)
- **Llama2 7B:** ~3.8GB (general purpose, fallback)
- **Nomic Embed:** ~274MB (for embeddings)

### Resource Usage:
- **RAM:** 8GB minimum, 16GB recommended
- **CPU:** 4 cores minimum, 8 cores recommended
- **Disk:** 10GB for models + data
- **GPU:** Optional, significantly speeds up inference

### Startup Time:
- **First run:** 2-5 minutes (downloading model)
- **Subsequent runs:** 5-10 seconds

### Query Response Time:
- **With Ollama:** 3-10 seconds (includes reasoning)
- **Without Ollama:** <1 second (pattern matching only)

---

## Benefits of Running Ollama

| Feature | With Ollama | Without Ollama |
|---------|-------------|----------------|
| Reasoning | ✅ Chain-of-thought | ❌ Pattern matching |
| Confidence | ✅ Multi-level (HIGH/MEDIUM/LOW/INSUFFICIENT) | ❌ No confidence |
| Citations | ✅ Detailed (IDs, dates, providers) | ⚠️ Basic |
| Context | ✅ Full clinical narrative | ⚠️ Data acknowledgment |
| Uncertainty | ✅ Intelligent suggestions | ❌ Generic responses |
| Multi-source | ✅ Synthesis across sources | ❌ Single source |
| Clinical reasoning | ✅ Advanced | ❌ None |

---

## Next Steps

1. **Install Ollama** (choose method above)
2. **Start Ollama** (`./start-ollama.sh` or manually)
3. **Pull Meditron model** (automatic or `ollama pull meditron`)
4. **Start backend** (`./start-servers.sh` or `./start-all.sh`)
5. **Test advanced features** (use curl commands above)
6. **Verify in logs** (look for "✅ Ollama connected")

---

## Additional Resources

- **Ollama Documentation:** https://ollama.com/
- **Meditron Model:** https://ollama.com/library/meditron
- **Docker Installation:** https://docs.docker.com/get-docker/
- **Troubleshooting:** See "Troubleshooting" section above

---

**Updated:** 2025-11-19
**Status:** ✅ Automatic startup integrated
**Installation:** In progress (see `./start-ollama.sh` for status)
