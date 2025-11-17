"use strict";
/**
 * Embedding Service
 * Generates text embeddings using OpenAI's API
 *
 * Features:
 * - Single and batch embedding generation
 * - Rate limiting (respect OpenAI limits)
 * - Retry logic with exponential backoff
 * - In-memory caching with text hash keys
 * - Comprehensive error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingService = void 0;
const openai_1 = __importDefault(require("openai"));
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = __importDefault(require("../config/env.config"));
const cache_manager_service_1 = __importDefault(require("./cache-manager.service"));
/**
 * Embedding Service Class
 * Handles text embedding generation using OpenAI API
 */
class EmbeddingService {
    openai;
    config;
    cache = new Map();
    rateLimiter = {
        requestCount: 0,
        windowStart: Date.now(),
    };
    constructor() {
        // Initialize OpenAI client
        this.openai = new openai_1.default({
            apiKey: env_config_1.default.openai.apiKey,
        });
        // Configure embedding service
        this.config = {
            model: env_config_1.default.openai.embeddingModel,
            dimensions: env_config_1.default.openai.embeddingDimensions,
            maxBatchSize: env_config_1.default.performance.maxEmbeddingBatchSize,
            cacheSize: 1000, // Default 1000 entries
            cacheTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            rateLimitWindow: 60 * 1000, // 1 minute
            rateLimitMaxRequests: 3000, // OpenAI limit is 3000 RPM for tier 1
            retryAttempts: 3,
            retryDelay: 1000, // 1 second base delay
        };
        console.log('[Embedding Service] Initialized');
        console.log(`  Model: ${this.config.model}`);
        console.log(`  Dimensions: ${this.config.dimensions}`);
        console.log(`  Max Batch Size: ${this.config.maxBatchSize}`);
        console.log(`  Cache Size: ${this.config.cacheSize}`);
    }
    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }
        // Check centralized cache manager first
        const cachedFromManager = cache_manager_service_1.default.getEmbedding(text);
        if (cachedFromManager) {
            console.log('[Embedding Service] ✓ Cache hit (CacheManager)');
            return cachedFromManager;
        }
        // Check local cache as fallback
        const hash = this.hashText(text);
        const cached = this.getFromCache(hash);
        if (cached) {
            console.log('[Embedding Service] ✓ Cache hit (local)');
            // Also store in centralized cache
            cache_manager_service_1.default.cacheEmbedding(text, cached);
            return cached;
        }
        // Wait for rate limit if needed
        await this.waitForRateLimit();
        // Generate embedding with retry logic
        const embedding = await this.generateWithRetry(text);
        // Store in both caches
        this.setInCache(hash, embedding);
        cache_manager_service_1.default.cacheEmbedding(text, embedding);
        return embedding;
    }
    /**
     * Generate embeddings for multiple texts (batch processing)
     * Automatically splits into chunks of maxBatchSize
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
        console.log(`[Embedding Service] Processing batch of ${validTexts.length} texts`);
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
            console.log(`[Embedding Service] ✓ ${cacheHits} cache hits`);
        }
        // Process uncached texts in batches
        if (uncachedIndices.length > 0) {
            console.log(`[Embedding Service] Generating ${uncachedIndices.length} new embeddings`);
            const uncachedTexts = uncachedIndices.map((i) => validTexts[i]);
            // Split into batches
            const batches = [];
            for (let i = 0; i < uncachedTexts.length; i += this.config.maxBatchSize) {
                batches.push(uncachedTexts.slice(i, i + this.config.maxBatchSize));
            }
            console.log(`[Embedding Service] Processing ${batches.length} batch(es)`);
            // Process each batch
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                const batchStart = batchIndex * this.config.maxBatchSize;
                console.log(`[Embedding Service] Batch ${batchIndex + 1}/${batches.length} (${batch.length} texts)`);
                // Wait for rate limit
                await this.waitForRateLimit();
                // Generate embeddings for this batch with retry
                const batchEmbeddings = await this.generateBatchWithRetry(batch);
                // Store results and cache
                for (let i = 0; i < batch.length; i++) {
                    const originalIndex = uncachedIndices[batchStart + i];
                    const embedding = batchEmbeddings[i];
                    results[originalIndex] = embedding;
                    // Cache the embedding in both caches
                    const hash = this.hashText(batch[i]);
                    this.setInCache(hash, embedding);
                    cache_manager_service_1.default.cacheEmbedding(batch[i], embedding);
                }
            }
        }
        console.log('[Embedding Service] ✓ Batch processing complete');
        // Filter out null results (shouldn't happen, but type safety)
        return results.filter((r) => r !== null);
    }
    /**
     * Generate single embedding with retry logic
     */
    async generateWithRetry(text, attempt = 1) {
        try {
            const startTime = Date.now();
            const response = await this.openai.embeddings.create({
                model: this.config.model,
                input: text,
                dimensions: this.config.dimensions,
            });
            const embedding = response.data[0].embedding;
            const duration = Date.now() - startTime;
            console.log(`[Embedding Service] ✓ Generated embedding (${duration}ms)`);
            // Track rate limit
            this.trackRequest();
            return embedding;
        }
        catch (error) {
            return this.handleEmbeddingError(error, attempt, () => this.generateWithRetry(text, attempt + 1));
        }
    }
    /**
     * Generate batch embeddings with retry logic
     */
    async generateBatchWithRetry(texts, attempt = 1) {
        try {
            const startTime = Date.now();
            const response = await this.openai.embeddings.create({
                model: this.config.model,
                input: texts,
                dimensions: this.config.dimensions,
            });
            const embeddings = response.data.map((item) => item.embedding);
            const duration = Date.now() - startTime;
            console.log(`[Embedding Service] ✓ Generated ${embeddings.length} embeddings (${duration}ms, ${Math.round(duration / embeddings.length)}ms/embedding)`);
            // Track rate limit
            this.trackRequest();
            return embeddings;
        }
        catch (error) {
            return this.handleEmbeddingError(error, attempt, () => this.generateBatchWithRetry(texts, attempt + 1));
        }
    }
    /**
     * Handle embedding generation errors with retry logic
     */
    async handleEmbeddingError(error, attempt, retryFn) {
        const shouldRetry = attempt < this.config.retryAttempts;
        // Check for rate limit errors
        if (error?.status === 429) {
            const delay = this.calculateBackoffDelay(attempt);
            console.warn(`[Embedding Service] Rate limit exceeded, retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`);
            if (shouldRetry) {
                await this.sleep(delay);
                return retryFn();
            }
            else {
                throw new Error('Rate limit exceeded. Maximum retry attempts reached.');
            }
        }
        // Check for server errors (5xx)
        if (error?.status && error.status >= 500 && error.status < 600) {
            const delay = this.calculateBackoffDelay(attempt);
            console.warn(`[Embedding Service] Server error (${error.status}), retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`);
            if (shouldRetry) {
                await this.sleep(delay);
                return retryFn();
            }
            else {
                throw new Error(`OpenAI server error: ${error.status}. Maximum retry attempts reached.`);
            }
        }
        // Check for network errors
        if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
            const delay = this.calculateBackoffDelay(attempt);
            console.warn(`[Embedding Service] Network error (${error.code}), retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`);
            if (shouldRetry) {
                await this.sleep(delay);
                return retryFn();
            }
            else {
                throw new Error(`Network error: ${error.code}. Maximum retry attempts reached.`);
            }
        }
        // For other errors, don't retry
        console.error('[Embedding Service] Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error?.message || 'Unknown error'}`);
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoffDelay(attempt) {
        // Exponential backoff: baseDelay * 2^(attempt - 1)
        // Example: 1s, 2s, 4s, 8s...
        return this.config.retryDelay * Math.pow(2, attempt - 1);
    }
    /**
     * Wait for rate limit if necessary
     */
    async waitForRateLimit() {
        const now = Date.now();
        // Reset window if needed
        if (now - this.rateLimiter.windowStart >= this.config.rateLimitWindow) {
            this.rateLimiter.requestCount = 0;
            this.rateLimiter.windowStart = now;
            return;
        }
        // Check if we've hit the rate limit
        if (this.rateLimiter.requestCount >= this.config.rateLimitMaxRequests) {
            const timeUntilReset = this.config.rateLimitWindow - (now - this.rateLimiter.windowStart);
            console.warn(`[Embedding Service] Rate limit reached, waiting ${timeUntilReset}ms until reset`);
            await this.sleep(timeUntilReset);
            // Reset window
            this.rateLimiter.requestCount = 0;
            this.rateLimiter.windowStart = Date.now();
        }
    }
    /**
     * Track API request for rate limiting
     */
    trackRequest() {
        this.rateLimiter.requestCount++;
    }
    /**
     * Hash text for cache key
     */
    hashText(text) {
        return crypto_1.default.createHash('sha256').update(text).digest('hex');
    }
    /**
     * Get embedding from cache
     */
    getFromCache(hash) {
        const entry = this.cache.get(hash);
        if (!entry) {
            return null;
        }
        // Check if expired
        const now = Date.now();
        if (now - entry.timestamp > this.config.cacheTTL) {
            this.cache.delete(hash);
            return null;
        }
        return entry.embedding;
    }
    /**
     * Store embedding in cache
     */
    setInCache(hash, embedding) {
        // Enforce cache size limit (LRU - remove oldest)
        if (this.cache.size >= this.config.cacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(hash, {
            embedding,
            timestamp: Date.now(),
            hash,
        });
    }
    /**
     * Clear cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`[Embedding Service] Cache cleared (${size} entries removed)`);
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.cacheSize,
            hitRate: 0, // TODO: Track cache hits/misses
        };
    }
    /**
     * Get service configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
// Export singleton instance
exports.embeddingService = new EmbeddingService();
exports.default = exports.embeddingService;
//# sourceMappingURL=embedding.service.js.map