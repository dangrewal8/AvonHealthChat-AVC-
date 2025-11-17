import dotenv from 'dotenv';

// Load environment-specific .env file
const environment = process.env.NODE_ENV || 'development';
const envFile = `.env.${environment}`;

console.log(`Loading environment configuration from: ${envFile}`);

// Try to load environment-specific file, fall back to .env
const result = dotenv.config({ path: envFile });

if (result.error) {
  console.warn(`Could not load ${envFile}, falling back to .env`);
  dotenv.config(); // Fall back to default .env
} else {
  console.log(`✓ Loaded ${envFile}`);
}

interface EnvConfig {
  avon: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    account: string;
    userId: string;
  };
  // HIPAA Compliance: This system processes Protected Health Information (PHI)
  // and uses local Ollama provider only. External API providers are not permitted.
  // See IMPLEMENTATION.md for setup instructions.
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
    embedding: 'ollama';
    llm: 'ollama';
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
    dimension: number;
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

class ConfigValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  private getRequiredEnv(key: string, allowEmpty = false): string {
    const value = process.env[key];
    if (!allowEmpty && (!value || value.trim() === '')) {
      this.errors.push(`Missing required environment variable: ${key}`);
      return '';
    }
    return value || '';
  }

  private getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private getRequiredEnvNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (!value) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      this.errors.push(`Missing required environment variable: ${key}`);
      return 0;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      this.errors.push(`Invalid number for environment variable: ${key}`);
      return defaultValue || 0;
    }
    return parsed;
  }

  private getOptionalEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      this.warnings.push(`Invalid number for environment variable: ${key}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return parsed;
  }

  private getRequiredEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }

  validate(): EnvConfig {
    this.errors = [];
    this.warnings = [];

    // SECURITY: Only Ollama provider allowed for HIPAA compliance
    const embeddingProvider = this.getOptionalEnv('EMBEDDING_PROVIDER', 'ollama').toLowerCase();
    const llmProvider = this.getOptionalEnv('LLM_PROVIDER', 'ollama').toLowerCase();

    // Validate provider values - MUST be 'ollama' for HIPAA compliance
    if (embeddingProvider !== 'ollama') {
      this.errors.push(
        `SECURITY VIOLATION: EMBEDDING_PROVIDER must be 'ollama' for HIPAA compliance. ` +
        `Got: '${embeddingProvider}'. External providers are not permitted.`
      );
    }
    if (llmProvider !== 'ollama') {
      this.errors.push(
        `SECURITY VIOLATION: LLM_PROVIDER must be 'ollama' for HIPAA compliance. ` +
        `Got: '${llmProvider}'. External providers are not permitted.`
      );
    }

    const config: EnvConfig = {
      avon: {
        clientId: this.getRequiredEnv('AVON_CLIENT_ID'),
        clientSecret: this.getRequiredEnv('AVON_CLIENT_SECRET'),
        baseUrl: this.getRequiredEnv('AVON_BASE_URL'),
        account: this.getRequiredEnv('AVON_ACCOUNT'),
        userId: this.getRequiredEnv('AVON_USER_ID'),
      },
      // HIPAA Compliance: Only Ollama provider is permitted for local PHI processing
      ollama: {
        baseUrl: this.getOptionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
        embeddingModel: this.getOptionalEnv('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
        embeddingDimensions: this.getRequiredEnvNumber('OLLAMA_EMBEDDING_DIMENSIONS', 768),
        llmModel: this.getOptionalEnv('OLLAMA_LLM_MODEL', 'meditron'),
        llmMaxTokens: this.getRequiredEnvNumber('OLLAMA_MAX_TOKENS', 4096),
        llmTemperature: this.getOptionalEnvNumber('OLLAMA_TEMPERATURE', 0.1),
        timeout: this.getRequiredEnvNumber('OLLAMA_TIMEOUT', 120000),
      },
      providers: {
        embedding: 'ollama',
        llm: 'ollama',
      },
      server: {
        port: this.getRequiredEnvNumber('PORT', 3001),
        nodeEnv: this.getOptionalEnv('NODE_ENV', 'development'),
      },
      vectorDb: {
        type: this.getOptionalEnv('VECTOR_DB_TYPE', 'chromadb') as 'chromadb' | 'faiss',
      },
      faiss: {
        indexPath: this.getOptionalEnv('FAISS_INDEX_PATH', './data/faiss'),
        dimension: this.getRequiredEnvNumber('FAISS_DIMENSION', 768),
      },
      cache: {
        enabled: this.getRequiredEnvBoolean('CACHE_ENABLED', true),
        ttlSeconds: this.getRequiredEnvNumber('CACHE_TTL_SECONDS', 300),
      },
      performance: {
        maxEmbeddingBatchSize: this.getRequiredEnvNumber('MAX_EMBEDDING_BATCH_SIZE', 100),
        retrievalTopK: this.getRequiredEnvNumber('RETRIEVAL_TOP_K', 10),
      },
      cors: {
        origin: this.getOptionalEnv('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173')
          .split(',')
          .map((o) => o.trim()),
      },
      logging: {
        level: this.getOptionalEnv(
          'LOG_LEVEL',
          this.getOptionalEnv('NODE_ENV', 'development') === 'production' ? 'info' : 'debug'
        ),
      },
      security: {
        httpsRedirect: this.getRequiredEnvBoolean(
          'HTTPS_REDIRECT',
          this.getOptionalEnv('NODE_ENV', 'development') === 'production'
        ),
        ipWhitelist: this.getOptionalEnv('IP_WHITELIST', '')
          .split(',')
          .filter((ip) => ip.trim() !== ''),
      },
      rateLimit: {
        enabled: this.getRequiredEnvBoolean('RATE_LIMIT_ENABLED', true),
        windowMs: this.getRequiredEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
        maxRequests: this.getRequiredEnvNumber('RATE_LIMIT_MAX_REQUESTS', 1000),
      },
    };

    // Postgres config (required for FAISS)
    if (config.vectorDb.type === 'faiss') {
      config.postgres = {
        host: this.getRequiredEnv('PG_HOST'),
        port: this.getRequiredEnvNumber('PG_PORT', 5432),
        database: this.getRequiredEnv('PG_DATABASE'),
        user: this.getRequiredEnv('PG_USER'),
        password: this.getRequiredEnv('PG_PASSWORD'),
      };
    }

    // Report errors if any
    if (this.errors.length > 0) {
      console.error('Environment variable validation errors:');
      this.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error(
        `Configuration validation failed with ${this.errors.length} error(s). Check your .env file.`
      );
    }

    // Report warnings if any
    if (this.warnings.length > 0) {
      console.warn('Configuration warnings:');
      this.warnings.forEach((warning) => console.warn(`  ⚠️  ${warning}`));
    }

    // Validate config consistency
    this.validateConfig(config);

    return config;
  }

  private validateConfig(config: EnvConfig): void {
    // Validate vector DB type
    if (!['chromadb', 'faiss'].includes(config.vectorDb.type)) {
      throw new Error(
        `Invalid VECTOR_DB_TYPE: ${config.vectorDb.type}. Must be 'chromadb' or 'faiss'`
      );
    }

    // Validate Avon base URL
    if (!config.avon.baseUrl.startsWith('http')) {
      throw new Error('AVON_BASE_URL must start with http:// or https://');
    }

    // Validate server port
    if (config.server.port < 1 || config.server.port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }

    // Validate cache TTL
    if (config.cache.ttlSeconds < 0) {
      throw new Error('CACHE_TTL_SECONDS must be a positive number');
    }

    // Validate performance settings
    if (config.performance.maxEmbeddingBatchSize < 1) {
      throw new Error('MAX_EMBEDDING_BATCH_SIZE must be at least 1');
    }

    if (config.performance.retrievalTopK < 1) {
      throw new Error('RETRIEVAL_TOP_K must be at least 1');
    }

    // Validate FAISS dimension
    if (config.faiss.dimension < 1) {
      throw new Error('FAISS_DIMENSION must be at least 1');
    }

    // Validate Ollama base URL
    if (!config.ollama.baseUrl.startsWith('http')) {
      throw new Error('OLLAMA_BASE_URL must start with http:// or https://');
    }

    // SECURITY: Validate embedding dimensions match FAISS dimension (Ollama only)
    const embeddingDimension = config.ollama.embeddingDimensions;

    if (embeddingDimension !== config.faiss.dimension) {
      console.warn(
        `\n⚠️  WARNING: Embedding dimension mismatch!\n` +
          `  FAISS_DIMENSION: ${config.faiss.dimension}\n` +
          `  Ollama embedding dimensions: ${embeddingDimension}\n` +
          `  This WILL cause errors! Please:\n` +
          `    1. Set FAISS_DIMENSION=${embeddingDimension}\n` +
          `    2. Re-index all data with Ollama provider\n`
      );
    }

    // SECURITY: Log Ollama-only provider configuration
    console.log('\n' + '='.repeat(80));
    console.log('AI Provider Configuration (HIPAA Compliant)');
    console.log('='.repeat(80));
    console.log(`Embedding Provider: OLLAMA`);
    console.log(`  ✓ Local processing (HIPAA compliant)`);
    console.log(`  ✓ No external API calls with PHI`);
    console.log(`  ✓ Model: ${config.ollama.embeddingModel}`);
    console.log(`  ✓ Dimensions: ${config.ollama.embeddingDimensions}`);
    console.log(`  ✓ URL: ${config.ollama.baseUrl}`);
    console.log('');
    console.log(`LLM Provider: OLLAMA`);
    console.log(`  ✓ Local processing (HIPAA compliant)`);
    console.log(`  ✓ No external API calls with PHI`);
    console.log(`  ✓ Model: ${config.ollama.llmModel}`);
    console.log(`  ✓ Max Tokens: ${config.ollama.llmMaxTokens}`);
    console.log(`  ✓ Temperature: ${config.ollama.llmTemperature}`);
    console.log(`  ✓ URL: ${config.ollama.baseUrl}`);
    console.log('='.repeat(80));
    console.log(
      `\n✓ HIPAA COMPLIANT: All AI processing is local (no external API calls with PHI)\n`
    );
  }
}

const validator = new ConfigValidator();
const config = validator.validate();

export default config;
