# Troubleshooting Guide

**Common Issues and Solutions for Ollama-based RAG System**

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Performance Optimization](#performance-optimization)
4. [Model Management](#model-management)
5. [Debug Mode](#debug-mode)
6. [Quick Reference](#quick-reference)

---

## Quick Diagnostics

Run these commands to quickly identify issues:

```bash
# 1. Check if Ollama is running
curl http://localhost:11434/api/tags

# 2. List installed models
ollama list

# 3. Check Ollama version
ollama --version

# 4. Test embedding generation
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test"
}'

# 5. Check system resources
free -h    # Memory
df -h      # Disk space
```

---

## Common Issues

### Issue 1: Ollama Not Running

#### Symptoms
```
Error: connect ECONNREFUSED 127.0.0.1:11434
Backend startup validation failed
```

#### Diagnosis
```bash
curl http://localhost:11434/api/tags
# If you get "Connection refused", Ollama is not running
```

#### Solution

**Option A: Start Ollama Manually**
```bash
ollama serve
```

**Option B: Start as Service (Linux)**
```bash
sudo systemctl start ollama
sudo systemctl enable ollama  # Auto-start on boot
```

**Option C: Start as Service (macOS)**
```bash
brew services start ollama
```

#### Prevention
- Set up Ollama as a system service
- Add health checks to monitoring
- Use process manager (PM2, systemd)

---

### Issue 2: Models Not Found

#### Symptoms
```
Error: model 'meditron' not found
Error: model 'nomic-embed-text' not found
```

#### Diagnosis
```bash
ollama list
# Check if meditron and nomic-embed-text are listed
```

#### Solution

**Step 1: Pull Missing Models**
```bash
# Pull medical LLM
ollama pull meditron

# Pull embedding model
ollama pull nomic-embed-text
```

**Step 2: Verify Installation**
```bash
ollama list

# Expected output:
# NAME                    SIZE
# meditron:latest         4.1 GB
# nomic-embed-text:latest 274 MB
```

**Step 3: Test Models**
```bash
# Test LLM
ollama run meditron "What is diabetes?"

# Test embedding
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test"
}'
```

#### Prevention
- Pre-download models in deployment scripts
- Add model validation to startup checks
- Document required models in README

---

### Issue 3: Slow Performance

#### Symptoms
- LLM responses take >30 seconds
- Embedding generation takes >5 seconds per document
- High CPU usage (>90%)
- System becomes unresponsive

#### Diagnosis
```bash
# Check if GPU is available
nvidia-smi  # For NVIDIA GPUs

# Check CPU usage
top

# Time a test query
time curl http://localhost:11434/api/generate -d '{
  "model": "meditron",
  "prompt": "What is hypertension?",
  "stream": false
}'
```

#### Solution

**Option A: Enable GPU Acceleration (Recommended)**

**For NVIDIA GPUs**:
```bash
# 1. Install NVIDIA drivers
sudo ubuntu-drivers autoinstall

# 2. Verify GPU is detected
nvidia-smi

# 3. Restart Ollama
sudo systemctl restart ollama

# 4. Verify GPU is being used
nvidia-smi  # Check GPU utilization while running queries
```

**For AMD GPUs**:
```bash
# Set ROCm environment
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export OLLAMA_GPU_DRIVER=rocm

# Restart Ollama
ollama serve
```

**For Apple Silicon (M1/M2/M3)**:
- GPU acceleration is automatic
- No configuration needed

**Option B: Optimize CPU Configuration**
```env
# Edit .env
OLLAMA_NUM_THREADS=8        # Match your CPU core count
OLLAMA_NUM_PARALLEL=1       # Disable parallel requests
OLLAMA_MAX_LOADED_MODELS=1  # Keep only one model in memory
```

**Option C: Use Smaller/Quantized Models**
```bash
# Use quantized models for faster inference
ollama pull meditron:7b-q4_0  # 4-bit quantization
ollama pull meditron:7b-q5_0  # 5-bit quantization
```

Update `.env`:
```env
OLLAMA_LLM_MODEL=meditron:7b-q4_0
```

#### Performance Benchmarks

| Hardware | LLM Time | Embedding Time |
|----------|----------|----------------|
| CPU (8 cores) | 30-60s | 3-5s |
| CPU + Quantized (Q4) | 20-40s | 3-5s |
| GPU (RTX 3060) | 3-6s | 100-200ms |
| GPU (A100) | 2-4s | 50-100ms |

#### Prevention
- Use GPU-enabled hardware for production
- Implement request queuing
- Monitor performance metrics
- Set reasonable timeout values

---

### Issue 4: Out of Memory Errors

#### Symptoms
```
Error: Out of memory
Ollama process killed (OOM)
System becomes unresponsive
```

#### Diagnosis
```bash
# Check available memory
free -h

# Check Ollama memory usage
ps aux | grep ollama

# Monitor memory in real-time
watch -n 1 free -h
```

#### Solution

**Option A: Increase System RAM**
- Minimum: 8 GB RAM
- Recommended: 16+ GB RAM
- Production: 32+ GB RAM

**Option B: Use Quantized Models**

Quantized models use less memory:

| Model | Memory Required |
|-------|-----------------|
| meditron:7b (full) | 14 GB |
| meditron:7b-q8_0 | 8 GB |
| meditron:7b-q5_0 | 6 GB |
| meditron:7b-q4_0 | 4 GB |

```bash
# Pull quantized model
ollama pull meditron:7b-q4_0

# Update configuration
echo "OLLAMA_LLM_MODEL=meditron:7b-q4_0" >> .env
```

**Option C: Configure Memory Limits**
```env
# Limit concurrent operations
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_NUM_PARALLEL=1

# Reduce context window
OLLAMA_MAX_TOKENS=2048
```

**Option D: Enable Swap (Not Recommended for Production)**
```bash
# Create 8GB swap file (emergency use only)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Prevention
- Provision adequate RAM for production
- Use quantized models on lower-spec hardware
- Implement request queuing to prevent overload
- Monitor memory usage with alerts

---

### Issue 5: Connection Refused Errors

#### Symptoms
```
Error: connect ECONNREFUSED 127.0.0.1:11434
Backend cannot connect to Ollama
```

#### Diagnosis
```bash
# Check if Ollama is running
ps aux | grep ollama

# Check if port 11434 is listening
netstat -tuln | grep 11434

# Check Ollama bind address
curl http://localhost:11434/api/tags
```

#### Solution

**Option A: Restart Ollama**
```bash
# Kill existing process
pkill ollama

# Start fresh
ollama serve
```

**Option B: Check Firewall**
```bash
# Check firewall status (Linux)
sudo ufw status

# Allow port 11434 (if needed)
sudo ufw allow 11434

# Check iptables
sudo iptables -L -n | grep 11434
```

**Option C: Verify Ollama Bind Address**

Check Ollama configuration:
```bash
# Ensure Ollama is binding to localhost
echo $OLLAMA_HOST  # Should be empty or 127.0.0.1:11434
```

If Ollama is binding to a different address:
```env
# Update backend .env
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

**Option D: Check for Port Conflicts**
```bash
# See what's using port 11434
sudo lsof -i :11434

# If another service is using it, stop it or change Ollama port
OLLAMA_HOST=0.0.0.0:11435 ollama serve
```

#### Prevention
- Use systemd service for auto-restart
- Add health checks in backend startup
- Monitor Ollama process with watchdog
- Document firewall requirements

---

## Performance Optimization

### GPU Acceleration

#### NVIDIA (CUDA)

```bash
# Install CUDA toolkit
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
sudo dpkg -i cuda-keyring_1.0-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda

# Set environment variables
export PATH=/usr/local/cuda/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH

# Restart Ollama
sudo systemctl restart ollama

# Verify GPU usage
nvidia-smi
```

#### AMD (ROCm)

```bash
# Install ROCm
sudo apt-get install rocm-hip-sdk

# Configure Ollama
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export OLLAMA_GPU_DRIVER=rocm

# Restart Ollama
ollama serve
```

#### Apple Silicon

GPU acceleration is automatic - no configuration needed.

### Memory Tuning

```env
# Keep models in memory longer
OLLAMA_KEEP_ALIVE=30m

# Limit number of loaded models
OLLAMA_MAX_LOADED_MODELS=2

# Set context window size
OLLAMA_NUM_CTX=4096
```

### Model Selection

Choose the right model for your hardware:

| Hardware | Recommended Model | Expected Performance |
|----------|-------------------|----------------------|
| 8GB RAM, CPU | meditron:7b-q4_0 | Slow (30-60s) |
| 16GB RAM, CPU | meditron:7b | Acceptable (20-40s) |
| 16GB RAM, GPU (8GB+) | meditron:7b | Excellent (2-5s) |
| 32GB RAM, GPU (16GB+) | meditron:13b | Best (3-7s) |

### Concurrency Control

Limit concurrent requests to prevent overload:

```typescript
// Add to backend
import pLimit from 'p-limit';

const limit = pLimit(2); // Max 2 concurrent Ollama requests

async function processQuery(query: string) {
  return limit(() => llmService.generateCompletion(query));
}
```

---

## Model Management

### Listing Models

```bash
ollama list
```

### Pulling Models

```bash
# Pull specific model
ollama pull meditron

# Pull specific version
ollama pull meditron:7b

# Pull quantized version
ollama pull meditron:7b-q4_0
```

### Removing Models

```bash
# Remove specific model
ollama rm meditron:7b-q4_0

# Remove all unused models
ollama prune
```

### Model Storage

Models are stored in:
- **Linux**: `~/.ollama/models/`
- **macOS**: `~/.ollama/models/`
- **Windows**: `%USERPROFILE%\.ollama\models\`

### Storage Requirements

| Model | Size |
|-------|------|
| meditron:7b | 4.1 GB |
| meditron:7b-q4_0 | 2.3 GB |
| meditron:13b | 7.4 GB |
| nomic-embed-text | 274 MB |
| llama3:8b | 4.7 GB |

**Recommended**: Keep 20 GB free disk space for model operations.

---

## Debug Mode

### Ollama Logs

**View Logs (Linux with systemd)**:
```bash
journalctl -u ollama -f
```

**View Logs (macOS)**:
```bash
tail -f ~/.ollama/logs/server.log
```

**Enable Debug Logging**:
```bash
OLLAMA_DEBUG=1 ollama serve
```

### Backend Logs

Enable debug logging in `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Testing Individual Components

**Test Embedding Service**:
```bash
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "Patient has chest pain"
}'
```

**Test LLM Service**:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "meditron",
  "prompt": "What is the treatment for hypertension?",
  "stream": false
}'
```

**Test Backend API**:
```bash
curl http://localhost:3001/health
```

---

## Quick Reference

### Essential Commands

```bash
# Start/Stop
ollama serve                    # Start Ollama
sudo systemctl start ollama     # Start service (Linux)
sudo systemctl stop ollama      # Stop service (Linux)

# Health Checks
curl http://localhost:11434/api/tags
nvidia-smi                      # Check GPU
free -h                         # Check memory

# Model Management
ollama list                     # List models
ollama pull <model>             # Download model
ollama rm <model>               # Remove model
ollama prune                    # Clean unused

# Debugging
journalctl -u ollama -f         # View logs (Linux)
OLLAMA_DEBUG=1 ollama serve     # Debug mode
```

### Common Environment Variables

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=meditron
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.1

# Performance Tuning
OLLAMA_NUM_THREADS=8
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=2
OLLAMA_KEEP_ALIVE=30m

# GPU Configuration
OLLAMA_NUM_GPU=1
OLLAMA_GPU_LAYERS=35
```

### Emergency Procedures

**Ollama Completely Stuck**:
```bash
pkill -9 ollama
rm -rf ~/.ollama/tmp/*
ollama serve
```

**Reset Everything**:
```bash
# WARNING: This removes all models
pkill ollama
rm -rf ~/.ollama/
ollama serve
ollama pull meditron
ollama pull nomic-embed-text
```

---

## Additional Resources

### Documentation
- [Ollama Official Docs](https://ollama.com/docs)
- [Ollama GitHub Issues](https://github.com/ollama/ollama/issues)
- [Meditron Model Card](https://huggingface.co/epfl-llm/meditron-7b)

### Community Support
- [Ollama Discord](https://discord.gg/ollama)
- [Ollama Reddit](https://reddit.com/r/ollama)

### Monitoring Tools
- [Prometheus](https://prometheus.io/) - Metrics collection
- [Grafana](https://grafana.com/) - Metrics visualization
- [netdata](https://www.netdata.cloud/) - Real-time performance monitoring

---

## Getting Help

If you continue to experience issues after trying these solutions:

1. **Check the logs**: `journalctl -u ollama -f` (Linux) or `~/.ollama/logs/` (macOS)
2. **Verify system requirements**: Ensure adequate RAM, disk space, and CPU
3. **Test with minimal configuration**: Use default settings to isolate the issue
4. **Check Ollama GitHub**: Search for similar issues
5. **Document the issue**: Include error messages, logs, and system specifications

For more detailed implementation guidance, see [IMPLEMENTATION.md](./IMPLEMENTATION.md).
