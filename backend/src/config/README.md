# Backend Configuration

This directory contains environment configuration and validation for the Avon Health RAG backend.

## ⚠️ HIPAA COMPLIANCE REQUIREMENTS

**CRITICAL SECURITY NOTICE**: This system processes Protected Health Information (PHI).

**REQUIREMENTS**:
- ✅ **ALLOWED**: Local Ollama provider ONLY
- ❌ **FORBIDDEN**: External API providers (OpenAI, Anthropic, Cohere, etc.)

**REASON**: External APIs would send PHI to third-party servers, violating HIPAA.

**SETUP**: See [OLLAMA_IMPLEMENTATION.md](../../OLLAMA_IMPLEMENTATION.md) for detailed setup instructions.

---

## Usage

The configuration is automatically loaded and validated when the application starts:

```typescript
import config from './config/env.config';

// Access configuration values
console.log(config.server.port);
console.log(config.avon.baseUrl);
console.log(config.vectorDb.type);
console.log(config.ollama.llmModel); // HIPAA-compliant local provider
```

## Configuration Structure

```typescript
interface EnvConfig {
  avon: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
  };
  // HIPAA Compliance: Only local Ollama provider is supported
  ollama: {
    baseUrl: string;
    embeddingModel: string;
    embeddingDimensions: number;
    llmModel: string;
    llmMaxTokens: number;
    llmTemperature: number;
    timeout: number;
  };
  providers: {
    embedding: 'ollama'; // SECURITY: Only 'ollama' allowed
    llm: 'ollama';       // SECURITY: Only 'ollama' allowed
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  vectorDb: {
    type: 'chromadb' | 'faiss';
  };
  faiss: {
    indexPath: string;
    dimension: number; // Must be 768 for Ollama nomic-embed-text
  };
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
  performance: {
    maxEmbeddingBatchSize: number;
    retrievalTopK: number;
  };
  cors: {
    origin: string[];
  };
  logging: {
    level: string;
  };
  security: {
    httpsRedirect: boolean;
    ipWhitelist: string[];
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}
```

## Validation

The configuration loader validates:

1. **Required variables** - Throws error if missing
2. **Type validation** - Ensures numbers are valid
3. **Value validation** - Checks ranges and formats
4. **Conditional validation** - PostgreSQL config required if using FAISS
5. **Security enforcement** - Only Ollama provider is permitted

## Required Environment Variables

### Avon Health API
- `AVON_CLIENT_ID` - Avon Health API client ID
- `AVON_CLIENT_SECRET` - Avon Health API client secret
- `AVON_BASE_URL` - Avon Health API base URL

### AI Provider Configuration (SECURITY: Ollama ONLY)
- `EMBEDDING_PROVIDER` - Must be `ollama` (enforced)
- `LLM_PROVIDER` - Must be `ollama` (enforced)

### Ollama Configuration
- `OLLAMA_BASE_URL` - Default: `http://localhost:11434`
- `OLLAMA_EMBEDDING_MODEL` - Default: `nomic-embed-text`
- `OLLAMA_EMBEDDING_DIMENSIONS` - Default: `768`
- `OLLAMA_LLM_MODEL` - Default: `meditron` (medical-specific model)
- `OLLAMA_MAX_TOKENS` - Default: `4096`
- `OLLAMA_TEMPERATURE` - Default: `0.1`
- `OLLAMA_TIMEOUT` - Default: `120000` (120 seconds)

## Optional Environment Variables

### Server Configuration
- `PORT` - Default: `3001`
- `NODE_ENV` - Default: `development`

### Vector Database
- `VECTOR_DB_TYPE` - Default: `chromadb` (options: `chromadb` | `faiss`)
- `FAISS_INDEX_PATH` - Default: `./data/faiss`
- `FAISS_DIMENSION` - Default: `768` (MUST match Ollama embedding dimensions)

### Cache Configuration
- `CACHE_ENABLED` - Default: `true`
- `CACHE_TTL_SECONDS` - Default: `300`

### Performance Configuration
- `MAX_EMBEDDING_BATCH_SIZE` - Default: `100`
- `RETRIEVAL_TOP_K` - Default: `10`

### CORS Configuration
- `CORS_ORIGIN` - Default: `http://localhost:3000,http://localhost:5173`

### Logging
- `LOG_LEVEL` - Default: `info` in production, `debug` in development

### Security
- `HTTPS_REDIRECT` - Default: `true` in production, `false` in development
- `IP_WHITELIST` - Comma-separated list of allowed IP addresses (optional)

### Rate Limiting
- `RATE_LIMIT_ENABLED` - Default: `true`
- `RATE_LIMIT_WINDOW_MS` - Default: `900000` (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Default: `1000`

## PostgreSQL Variables (Required if VECTOR_DB_TYPE=faiss)

- `PG_HOST`
- `PG_PORT` - Default: `5432`
- `PG_DATABASE`
- `PG_USER`
- `PG_PASSWORD`

## Error Handling

If validation fails, the application will:
1. Print all validation errors to console
2. Throw an error with a summary
3. Prevent the application from starting

### Example Error Output

```
Environment variable validation errors:
  - Missing required environment variable: AVON_CLIENT_ID
  - SECURITY VIOLATION: LLM_PROVIDER must be 'ollama' for HIPAA compliance. Got: 'openai'. External providers are not permitted.
Error: Configuration validation failed with 2 error(s). Check your .env file.
```

## Security Enforcement

The configuration system enforces HIPAA compliance at startup:

```typescript
// ✅ ALLOWED: Ollama provider
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama

// ❌ FORBIDDEN: Will throw SECURITY VIOLATION error
EMBEDDING_PROVIDER=openai  // ERROR: External provider not permitted
LLM_PROVIDER=openai        // ERROR: External provider not permitted
```

Any attempt to use a non-Ollama provider will result in a **SECURITY VIOLATION** error and prevent the application from starting.

## HIPAA Compliance Setup

### Step 1: Install Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama Service

```bash
ollama serve
```

### Step 3: Pull Required Models

```bash
# Embedding model (768 dimensions)
ollama pull nomic-embed-text

# Medical LLM model (recommended for healthcare)
ollama pull meditron
```

### Step 4: Verify Installation

```bash
curl http://localhost:11434/api/tags
```

### Step 5: Configure Environment

```bash
# Set in .env.development or .env.production
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=meditron
FAISS_DIMENSION=768
```

## External API Providers

External API providers are not supported. This system is designed for HIPAA-compliant local processing only.

**Important**: Only local Ollama provider is supported. Sending PHI to external APIs violates HIPAA requirements.

---

## Troubleshooting

### Error: "SECURITY VIOLATION: EMBEDDING_PROVIDER must be 'ollama'"

**Cause**: Attempting to use non-Ollama provider for embeddings.

**Solution**: Set `EMBEDDING_PROVIDER=ollama` in your .env file.

### Error: "SECURITY VIOLATION: LLM_PROVIDER must be 'ollama'"

**Cause**: Attempting to use non-Ollama provider for LLM.

**Solution**: Set `LLM_PROVIDER=ollama` in your .env file.

### Error: "Ollama LLM provider is not available"

**Cause**: Ollama service is not running or models are not installed.

**Solution**:
1. Start Ollama: `ollama serve`
2. Install models: `ollama pull meditron && ollama pull nomic-embed-text`
3. Verify: `curl http://localhost:11434/api/tags`

### Error: "Embedding dimension mismatch"

**Cause**: FAISS_DIMENSION doesn't match Ollama embedding dimensions.

**Solution**: Set `FAISS_DIMENSION=768` to match Ollama nomic-embed-text model.

---

## Additional Resources

- [Ollama Documentation](https://github.com/jmorganca/ollama)
- [Meditron Model](https://ollama.ai/library/meditron)
- [Nomic Embed Text](https://ollama.ai/library/nomic-embed-text)
- [HIPAA Compliance Guide](../../docs/HIPAA_COMPLIANCE.md)
- [Ollama Implementation Guide](../../OLLAMA_IMPLEMENTATION.md)
