"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const env_config_1 = __importDefault(require("./config/env.config"));
const index_1 = require("./routes/index");
const metrics_controller_1 = __importDefault(require("./controllers/metrics.controller"));
const validation_middleware_1 = require("./middleware/validation.middleware");
// Security middleware imports
const security_middleware_1 = require("./middleware/security.middleware");
const sanitization_middleware_1 = require("./middleware/sanitization.middleware");
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
// AI Provider validation imports
const embedding_factory_service_1 = require("./services/embedding-factory.service");
const llm_factory_service_1 = require("./services/llm-factory.service");
// Storage service imports
const faiss_vector_store_service_1 = __importDefault(require("./services/faiss-vector-store.service"));
const metadata_db_service_1 = __importDefault(require("./services/metadata-db.service"));
const app = (0, express_1.default)();
// 1. Request ID (for tracking)
app.use(security_middleware_1.requestId);
// 2. Security logging (for monitoring)
app.use(security_middleware_1.securityLogger);
// 3. Helmet security headers
app.use(security_middleware_1.helmetConfig);
// 4. CORS configuration
app.use(security_middleware_1.corsConfig);
// 5. HTTPS enforcement (disabled for local demo)
// app.use(httpsEnforcement);
// 6. Additional security headers
app.use(security_middleware_1.securityHeaders);
// 7. Global rate limiting
app.use(rate_limit_middleware_1.globalRateLimiter);
// 8. Suspicious activity detection
app.use(security_middleware_1.suspiciousActivityDetection);
// 9. Request size validation
app.use(sanitization_middleware_1.validateRequestSize);
// 10. Content type validation
app.use(sanitization_middleware_1.validateContentType);
// 11. JSON parsing (must be before sanitization)
app.use(express_1.default.json({ limit: '10mb' }));
// 12. Input sanitization
app.use(sanitization_middleware_1.sanitizeInput);
// 13. HTTP request logging
app.use((0, morgan_1.default)('dev'));
// Metrics tracking middleware (tracks all requests)
app.use(metrics_controller_1.default.trackRequest.bind(metrics_controller_1.default));
// Mount all API routes
app.use((0, index_1.createRouter)());
// Error handling middleware (must be last)
app.use(validation_middleware_1.errorHandler);
/**
 * Validate Ollama availability on startup
 *
 * HIPAA Compliance: Ensures local Ollama provider is accessible before
 * accepting requests that would process PHI.
 */
async function validateOllamaOnStartup() {
    console.log('\n🔍 Validating Ollama AI provider (HIPAA compliance check)...');
    try {
        // Validate embedding provider
        console.log('   Checking Ollama embedding service...');
        await (0, embedding_factory_service_1.validateProvider)('ollama');
        console.log('   ✓ Ollama embedding service is healthy');
        // Validate LLM provider
        console.log('   Checking Ollama LLM service...');
        await (0, llm_factory_service_1.validateProvider)('ollama');
        console.log('   ✓ Ollama LLM service is healthy');
        console.log('✅ Ollama validation complete - All services operational\n');
    }
    catch (error) {
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
async function initializeStorageServices() {
    console.log('\n🗄️  Initializing storage services...');
    try {
        // Initialize FAISS vector store with 768 dimensions (nomic-embed-text)
        console.log('   Initializing FAISS vector store (768 dimensions)...');
        await faiss_vector_store_service_1.default.initialize(768);
        console.log('   ✓ FAISS vector store initialized');
        // Try to connect to PostgreSQL for metadata storage (optional)
        console.log('   Connecting to PostgreSQL metadata database...');
        try {
            await metadata_db_service_1.default.connect({
                host: 'localhost',
                port: 5432,
                database: 'avon_rag_dev',
                user: 'postgres',
                password: 'postgres',
            });
            console.log('   ✓ PostgreSQL metadata database connected');
        }
        catch (dbError) {
            console.warn('   ⚠️  PostgreSQL not available - metadata storage will be in-memory only');
            console.warn('   For production, set up PostgreSQL using docker-compose or install locally');
        }
        console.log('✅ Storage services initialization complete\n');
    }
    catch (error) {
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
async function startServer() {
    // Validate Ollama before starting server
    await validateOllamaOnStartup();
    // Initialize storage services
    await initializeStorageServices();
    // Start listening for requests
    app.listen(env_config_1.default.server.port, () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   AVON HEALTH RAG BACKEND - SERVER STARTED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✓ Server running on port ${env_config_1.default.server.port}`);
        console.log(`✓ Environment: ${env_config_1.default.server.nodeEnv}`);
        console.log(`✓ Vector DB: ${env_config_1.default.vectorDb.type}`);
        console.log(`✓ Cache enabled: ${env_config_1.default.cache.enabled}`);
        console.log(`✓ Avon Health API: ${env_config_1.default.avon.baseUrl}`);
        console.log(`✓ AI Provider: Ollama (HIPAA compliant - local processing)`);
        console.log(`✓ Configuration validated successfully`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`🚀 Ready to process requests at http://localhost:${env_config_1.default.server.port}\n`);
    });
}
// Start the server with validation
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map