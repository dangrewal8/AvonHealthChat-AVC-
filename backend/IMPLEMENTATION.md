# AI Implementation Guide

**Comprehensive documentation for the Ollama-powered RAG system**

---

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Architecture](#architecture)
4. [Usage Examples](#usage-examples)
5. [Configuration Reference](#configuration-reference)
6. [Testing](#testing)
7. [Performance](#performance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Ollama?

Ollama is a local LLM runtime that enables running large language models on your own hardware. It provides:

- **Local Inference**: Run models on-premises without external API calls
- **Privacy**: All data stays within your infrastructure
- **Cost Efficiency**: No per-token API charges
- **Model Flexibility**: Support for various open-source models
- **Simple REST API**: Easy HTTP interface for inference

### Why Ollama for Medical AI?

| Benefit | Description |
|---------|-------------|
| **HIPAA Compliance** | Medical data never leaves your servers |
| **Cost Savings** | No API charges for production workloads |
| **Data Privacy** | Complete control over patient information |
| **Customization** | Fine-tune models for medical use cases |
| **Offline Capability** | System works without internet connectivity |
| **Predictable Performance** | No rate limits or API quotas |

### Medical Models

#### Meditron 7B

Specialized medical LLM trained on PubMed, clinical guidelines, and medical literature.

- **Base Model**: Llama-2 7B
- **Training Data**: 48GB medical text corpus
- **Strengths**: Clinical Q&A, entity extraction, treatment analysis
- **Context**: 4096 tokens
- **Recommended Use**: Medical question answering, clinical summarization

#### Nomic Embed Text

High-quality embedding model for semantic search.

- **Dimensions**: 768
- **Context Length**: 8192 tokens
- **Use Case**: Document embeddings, similarity search
- **Performance**: Optimized for retrieval tasks

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Avon Health RAG System                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐            ┌────────▼────────┐
            │  LLM Factory   │            │ Embedding       │
            │   Service      │            │  Factory        │
            └───────┬────────┘            └────────┬────────┘
                    │                               │
         ┌──────────┴──────────┐         ┌─────────┴─────────┐
         │                     │         │                   │
    ┌────▼─────┐               │    ┌───▼──────┐            │
    │ Ollama   │               │    │  Ollama  │            │
    │   LLM    │               │    │ Embedding│            │
    └────┬─────┘               │    └────┬─────┘            │
         │                     │         │                  │
         │  ┌────────────────────────────┐  │
         └──►   Ollama Service           ◄──┘
            │   (localhost:11434)        │
            └──────────┬─────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
    │Meditron │   │ Llama3  │   │ Nomic  │
    │  (7B)   │   │  (8B)   │   │ Embed  │
    └─────────┘   └─────────┘   └────────┘
```

### System Flow

```
1. User Query
   ↓
2. Embedding Factory → Ollama (nomic-embed-text) → 768D vector
   ↓
3. FAISS Vector Store → Semantic Search → Top-K Documents
   ↓
4. Context + Query → Medical Prompt Template
   ↓
5. LLM Factory → Ollama (Meditron) → Medical Response
   ↓
6. Response with Citations
```

---

## Installation & Setup

### Prerequisites

- **OS**: Linux, macOS, or Windows (WSL2)
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: 10GB free for models
- **CPU**: Modern multi-core processor
- **GPU**: Optional (NVIDIA with CUDA for faster inference)

### Step 1: Install Ollama

#### Linux / macOS

```bash
# Install via curl
curl -fsSL https://ollama.ai/install.sh | sh

# Verify installation
ollama --version
```

#### Windows (WSL2)

```powershell
# Install WSL2 first
wsl --install

# Inside WSL2 terminal
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Manual Installation

Download from: https://ollama.com/download

### Step 2: Start Ollama Service

```bash
# Start Ollama server (foreground)
ollama serve

# Or run as background process (Linux/macOS)
ollama serve &
```

**Verify Service**:
```bash
curl http://localhost:11434/api/tags
# Should return JSON with available models
```

### Step 3: Pull Required Models

```bash
# Pull Meditron (medical LLM)
ollama pull meditron

# Pull Nomic Embed Text (embeddings)
ollama pull nomic-embed-text

# Verify models are available
ollama list
```

**Expected Output**:
```
NAME                 ID           SIZE     MODIFIED
meditron:latest      a1b2c3d4...  4.1 GB   2 minutes ago
nomic-embed-text:... e5f6g7h8...  274 MB   1 minute ago
```

### Step 4: Configure Backend

Navigate to the backend directory and set up environment variables:

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# Ollama Configuration
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=meditron
OLLAMA_MAX_TOKENS=4096
OLLAMA_TEMPERATURE=0.1

# Vector Database
VECTOR_DB_TYPE=faiss
FAISS_DIMENSION=768
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Run Tests

```bash
# Type check
npm run type-check

# Run tests
npm test

# Run integration tests
npm test -- ollama-rag.test.ts
```

---

## Architecture

### Factory Pattern

The system uses the **Factory Pattern** to abstract AI providers, making the codebase modular and testable.

#### Benefits

1. **Provider Agnostic**: Application code doesn't depend on specific implementations
2. **Easy Configuration**: Change models via environment variables
3. **Testing**: Mock providers for unit tests
4. **Maintainability**: Clear separation of concerns

#### Implementation

```typescript
// embedding-factory.service.ts
class EmbeddingFactory {
  private provider: EmbeddingProvider;

  constructor() {
    const providerType = process.env.EMBEDDING_PROVIDER || 'ollama';

    if (providerType === 'ollama') {
      this.provider = new OllamaEmbeddingProvider();
    } else {
      throw new Error(
        'Only Ollama provider is supported for HIPAA compliance'
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }
}
```

### Service Dependencies

```
┌────────────────────────────────────────────────────────────┐
│                    Express Routes                          │
└───────────────────┬────────────────────────────────────────┘
                    │
            ┌───────▼───────┐
            │  RAG Pipeline │
            │    Service    │
            └───┬───────┬───┘
                │       │
    ┌───────────┘       └──────────┐
    │                              │
┌───▼──────────┐         ┌─────────▼─────┐
│  Embedding   │         │   LLM         │
│  Factory     │         │   Factory     │
└───┬──────────┘         └─────────┬─────┘
    │                              │
┌───▼──────────┐         ┌─────────▼─────┐
│  Ollama      │         │   Ollama      │
│  Embedding   │         │   LLM         │
│  Service     │         │   Service     │
└──────────────┘         └───────────────┘
```

### Key Services

#### 1. **ollama-embedding.service.ts**

Generates vector embeddings for text using nomic-embed-text.

```typescript
async generateEmbedding(text: string): Promise<number[]> {
  const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
    model: 'nomic-embed-text',
    prompt: text
  });
  return response.data.embedding; // Returns 768-dimensional vector
}
```

#### 2. **ollama-llm.service.ts**

Generates text completions using Meditron.

```typescript
async generateCompletion(prompt: string): Promise<string> {
  const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
    model: 'meditron',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 4096
    }
  });
  return response.data.response;
}
```

#### 3. **embedding-factory.service.ts**

Provides unified interface for embeddings.

```typescript
const embeddingService = {
  async generateEmbedding(text: string): Promise<number[]> {
    return ollamaEmbeddingService.generateEmbedding(text);
  },

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }
};
```

#### 4. **llm-factory.service.ts**

Provides unified interface for LLM operations.

```typescript
const llmService = {
  async generateCompletion(
    prompt: string,
    options?: CompletionOptions
  ): Promise<string> {
    return ollamaLLMService.generateCompletion(prompt, options);
  },

  async generateStream(prompt: string): AsyncIterable<string> {
    return ollamaLLMService.generateStream(prompt);
  }
};
```

---

## Usage Examples

### Example 1: Generate Embedding

```typescript
import embeddingService from './services/embedding-factory.service';

const text = "Patient presents with chest pain and shortness of breath";
const embedding = await embeddingService.generateEmbedding(text);
console.log(`Generated ${embedding.length}D vector`); // 768D vector
```

### Example 2: Generate Medical Response

```typescript
import llmService from './services/llm-factory.service';

const prompt = `
Based on the following clinical note, summarize the patient's condition:

Clinical Note:
Patient presents with acute chest pain radiating to left arm.
BP: 140/90, HR: 95, Temp: 98.6°F.

Summary:
`;

const response = await llmService.generateCompletion(prompt);
console.log(response);
```

### Example 3: RAG Pipeline

```typescript
import ragPipeline from './services/rag-pipeline.service';

const query = "What medications is the patient taking?";
const patientId = "patient_123";

const result = await ragPipeline.query({
  query,
  patientId,
  topK: 5
});

console.log('Answer:', result.answer);
console.log('Sources:', result.sources);
console.log('Citations:', result.citations);
```

### Example 4: Batch Indexing

```typescript
import embeddingService from './services/embedding-factory.service';
import faissService from './services/faiss-vector-store.service';

// Fetch patient documents
const documents = await fetchPatientDocuments(patientId);

// Generate embeddings
const embeddings = await embeddingService.generateBatchEmbeddings(
  documents.map(d => d.text)
);

// Index in FAISS
await faissService.addVectors(embeddings, documents.map(d => d.id));
```

---

## Configuration Reference

### Environment Variables

#### Ollama Configuration

| Variable | Options | Default | Description |
|----------|---------|---------|-------------|
| `EMBEDDING_PROVIDER` | `ollama` | `ollama` | Embedding service provider |
| `LLM_PROVIDER` | `ollama` | `ollama` | LLM service provider |
| `OLLAMA_BASE_URL` | URL | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_EMBEDDING_MODEL` | string | `nomic-embed-text` | Embedding model name |
| `OLLAMA_LLM_MODEL` | string | `meditron` | LLM model name |
| `OLLAMA_MAX_TOKENS` | int | `4096` | Max generation tokens |
| `OLLAMA_TEMPERATURE` | float | `0.1` | Sampling temperature (0-1) |
| `OLLAMA_TOP_P` | float | `0.9` | Nucleus sampling threshold |
| `OLLAMA_NUM_THREADS` | int | Auto | CPU threads for inference |

#### Vector Database Configuration

| Variable | Options | Default | Description |
|----------|---------|---------|-------------|
| `VECTOR_DB_TYPE` | `faiss`, `chroma` | `faiss` | Vector database type |
| `FAISS_DIMENSION` | int | `768` | Vector dimensions (must match embedding model) |
| `FAISS_INDEX_PATH` | path | `./data/faiss` | FAISS index storage location |

### Model Selection

#### Embedding Models

| Model | Dimensions | Use Case |
|-------|------------|----------|
| `nomic-embed-text` | 768 | General text embeddings (recommended) |
| `mxbai-embed-large` | 1024 | Higher quality, slower |
| `all-minilm` | 384 | Faster, lower quality |

#### LLM Models

| Model | Size | Use Case |
|-------|------|----------|
| `meditron` | 7B | Medical domain (recommended) |
| `llama3` | 8B | General purpose |
| `mistral` | 7B | Fast inference |
| `mixtral` | 47B | Highest quality (requires GPU) |

### Hardware Optimization

#### CPU-Only Configuration

```env
OLLAMA_NUM_THREADS=8
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=1
```

**Expected Performance**:
- Embedding: 2-5s per document
- LLM: 20-40s per response

#### GPU Configuration

```env
OLLAMA_NUM_GPU=1
OLLAMA_GPU_LAYERS=35
OLLAMA_MAX_LOADED_MODELS=2
```

**Expected Performance**:
- Embedding: 100-200ms per document
- LLM: 2-5s per response

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- ollama-embedding.test.ts
npm test -- ollama-llm.test.ts

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Test complete RAG pipeline
npm test -- ollama-rag.test.ts

# Test Meditron specifically
npm run test:meditron
```

### Manual Testing

#### Test Embedding Generation

```bash
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "This is a test document"
}'
```

#### Test LLM Generation

```bash
ollama run meditron "What is diabetes type 2?"
```

#### Test Full Pipeline

```bash
# Start backend
npm run dev

# In another terminal, test API
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What medications is the patient taking?",
    "patient_id": "test_patient"
  }'
```

---

## Performance

### Benchmarks

#### Embedding Generation (nomic-embed-text)

| Hardware | Time per Doc | Throughput |
|----------|--------------|------------|
| CPU (8 cores) | 3-5s | 12-20 docs/min |
| GPU (RTX 3060) | 100-200ms | 300-600 docs/min |
| GPU (A100) | 50-100ms | 600-1200 docs/min |

#### LLM Generation (Meditron 7B)

| Hardware | Time per Query | Tokens/sec |
|----------|----------------|------------|
| CPU (8 cores) | 25-40s | 10-15 |
| GPU (RTX 3060) | 3-6s | 60-100 |
| GPU (A100) | 2-4s | 120-200 |

### Optimization Tips

1. **Use GPU**: 10-20x faster inference
2. **Batch Embeddings**: Generate multiple embeddings in parallel
3. **Cache Results**: Cache embeddings and frequent queries
4. **Model Quantization**: Use Q4 or Q5 quantized models for faster inference
5. **Warm-up**: Keep models loaded in memory with `OLLAMA_KEEP_ALIVE`

### Memory Requirements

| Model | Quantization | RAM Required |
|-------|--------------|--------------|
| Meditron 7B | Full (FP16) | 14 GB |
| Meditron 7B | Q5 | 6 GB |
| Meditron 7B | Q4 | 4 GB |
| Nomic Embed | Full | 500 MB |

---

## Troubleshooting

### Common Issues

#### Issue 1: Ollama Not Running

**Symptoms**: `ECONNREFUSED` errors

**Solution**:
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

#### Issue 2: Model Not Found

**Symptoms**: "Model not found" errors

**Solution**:
```bash
# Pull the required models
ollama pull meditron
ollama pull nomic-embed-text

# Verify
ollama list
```

#### Issue 3: Slow Performance

**Symptoms**: >30s response times

**Solution**:
- Enable GPU acceleration (see Hardware Optimization)
- Use quantized models (q4_0, q5_0)
- Increase `OLLAMA_NUM_THREADS`

#### Issue 4: Out of Memory

**Symptoms**: OOM errors, crashes

**Solution**:
- Use smaller or quantized models
- Reduce `OLLAMA_MAX_LOADED_MODELS`
- Increase system swap space
- Use a machine with more RAM

For more detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Additional Resources

### Documentation

- [Ollama Official Docs](https://ollama.com/docs)
- [Meditron Model Card](https://huggingface.co/epfl-llm/meditron-7b)
- [Nomic Embed Documentation](https://www.nomic.ai/blog/nomic-embed-text-v1)

### Model Repository

- [Ollama Model Library](https://ollama.com/library)
- [Meditron on Ollama](https://ollama.com/library/meditron)

### Community

- [Ollama GitHub](https://github.com/ollama/ollama)
- [Ollama Discord](https://discord.gg/ollama)

---

## License

MIT
