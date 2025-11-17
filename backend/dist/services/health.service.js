"use strict";
/**
 * Health Check Service
 *
 * Provides health check functionality for monitoring system status.
 * Supports Ollama provider with comprehensive diagnostics (HIPAA-compliant).
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthService = exports.HealthService = void 0;
const env_config_1 = __importDefault(require("../config/env.config"));
const llm_factory_service_1 = __importDefault(require("./llm-factory.service"));
const embedding_factory_service_1 = __importDefault(require("./embedding-factory.service"));
const llm_factory_service_2 = require("./llm-factory.service");
const embedding_factory_service_2 = require("./embedding-factory.service");
/**
 * Health Check Service
 */
class HealthService {
    startTime;
    constructor() {
        this.startTime = Date.now();
    }
    /**
     * Comprehensive health check
     */
    async checkHealth() {
        const checks = {};
        // Get provider info
        const providers = await this.getProviderInfo();
        // Check LLM service (Ollama)
        checks.llm = await this.checkLLM();
        // Check Embedding service (Ollama)
        checks.embedding = await this.checkEmbedding();
        // Check Avon API
        checks.avonapi = await this.checkAvonAPI();
        // Check Vector DB
        checks.vectordb = await this.checkVectorDB();
        // Check Cache (optional)
        if (env_config_1.default.cache.enabled) {
            checks.cache = this.checkCache();
        }
        // Check Ollama service if using Ollama provider
        let ollamaHealth;
        if (providers.llm === 'ollama' || providers.embedding === 'ollama') {
            ollamaHealth = await this.checkOllama();
        }
        // Determine overall status
        const allUp = Object.values(checks).every(c => c.status === 'up');
        const anyDown = Object.values(checks).some(c => c.status === 'down');
        return {
            status: allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: env_config_1.default.server.nodeEnv,
            providers,
            checks,
            services: ollamaHealth ? { ollama: ollamaHealth } : undefined,
        };
    }
    /**
     * Get provider information
     */
    async getProviderInfo() {
        try {
            const llmInfo = await (0, llm_factory_service_2.getProviderInfo)();
            const embeddingInfo = await (0, embedding_factory_service_2.getProviderInfo)();
            return {
                llm: llmInfo.provider,
                embedding: embeddingInfo.provider,
            };
        }
        catch (error) {
            // Fallback to env vars
            return {
                llm: process.env.LLM_PROVIDER?.toLowerCase() || 'ollama',
                embedding: process.env.EMBEDDING_PROVIDER?.toLowerCase() || 'ollama',
            };
        }
    }
    /**
     * Check LLM service status (Ollama)
     */
    async checkLLM() {
        // Skip if test environment
        if (env_config_1.default.server.nodeEnv === 'test') {
            return {
                status: 'up',
                message: 'Skipped in test environment',
            };
        }
        try {
            const start = Date.now();
            // Use LLM factory health check
            const isHealthy = await llm_factory_service_1.default.healthCheck();
            const modelInfo = await (0, llm_factory_service_2.getProviderInfo)();
            const latency = Date.now() - start;
            if (!isHealthy) {
                return {
                    status: 'down',
                    error: `${modelInfo.provider} LLM service is not responding`,
                    message: `Model: ${modelInfo.model}`,
                };
            }
            return {
                status: latency < 5000 ? 'up' : 'degraded',
                latency_ms: latency,
                message: `${modelInfo.provider}/${modelInfo.model}${latency >= 5000 ? ' - High latency detected' : ''}`,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message || 'Unknown error',
            };
        }
    }
    /**
     * Check Embedding service status (Ollama)
     */
    async checkEmbedding() {
        // Skip if test environment
        if (env_config_1.default.server.nodeEnv === 'test') {
            return {
                status: 'up',
                message: 'Skipped in test environment',
            };
        }
        try {
            const start = Date.now();
            // Use embedding factory health check
            const isHealthy = await embedding_factory_service_1.default.healthCheck();
            const modelInfo = await (0, embedding_factory_service_2.getProviderInfo)();
            const latency = Date.now() - start;
            if (!isHealthy) {
                return {
                    status: 'down',
                    error: `${modelInfo.provider} embedding service is not responding`,
                    message: `Model: ${modelInfo.model}`,
                };
            }
            return {
                status: latency < 5000 ? 'up' : 'degraded',
                latency_ms: latency,
                message: `${modelInfo.provider}/${modelInfo.model} (${modelInfo.dimensions}D)${latency >= 5000 ? ' - High latency detected' : ''}`,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message || 'Unknown error',
            };
        }
    }
    /**
     * Check Ollama service status
     */
    async checkOllama() {
        try {
            // Try to reach Ollama API
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            if (!response.ok) {
                return {
                    status: 'stopped',
                    error: `HTTP ${response.status}`,
                };
            }
            const data = await response.json();
            const models = data.models || [];
            // Extract model names
            const embeddingModel = models.find((m) => m.name.includes('nomic-embed') || m.name.includes('embed'))?.name;
            const llmModel = models.find((m) => m.name.includes('meditron') || m.name.includes('llama') || m.name.includes('mistral'))?.name;
            return {
                status: 'running',
                models: {
                    embedding: embeddingModel,
                    llm: llmModel,
                },
            };
        }
        catch (error) {
            return {
                status: 'stopped',
                error: error.message || 'Connection failed',
            };
        }
    }
    /**
     * Check Avon Health API status
     */
    async checkAvonAPI() {
        // Skip if test environment
        if (env_config_1.default.server.nodeEnv === 'test') {
            return {
                status: 'up',
                message: 'Skipped in test environment',
            };
        }
        try {
            const start = Date.now();
            // Try to reach Avon API base URL
            const response = await fetch(env_config_1.default.avon.baseUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            const latency = Date.now() - start;
            const isHealthy = response.ok || response.status === 404; // 404 is ok for base URL
            return {
                status: isHealthy && latency < 5000 ? 'up' : 'degraded',
                latency_ms: latency,
                message: !isHealthy
                    ? `HTTP ${response.status}`
                    : latency >= 5000
                        ? 'High latency detected'
                        : undefined,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message || 'Unknown error',
            };
        }
    }
    /**
     * Check Vector DB status
     */
    async checkVectorDB() {
        try {
            // For now, assume vector DB is up if app is running
            // In a real implementation, you would ping the actual vector DB
            // Example for ChromaDB:
            // const collections = await chromaClient.listCollections();
            // Example for FAISS:
            // const indexSize = await faissIndex.getSize();
            return {
                status: 'up',
                latency_ms: 0,
                message: `Using ${env_config_1.default.vectorDb.type}`,
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error.message || 'Unknown error',
            };
        }
    }
    /**
     * Check cache status
     */
    checkCache() {
        if (!env_config_1.default.cache.enabled) {
            return {
                status: 'up',
                message: 'Cache disabled',
            };
        }
        // For now, assume cache is working if enabled
        // In a real implementation, you would test cache read/write
        return {
            status: 'up',
            message: `TTL: ${env_config_1.default.cache.ttlSeconds}s`,
        };
    }
    /**
     * Liveness probe
     * Returns true if the application is running
     */
    isAlive() {
        return true;
    }
    /**
     * Readiness probe
     * Returns true if the application is ready to handle requests
     */
    async isReady() {
        try {
            // Check critical dependencies
            const llmStatus = await this.checkLLM();
            const embeddingStatus = await this.checkEmbedding();
            const avonStatus = await this.checkAvonAPI();
            // Application is ready if critical services are up or degraded (not down)
            const llmReady = llmStatus.status !== 'down';
            const embeddingReady = embeddingStatus.status !== 'down';
            const avonReady = avonStatus.status !== 'down';
            return llmReady && embeddingReady && avonReady;
        }
        catch (error) {
            console.error('Readiness check failed:', error);
            return false;
        }
    }
    /**
     * Get system metrics
     */
    getSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            memory: {
                total_mb: Math.round((memoryUsage.rss + memoryUsage.external) / 1024 / 1024),
                used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external_mb: Math.round(memoryUsage.external / 1024 / 1024),
                rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
            },
            cpu: {
                user_ms: Math.round(cpuUsage.user / 1000), // Convert microseconds to milliseconds
                system_ms: Math.round(cpuUsage.system / 1000),
            },
            uptime_seconds: Math.round(process.uptime()),
            node_version: process.version,
            platform: process.platform,
        };
    }
    /**
     * Get application uptime
     */
    getUptime() {
        return Date.now() - this.startTime;
    }
}
exports.HealthService = HealthService;
// Export singleton instance
exports.healthService = new HealthService();
//# sourceMappingURL=health.service.js.map