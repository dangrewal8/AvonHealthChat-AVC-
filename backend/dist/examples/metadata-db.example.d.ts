/**
 * Metadata Database Usage Examples
 *
 * Demonstrates:
 * - Database connection with pooling
 * - Batch chunk insertion
 * - Date range filtering
 * - Artifact type filtering
 * - Combined filtering
 * - Chunk retrieval
 * - Statistics queries
 */
import { Chunk } from '../services/metadata-db.service';
/**
 * Example 1: Connect to PostgreSQL database
 */
export declare function exampleConnect(): Promise<void>;
/**
 * Example 2: Insert chunks (batch operation)
 */
export declare function exampleInsertChunks(): Promise<void>;
/**
 * Example 3: Filter chunks by date range
 */
export declare function exampleFilterByDateRange(): Promise<string[]>;
/**
 * Example 4: Filter chunks by artifact type
 */
export declare function exampleFilterByType(): Promise<string[]>;
/**
 * Example 5: Combined filtering (date range + type)
 */
export declare function exampleCombinedFiltering(): Promise<string[]>;
/**
 * Example 6: Get chunk by ID
 */
export declare function exampleGetChunkById(): Promise<Chunk | null>;
/**
 * Example 7: Get multiple chunks by IDs (batch retrieval)
 */
export declare function exampleGetChunksByIds(): Promise<Chunk[]>;
/**
 * Example 8: Get database statistics
 */
export declare function exampleGetStats(): Promise<{
    totalChunks: number;
    uniquePatients: number;
    uniqueArtifacts: number;
    artifactTypes: {
        type: string;
        count: number;
    }[];
}>;
/**
 * Example 9: RAG pipeline integration
 */
export declare function exampleRAGPipeline(): Promise<Chunk[]>;
/**
 * Example 10: Delete chunks
 */
export declare function exampleDeleteChunks(): Promise<number>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=metadata-db.example.d.ts.map