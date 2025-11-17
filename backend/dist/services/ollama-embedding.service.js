"use strict";
/**
 * Ollama Embedding Service
 * Generates text embeddings using local Ollama models
 *
 * Features:
 * - Single and batch embedding generation
 * - Local processing (no external API calls)
 * - HIPAA compliant (PHI never leaves server)
 * - Retry logic with exponential backoff
 * - In-memory caching with text hash keys
 * - Comprehensive error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaEmbeddingService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const cache_manager_service_1 = __importDefault(require("./cache-manager.service"));
/**
 * Ollama Embedding Service Class
 * Handles text embedding generation using local Ollama API
 */
class OllamaEmbeddingService {
    client;
    config;
    cache = new Map();
    rateLimiter = {
        requestCount: 0,
        windowStart: Date.now(),
    };
    constructor(config) {
        // Default configuration
        const defaultConfig = {
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
            dimensions: parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || '768', 10),
            maxBatchSize: parseInt(process.env.MAX_EMBEDDING_BATCH_SIZE || '100', 10),
            cacheSize: 1000, // Default 1000 entries
            cacheTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            rateLimitWindow: 60 * 1000, // 1 minute
            rateLimitMaxRequests: 1000, // Local Ollama can handle more
            retryAttempts: 3,
            retryDelay: 1000, // 1 second base delay
            timeout: 30000, // 30 seconds timeout
        };
        // Merge with provided config
        this.config = { ...defaultConfig, ...config };
        // Initialize axios client
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('[Ollama Embedding Service] Initialized');
        console.log(`  Base URL: ${this.config.baseUrl}`);
        console.log(`  Model: ${this.config.model}`);
        console.log(`  Dimensions: ${this.config.dimensions}`);
        console.log(`  Max Batch Size: ${this.config.maxBatchSize}`);
        console.log(`  Cache Size: ${this.config.cacheSize}`);
    }
    /**
     * Generate embedding for a single text
     *
     * @param text - Text to embed
     * @returns Embedding vector
     */
    async generateEmbedding(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }
        // Check centralized cache manager first
        const cachedFromManager = cache_manager_service_1.default.getEmbedding(text);
        if (cachedFromManager) {
            console.log('[Ollama Embedding Service] ✓ Cache hit (CacheManager)');
            return cachedFromManager;
        }
        // Check local cache as fallback
        const hash = this.hashText(text);
        const cached = this.getFromCache(hash);
        if (cached) {
            console.log('[Ollama Embedding Service] ✓ Cache hit (local)');
            // Also store in centralized cache
            cache_manager_service_1.default.cacheEmbedding(text, cached);
            return cached;
        }
        // Wait for rate limit if needed
        await this.waitForRateLimit();
        // Generate embedding with retry logic
        const embedding = await this.generateWithRetry(text);
        // Validate embedding dimensions
        if (embedding.length !== this.config.dimensions) {
            throw new Error(`Embedding dimension mismatch: expected ${this.config.dimensions}, got ${embedding.length}`);
        }
        // Store in both caches
        this.setInCache(hash, embedding);
        cache_manager_service_1.default.cacheEmbedding(text, embedding);
        return embedding;
    }
    /**
     * Generate embeddings for multiple texts (batch processing)
     * Note: Ollama doesn't have native batch API, so we process sequentially
     * but with optimizations
     *
     * @param texts - Array of texts to embed
     * @returns Array of embedding vectors
     */
    async generateBatchEmbeddings(texts) {
        if (!texts || texts.length === 0) {
            throw new Error('Texts array cannot be empty');
        }
        // Filter out empty texts
        const validTexts = texts.filter((text) => text && text.trim().length > 0);
        if (validTexts.length === 0) {
            throw new Error('No valid texts to embed');
        }
        console.log(`[Ollama Embedding Service] Processing batch of ${validTexts.length} texts`);
        // Check cache for all texts (CacheManager first, then local cache)
        const results = new Array(validTexts.length);
        const uncachedIndices = [];
        for (let i = 0; i < validTexts.length; i++) {
            // Check CacheManager first
            const cachedFromManager = cache_manager_service_1.default.getEmbedding(validTexts[i]);
            if (cachedFromManager) {
                results[i] = cachedFromManager;
                continue;
            }
            // Check local cache as fallback
            const hash = this.hashText(validTexts[i]);
            const cached = this.getFromCache(hash);
            if (cached) {
                results[i] = cached;
                // Also store in centralized cache
                cache_manager_service_1.default.cacheEmbedding(validTexts[i], cached);
            }
            else {
                uncachedIndices.push(i);
            }
        }
        const cacheHits = validTexts.length - uncachedIndices.length;
        if (cacheHits > 0) {
            console.log(`[Ollama Embedding Service] ✓ ${cacheHits} cache hits`);
        }
        // Process uncached texts
        if (uncachedIndices.length > 0) {
            console.log(`[Ollama Embedding Service] Generating ${uncachedIndices.length} new embeddings`);
            // Process in smaller batches to avoid overwhelming Ollama
            const batchSize = Math.min(this.config.maxBatchSize, 10); // Process 10 at a time
            const numBatches = Math.ceil(uncachedIndices.length / batchSize);
            for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
                const batchStart = batchIndex * batchSize;
                const batchEnd = Math.min(batchStart + batchSize, uncachedIndices.length);
                const batchIndices = uncachedIndices.slice(batchStart, batchEnd);
                console.log(`[Ollama Embedding Service] Batch ${batchIndex + 1}/${numBatches} (${batchIndices.length} texts)`);
                // Process batch in parallel (Ollama can handle concurrent requests)
                const promises = batchIndices.map(async (originalIndex) => {
                    const text = validTexts[originalIndex];
                    // Wait for rate limit
                    await this.waitForRateLimit();
                    // Generate embedding with retry
                    const embedding = await this.generateWithRetry(text);
                    // Validate dimensions
                    if (embedding.length !== this.config.dimensions) {
                        throw new Error(`Embedding dimension mismatch for text ${originalIndex}: expected ${this.config.dimensions}, got ${embedding.length}`);
                    }
                    // Store in both caches
                    const hash = this.hashText(text);
                    this.setInCache(hash, embedding);
                    cache_manager_service_1.default.cacheEmbedding(text, embedding);
                    return { originalIndex, embedding };
                });
                // Wait for all embeddings in this batch
                const batchResults = await Promise.all(promises);
                // Store results
                for (const { originalIndex, embedding } of batchResults) {
                    results[originalIndex] = embedding;
                }
            }
        }
        console.log('[Ollama Embedding Service] ✓ Batch processing complete');
        // Filter out null results (shouldn't happen, but type safety)
        return results.filter((r) => r !== null);
    }
    /**
     * Generate single embedding with retry logic
     *
     * @param text - Text to embed
     * @param attempt - Current retry attempt
     * @returns Embedding vector
     */
    async generateWithRetry(text, attempt = 1) {
        try {
            const startTime = Date.now();
            const response = await this.client.post('/api/embeddings', {
                model: this.config.model,
                prompt: text,
            });
            const embedding = response.data.embedding;
            const duration = Date.now() - startTime;
            console.log(`[Ollama Embedding Service] ✓ Generated embedding (${duration}ms)`);
            // Track rate limit
            this.trackRequest();
            return embedding;
        }
        catch (error) {
            return this.handleEmbeddingError(error, attempt, () => this.generateWithRetry(text, attempt + 1));
        }
    }
    /**
     * Handle embedding generation errors with retry logic
     *
     * @param error - Error that occurred
     * @param attempt - Current retry attempt
     * @param retryFn - Function to retry
     * @returns Embedding vector from retry
     */
    async handleEmbeddingError(error, attempt, retryFn) {
        const maxAttempts = this.config.retryAttempts;
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        if (isRetryable && attempt <= maxAttempts) {
            const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.warn(`[Ollama Embedding Service] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`);
            console.warn(`  Error: ${error.message}`);
            await this.sleep(delay);
            return retryFn();
        }
        // Non-retryable error or max attempts reached
        console.error('[Ollama Embedding Service] ✗ Embedding generation failed');
        console.error(`  Attempts: ${attempt}/${maxAttempts}`);
        console.error(`  Error: ${error.message}`);
        if (axios_1.default.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Ollama service is not running. Please start it with: ollama serve');
            }
            else if (error.response?.status === 404) {
                throw new Error(`Ollama model '${this.config.model}' not found. Install it with: ollama pull ${this.config.model}`);
            }
            else if (error.code === 'ETIMEDOUT') {
                throw new Error('Ollama request timeout. The model may be loading or your system may be slow. Try again or use GPU acceleration.');
            }
        }
        throw new Error(`Embedding generation failed: ${error.message}`);
    }
    /**
     * Check if error is retryable
     *
     * @param error - Error to check
     * @returns True if retryable
     */
    isRetryableError(error) {
        if (axios_1.default.isAxiosError(error)) {
            // Network errors are retryable
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                return true;
            }
            // 5xx server errors are retryable
            if (error.response?.status && error.response.status >= 500) {
                return true;
            }
            // 429 rate limit is retryable
            if (error.response?.status === 429) {
                return true;
            }
        }
        return false;
    }
    /**
     * Hash text for cache key
     *
     * @param text - Text to hash
     * @returns SHA-256 hash
     */
    hashText(text) {
        return (0, crypto_1.createHash)('sha256').update(text.trim()).digest('hex');
    }
    /**
     * Get embedding from local cache
     *
     * @param hash - Text hash
     * @returns Cached embedding or null
     */
    getFromCache(hash) {
        const entry = this.cache.get(hash);
        if (!entry) {
            return null;
        }
        // Check if cache entry is expired
        const now = Date.now();
        if (now - entry.timestamp > this.config.cacheTTL) {
            this.cache.delete(hash);
            return null;
        }
        return entry.embedding;
    }
    /**
     * Store embedding in local cache
     *
     * @param hash - Text hash
     * @param embedding - Embedding vector
     */
    setInCache(hash, embedding) {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.config.cacheSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(hash, {
            embedding,
            timestamp: Date.now(),
            hash,
        });
    }
    /**
     * Wait for rate limit if necessary
     */
    async waitForRateLimit() {
        const now = Date.now();
        // Reset window if expired
        if (now - this.rateLimiter.windowStart > this.config.rateLimitWindow) {
            this.rateLimiter.requestCount = 0;
            this.rateLimiter.windowStart = now;
            return;
        }
        // Check if rate limit reached
        if (this.rateLimiter.requestCount >= this.config.rateLimitMaxRequests) {
            const timeToWait = this.config.rateLimitWindow - (now - this.rateLimiter.windowStart);
            if (timeToWait > 0) {
                console.warn(`[Ollama Embedding Service] Rate limit reached. Waiting ${timeToWait}ms...`);
                await this.sleep(timeToWait);
                this.rateLimiter.requestCount = 0;
                this.rateLimiter.windowStart = Date.now();
            }
        }
    }
    /**
     * Track request for rate limiting
     */
    trackRequest() {
        this.rateLimiter.requestCount++;
    }
    /**
     * Sleep for specified milliseconds
     *
     * @param ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get current cache size
     *
     * @returns Number of cached embeddings
     */
    getCacheSize() {
        return this.cache.size;
    }
    /**
     * Clear local cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[Ollama Embedding Service] Cache cleared');
    }
    /**
     * Get service configuration
     *
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Health check - verify Ollama is accessible
     *
     * @returns True if healthy, false otherwise
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/api/tags', { timeout: 5000 });
            return response.status === 200;
        }
        catch (error) {
            console.error('[Ollama Embedding Service] Health check failed:', error);
            return false;
        }
    }
    /**
     * Verify required model is installed
     *
     * @returns True if model is installed
     */
    async verifyModel() {
        try {
            const response = await this.client.get('/api/tags', { timeout: 5000 });
            const models = response.data.models || [];
            return models.some((m) => m.name === this.config.model || m.name === `${this.config.model}:latest`);
        }
        catch (error) {
            console.error('[Ollama Embedding Service] Model verification failed:', error);
            return false;
        }
    }
    /**
     * Get statistics about the service
     *
     * @returns Service statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            cacheHitRate: 0, // Would need to track hits/misses to calculate
            requestCount: this.rateLimiter.requestCount,
            config: this.getConfig(),
        };
    }
}
exports.OllamaEmbeddingService = OllamaEmbeddingService;
// Export singleton instance
const ollamaEmbeddingService = new OllamaEmbeddingService();
exports.default = ollamaEmbeddingService;
//# sourceMappingURL=ollama-embedding.service.js.map