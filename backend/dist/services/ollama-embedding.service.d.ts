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
/**
 * Ollama Embedding Service Configuration
 */
export interface OllamaEmbeddingServiceConfig {
    baseUrl: string;
    model: string;
    dimensions: number;
    maxBatchSize: number;
    cacheSize: number;
    cacheTTL: number;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
}
/**
 * Ollama Embedding Service Class
 * Handles text embedding generation using local Ollama API
 */
declare class OllamaEmbeddingService {
    private client;
    private config;
    private cache;
    private rateLimiter;
    constructor(config?: Partial<OllamaEmbeddingServiceConfig>);
    /**
     * Generate embedding for a single text
     *
     * @param text - Text to embed
     * @returns Embedding vector
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts (batch processing)
     * Note: Ollama doesn't have native batch API, so we process sequentially
     * but with optimizations
     *
     * @param texts - Array of texts to embed
     * @returns Array of embedding vectors
     */
    generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Generate single embedding with retry logic
     *
     * @param text - Text to embed
     * @param attempt - Current retry attempt
     * @returns Embedding vector
     */
    private generateWithRetry;
    /**
     * Handle embedding generation errors with retry logic
     *
     * @param error - Error that occurred
     * @param attempt - Current retry attempt
     * @param retryFn - Function to retry
     * @returns Embedding vector from retry
     */
    private handleEmbeddingError;
    /**
     * Check if error is retryable
     *
     * @param error - Error to check
     * @returns True if retryable
     */
    private isRetryableError;
    /**
     * Hash text for cache key
     *
     * @param text - Text to hash
     * @returns SHA-256 hash
     */
    private hashText;
    /**
     * Get embedding from local cache
     *
     * @param hash - Text hash
     * @returns Cached embedding or null
     */
    private getFromCache;
    /**
     * Store embedding in local cache
     *
     * @param hash - Text hash
     * @param embedding - Embedding vector
     */
    private setInCache;
    /**
     * Wait for rate limit if necessary
     */
    private waitForRateLimit;
    /**
     * Track request for rate limiting
     */
    private trackRequest;
    /**
     * Sleep for specified milliseconds
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
    /**
     * Get current cache size
     *
     * @returns Number of cached embeddings
     */
    getCacheSize(): number;
    /**
     * Clear local cache
     */
    clearCache(): void;
    /**
     * Get service configuration
     *
     * @returns Current configuration
     */
    getConfig(): OllamaEmbeddingServiceConfig;
    /**
     * Health check - verify Ollama is accessible
     *
     * @returns True if healthy, false otherwise
     */
    healthCheck(): Promise<boolean>;
    /**
     * Verify required model is installed
     *
     * @returns True if model is installed
     */
    verifyModel(): Promise<boolean>;
    /**
     * Get statistics about the service
     *
     * @returns Service statistics
     */
    getStats(): {
        cacheSize: number;
        cacheHitRate: number;
        requestCount: number;
        config: OllamaEmbeddingServiceConfig;
    };
}
declare const ollamaEmbeddingService: OllamaEmbeddingService;
export default ollamaEmbeddingService;
export { OllamaEmbeddingService };
//# sourceMappingURL=ollama-embedding.service.d.ts.map