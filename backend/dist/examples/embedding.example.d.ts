/**
 * Embedding Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Single text embedding generation
 * - Batch embedding generation
 * - Caching behavior
 * - Rate limiting
 * - Error handling
 */
/**
 * Example 1: Generate single embedding
 */
export declare function exampleSingleEmbedding(): Promise<number[]>;
/**
 * Example 2: Generate embedding with caching
 */
export declare function exampleCaching(): Promise<{
    embedding1: number[];
    embedding2: number[];
}>;
/**
 * Example 3: Batch embedding generation
 */
export declare function exampleBatchEmbeddings(): Promise<number[][]>;
/**
 * Example 4: Large batch processing (automatic chunking)
 */
export declare function exampleLargeBatch(): Promise<number[][]>;
/**
 * Example 5: Empty text handling
 */
export declare function exampleEmptyText(): Promise<void>;
/**
 * Example 6: Batch with mixed content
 */
export declare function exampleMixedBatch(): Promise<number[][]>;
/**
 * Example 7: Cache statistics
 */
export declare function exampleCacheStats(): Promise<any>;
/**
 * Example 8: Clear cache
 */
export declare function exampleClearCache(): Promise<void>;
/**
 * Example 9: Service configuration
 */
export declare function exampleConfiguration(): Promise<any>;
/**
 * Example 10: Real-world usage - embedding patient notes
 */
export declare function exampleRealWorldUsage(): Promise<{
    id: string;
    text: string;
    embedding: number[];
    embeddingDimensions: number;
}[]>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=embedding.example.d.ts.map