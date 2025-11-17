/**
 * FAISS Vector Store Usage Examples
 *
 * Demonstrates:
 * - Index initialization (IndexFlatIP/IndexIVFFlat)
 * - Vector addition with normalization
 * - Similarity search
 * - Save/Load persistence
 * - Integration with embedding service
 */
/**
 * Example 1: Initialize FAISS index (small dataset)
 */
export declare function exampleInitializeSmall(): Promise<{
    dimension: number;
    indexType: string;
    totalVectors: number;
    idMappings: number;
    metadataEntries: number;
    isInitialized: boolean;
}>;
/**
 * Example 2: Get index statistics
 */
export declare function exampleGetStats(): Promise<{
    dimension: number;
    indexType: string;
    totalVectors: number;
    idMappings: number;
    metadataEntries: number;
    isInitialized: boolean;
}>;
/**
 * Example 3: Add vectors with metadata
 */
export declare function exampleAddVectors(): Promise<{
    dimension: number;
    indexType: string;
    totalVectors: number;
    idMappings: number;
    metadataEntries: number;
    isInitialized: boolean;
}>;
/**
 * Example 4: Search for similar vectors
 */
export declare function exampleSearch(): Promise<import("../services/faiss-vector-store.service").SearchResult[]>;
/**
 * Example 5: Save and load index
 */
export declare function exampleSaveLoad(): Promise<{
    statsBefore: {
        dimension: number;
        indexType: string;
        totalVectors: number;
        idMappings: number;
        metadataEntries: number;
        isInitialized: boolean;
    };
    statsAfter: {
        dimension: number;
        indexType: string;
        totalVectors: number;
        idMappings: number;
        metadataEntries: number;
        isInitialized: boolean;
    };
}>;
/**
 * Example 6: Integration with embedding service
 */
export declare function exampleEmbeddingIntegration(): Promise<import("../services/faiss-vector-store.service").SearchResult[]>;
/**
 * Example 7: Batch operations
 */
export declare function exampleBatchOperations(): Promise<{
    dimension: number;
    indexType: string;
    totalVectors: number;
    idMappings: number;
    metadataEntries: number;
    isInitialized: boolean;
}>;
/**
 * Example 8: Performance benchmark
 */
export declare function examplePerformanceBenchmark(): Promise<{
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
}>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=faiss.example.d.ts.map