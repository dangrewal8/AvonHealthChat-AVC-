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
/**
 * Embedding Service Configuration
 */
export interface EmbeddingServiceConfig {
    model: string;
    dimensions: number;
    maxBatchSize: number;
    cacheSize: number;
    cacheTTL: number;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    retryAttempts: number;
    retryDelay: number;
}
/**
 * Embedding Service Class
 * Handles text embedding generation using OpenAI API
 */
declare class EmbeddingService {
    private openai;
    private config;
    private cache;
    private rateLimiter;
    constructor();
    /**
     * Generate embedding for a single text
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts (batch processing)
     * Automatically splits into chunks of maxBatchSize
     */
    generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Generate single embedding with retry logic
     */
    private generateWithRetry;
    /**
     * Generate batch embeddings with retry logic
     */
    private generateBatchWithRetry;
    /**
     * Handle embedding generation errors with retry logic
     */
    private handleEmbeddingError;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoffDelay;
    /**
     * Wait for rate limit if necessary
     */
    private waitForRateLimit;
    /**
     * Track API request for rate limiting
     */
    private trackRequest;
    /**
     * Hash text for cache key
     */
    private hashText;
    /**
     * Get embedding from cache
     */
    private getFromCache;
    /**
     * Store embedding in cache
     */
    private setInCache;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    /**
     * Get service configuration
     */
    getConfig(): EmbeddingServiceConfig;
    /**
     * Sleep utility
     */
    private sleep;
}
export declare const embeddingService: EmbeddingService;
export default embeddingService;
//# sourceMappingURL=embedding.service.d.ts.map