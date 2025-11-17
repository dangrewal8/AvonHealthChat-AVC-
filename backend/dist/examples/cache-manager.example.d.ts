/**
 * Cache Manager Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Embedding cache (1000 entries, 5 min TTL)
 * - Query results cache (100 entries, 5 min TTL)
 * - Patient index cache (5 patients, 30 min TTL)
 * - LRU eviction
 * - Cache statistics
 * - Integration with services
 */
/**
 * Example 1: Embedding cache
 */
export declare function exampleEmbeddingCache(): Promise<void>;
/**
 * Example 2: Query results cache
 */
export declare function exampleQueryResultsCache(): Promise<void>;
/**
 * Example 3: Patient index cache
 */
export declare function examplePatientIndexCache(): Promise<void>;
/**
 * Example 4: LRU eviction
 */
export declare function exampleLRUEviction(): Promise<void>;
/**
 * Example 5: Cache key generation
 */
export declare function exampleCacheKeyGeneration(): Promise<void>;
/**
 * Example 6: Comprehensive cache statistics
 */
export declare function exampleCacheStatistics(): Promise<void>;
/**
 * Example 7: Cache invalidation
 */
export declare function exampleCacheInvalidation(): Promise<void>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=cache-manager.example.d.ts.map