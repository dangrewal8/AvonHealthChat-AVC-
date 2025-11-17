/**
 * Cache Manager Service
 *
 * In-memory caching strategy with LRU eviction and TTL support:
 * - Embedding cache: 1000 entries, 5 min TTL
 * - Query results cache: 100 entries, 5 min TTL
 * - Patient index cache: 5 patients, 30 min TTL
 *
 * NO Redis or external caching services
 */
/**
 * LRU Cache with TTL support
 *
 * Features:
 * - Least Recently Used eviction
 * - Time-to-Live expiration
 * - Access tracking
 * - Max size enforcement
 */
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    private defaultTTL;
    constructor(maxSize: number, defaultTTL: number);
    /**
     * Set a value in the cache
     *
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Optional TTL in milliseconds (uses default if not provided)
     */
    set(key: K, value: V, ttl?: number): void;
    /**
     * Get a value from the cache
     *
     * Returns undefined if:
     * - Key doesn't exist
     * - Entry has expired (TTL exceeded)
     *
     * @param key - Cache key
     * @returns Cached value or undefined
     */
    get(key: K): V | undefined;
    /**
     * Check if key exists and is not expired
     *
     * @param key - Cache key
     * @returns true if key exists and is valid
     */
    has(key: K): boolean;
    /**
     * Delete a key from the cache
     *
     * @param key - Cache key
     */
    delete(key: K): void;
    /**
     * Clear the entire cache
     */
    clear(): void;
    /**
     * Get cache size
     *
     * @returns Number of entries in cache
     */
    size(): number;
    /**
     * Get cache statistics
     *
     * @returns Cache stats
     */
    stats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
        entries: Array<{
            key: K;
            age: number;
            accessCount: number;
        }>;
    };
    /**
     * Evict least recently used entry
     *
     * LRU strategy: evict entry with oldest timestamp
     */
    private evictLRU;
    /**
     * Clean up expired entries
     *
     * Removes all entries that have exceeded their TTL
     */
    cleanup(): void;
}
/**
 * Patient index stored in cache
 */
export interface PatientIndex {
    patientId: string;
    chunkIds: string[];
    lastAccessed: Date;
    metadata: {
        totalChunks: number;
        dateRange: {
            earliest: string;
            latest: string;
        };
        artifactTypes: string[];
    };
}
/**
 * Query retrieval result
 */
export interface RetrievalResult {
    results: Array<{
        chunk_id: string;
        score: number;
        text: string;
        metadata?: any;
    }>;
    query: string;
    timestamp: Date;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    embeddings: {
        size: number;
        maxSize: number;
        ttl: number;
        hitRate?: number;
    };
    queryResults: {
        size: number;
        maxSize: number;
        ttl: number;
        hitRate?: number;
    };
    patientIndices: {
        size: number;
        maxSize: number;
        ttl: number;
        patients: string[];
    };
    totalMemoryEstimate: string;
}
/**
 * Cache Manager
 *
 * Manages three cache layers:
 * 1. Embedding cache: text → embedding vector (1000 entries, 5 min TTL)
 * 2. Query results cache: query hash → retrieval results (100 entries, 5 min TTL)
 * 3. Patient index cache: patient ID → chunk indices (5 patients, 30 min TTL)
 */
declare class CacheManager {
    private embeddingsCache;
    private queryResultsCache;
    private patientIndexCache;
    private readonly EMBEDDING_CACHE_SIZE;
    private readonly EMBEDDING_TTL;
    private readonly QUERY_CACHE_SIZE;
    private readonly QUERY_TTL;
    private readonly PATIENT_CACHE_SIZE;
    private readonly PATIENT_TTL;
    private cleanupInterval;
    constructor();
    /**
     * Cache an embedding
     *
     * @param text - Original text
     * @param embedding - Embedding vector
     */
    cacheEmbedding(text: string, embedding: number[]): void;
    /**
     * Get cached embedding
     *
     * @param text - Original text
     * @returns Cached embedding or undefined
     */
    getEmbedding(text: string): number[] | undefined;
    /**
     * Check if embedding is cached
     *
     * @param text - Original text
     * @returns true if cached and valid
     */
    hasEmbedding(text: string): boolean;
    /**
     * Generate cache key for embedding
     *
     * Key = SHA256(normalized_text)
     * Normalization: lowercase, trim whitespace
     *
     * @param text - Original text
     * @returns SHA256 hash
     */
    private generateEmbeddingKey;
    /**
     * Cache query results
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @param result - Retrieval results
     * @param ttl - Optional TTL (uses default if not provided)
     */
    cacheQueryResult(query: string, patientId: string, filters: any, result: RetrievalResult, ttl?: number): void;
    /**
     * Get cached query results
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @returns Cached results or undefined
     */
    getQueryResult(query: string, patientId: string, filters: any): RetrievalResult | undefined;
    /**
     * Check if query result is cached
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @returns true if cached and valid
     */
    hasQueryResult(query: string, patientId: string, filters: any): boolean;
    /**
     * Generate cache key for query
     *
     * Key = SHA256(normalized_query + patient_id + JSON(filters))
     * Normalization: lowercase, trim whitespace
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @returns SHA256 hash
     */
    private generateQueryKey;
    /**
     * Load patient index into cache
     *
     * Retrieves all chunks for a patient and caches the index
     *
     * @param patientId - Patient ID
     * @returns Patient index
     */
    loadPatientIndex(patientId: string): Promise<PatientIndex>;
    /**
     * Get patient index from cache
     *
     * @param patientId - Patient ID
     * @returns Cached patient index or undefined
     */
    getPatientIndex(patientId: string): PatientIndex | undefined;
    /**
     * Evict least recently accessed patient from cache
     */
    evictLeastRecentPatient(): void;
    /**
     * Invalidate patient index (force reload on next access)
     *
     * @param patientId - Patient ID
     */
    invalidatePatientIndex(patientId: string): void;
    /**
     * Clear all caches
     */
    clearAll(): void;
    /**
     * Get comprehensive cache statistics
     *
     * @returns Cache stats for all layers
     */
    getStats(): CacheStats;
    /**
     * Start periodic cleanup of expired entries
     *
     * Runs every minute
     */
    private startCleanup;
    /**
     * Stop periodic cleanup
     */
    stopCleanup(): void;
    /**
     * Format bytes to human-readable string
     *
     * @param bytes - Number of bytes
     * @returns Formatted string
     */
    private formatBytes;
}
declare const cacheManager: CacheManager;
export default cacheManager;
//# sourceMappingURL=cache-manager.service.d.ts.map