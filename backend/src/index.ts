import express, { Application } from 'express';
import morgan from 'morgan';
import config from './config/env.config';
import { createRouter } from './routes/index';
import metricsController from './controllers/metrics.controller';
import { errorHandler } from './middleware/validation.middleware';

// Security middleware imports
import {
  helmetConfig,
  corsConfig,
  httpsEnforcement,
  securityHeaders,
  securityLogger,
  suspiciousActivityDetection,
  requestId,
} from './middleware/security.middleware';
import {
  sanitizeInput,
  validateContentType,
  validateRequestSize,
} from './middleware/sanitization.middleware';
import { globalRateLimiter } from './middleware/rate-limit.middleware';

// AI Provider validation imports
import { validateProvider as validateEmbeddingProvider } from './services/embedding-factory.service';
import { validateProvider as validateLLMProvider } from './services/llm-factory.service';

// Storage service imports
import faissVectorStore from './services/faiss-vector-store.service';
import metadataDB from './services/metadata-db.service';
import hybridSearchEngine from './services/hybrid-search.service';
import indexingAgent from './services/indexing-agent.service';
import queryHistoryService from './services/query-history.service';

const app: Application = express();

// 1. Request ID (for tracking)
app.use(requestId);

// 2. Security logging (for monitoring)
app.use(securityLogger);

// 3. Helmet security headers
app.use(helmetConfig);

// 4. CORS configuration
app.use(corsConfig);

// 5. HTTPS enforcement (disabled for local demo)
// app.use(httpsEnforcement);

// 6. Additional security headers
app.use(securityHeaders);

// 7. Global rate limiting
app.use(globalRateLimiter);

// 8. Suspicious activity detection
app.use(suspiciousActivityDetection);

// 9. Request size validation
app.use(validateRequestSize);

// 10. Content type validation
app.use(validateContentType);

// 11. JSON parsing (must be before sanitization)
app.use(express.json({ limit: '10mb' }));

// 12. Input sanitization
app.use(sanitizeInput);

// 13. HTTP request logging
app.use(morgan('dev'));

// Metrics tracking middleware (tracks all requests)
app.use(metricsController.trackRequest.bind(metricsController));

// Mount all API routes
app.use(createRouter());

// Error handling middleware (must be last)
app.use(errorHandler);

/**
 * Validate Ollama availability on startup
 *
 * HIPAA Compliance: Ensures local Ollama provider is accessible before
 * accepting requests that would process PHI.
 */
async function validateOllamaOnStartup(): Promise<void> {
  console.log('\n🔍 Validating Ollama AI provider (HIPAA compliance check)...');

  try {
    // Validate embedding provider
    console.log('   Checking Ollama embedding service...');
    await validateEmbeddingProvider('ollama');
    console.log('   ✓ Ollama embedding service is healthy');

    // Validate LLM provider
    console.log('   Checking Ollama LLM service...');
    await validateLLMProvider('ollama');
    console.log('   ✓ Ollama LLM service is healthy');

    console.log('✅ Ollama validation complete - All services operational\n');
  } catch (error) {
    console.error('\n❌ STARTUP VALIDATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Ollama AI provider is not available or not configured properly.');
    console.error('This system requires Ollama for HIPAA-compliant local AI processing.\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(error.message);
    }

    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Server startup aborted. Fix Ollama configuration and try again.\n');

    process.exit(1);
  }
}

/**
 * Initialize storage services (FAISS vector store and metadata DB)
 *
 * These services are required for the indexing pipeline to persist embeddings.
 */
async function initializeStorageServices(): Promise<void> {
  console.log('\n🗄️  Initializing storage services...');

  try {
    // Initialize FAISS vector store with 768 dimensions (nomic-embed-text)
    console.log('   Initializing FAISS vector store (768 dimensions)...');

    // Try to load existing index from disk first
    try {
      await faissVectorStore.load();
      console.log('   ✓ FAISS vector store loaded from disk');
      const stats = faissVectorStore.getStats();
      console.log(`   ✓ Loaded ${stats.totalVectors} vectors, ${stats.idMappings} ID mappings`);
    } catch (loadError) {
      // Index doesn't exist yet - initialize new one
      console.log('   No existing index found, initializing new FAISS index...');
      await faissVectorStore.initialize(768);
      console.log('   ✓ FAISS vector store initialized (empty)');
    }

    // Try to connect to PostgreSQL for metadata storage (optional)
    console.log('   Connecting to PostgreSQL metadata database...');
    try {
      await metadataDB.connect({
        host: 'localhost',
        port: 5432,
        database: 'avon_rag_dev',
        user: 'postgres',
        password: 'postgres',
      });
      console.log('   ✓ PostgreSQL metadata database connected');
    } catch (dbError) {
      console.warn('   ⚠️  PostgreSQL not available - metadata storage will be in-memory only');
      console.warn('   For production, set up PostgreSQL using docker-compose or install locally');
    }

    // Load hybrid search index from disk (if exists)
    console.log('   Loading hybrid search index...');
    try {
      await hybridSearchEngine.load();
      console.log('   ✓ Hybrid search index loaded from disk');
      const stats = hybridSearchEngine.getStats();
      console.log(`   ✓ Loaded ${stats.totalDocuments} documents, ${stats.uniqueTerms} unique terms`);
    } catch (loadError) {
      console.log('   No existing hybrid search index found (will be created on first indexing)');
    }

    // Load metadata cache from disk (if exists)
    console.log('   Loading metadata cache...');
    try {
      await indexingAgent.loadMetadataCache();
      console.log('   ✓ Metadata cache loaded from disk');
      const stats = indexingAgent.getMetadataCacheStats();
      console.log(`   ✓ Loaded ${stats.totalChunks} chunks, ${stats.totalPatients} patients`);
    } catch (loadError) {
      console.log('   No existing metadata cache found (will be created on first indexing)');
    }

    // Load query history from disk (if exists)
    console.log('   Loading query history...');
    try {
      await queryHistoryService.load();
      console.log('   ✓ Query history loaded from disk');
      const stats = queryHistoryService.getStats();
      console.log(`   ✓ Loaded ${stats.totalQueries} queries for ${stats.totalPatients} patients`);
    } catch (loadError) {
      console.log('   No existing query history found (will be created on first query)');
    }

    console.log('✅ Storage services initialization complete\n');
  } catch (error) {
    console.error('\n❌ STORAGE INITIALIZATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Failed to initialize storage services for indexing pipeline.');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(error.message);
    }

    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Server startup aborted. Fix storage configuration and try again.\n');

    process.exit(1);
  }
}

/**
 * Start the Express server
 */
async function startServer(): Promise<void> {
  // Validate Ollama before starting server
  await validateOllamaOnStartup();

  // Initialize storage services
  await initializeStorageServices();

  // Start listening for requests
  app.listen(config.server.port, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   AVON HEALTH RAG BACKEND - SERVER STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ Server running on port ${config.server.port}`);
    console.log(`✓ Environment: ${config.server.nodeEnv}`);
    console.log(`✓ Vector DB: ${config.vectorDb.type}`);
    console.log(`✓ Cache enabled: ${config.cache.enabled}`);
    console.log(`✓ Avon Health API: ${config.avon.baseUrl}`);
    console.log(`✓ AI Provider: Ollama (HIPAA compliant - local processing)`);
    console.log(`✓ Configuration validated successfully`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🚀 Ready to process requests at http://localhost:${config.server.port}\n`);
  });
}

// Start the server with validation
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
