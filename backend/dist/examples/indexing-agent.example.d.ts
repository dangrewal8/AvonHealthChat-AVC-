/**
 * Indexing Agent Service Usage Examples
 *
 * Demonstrates:
 * - Basic chunk indexing with progress tracking
 * - Batch indexing of multiple artifacts
 * - Reindexing artifacts
 * - Index statistics
 * - Error recovery
 * - Full pipeline integration
 */
import { Chunk } from '../services/indexing-agent.service';
/**
 * Example 1: Basic chunk indexing
 */
export declare function exampleBasicIndexing(): Promise<import("../services/indexing-agent.service").IndexingResult>;
/**
 * Example 2: Indexing with progress tracking
 */
export declare function exampleProgressTracking(): Promise<import("../services/indexing-agent.service").IndexingResult>;
/**
 * Example 3: Batch indexing multiple artifacts
 */
export declare function exampleBatchIndexing(): Promise<import("../services/indexing-agent.service").IndexingResult>;
/**
 * Example 4: Reindexing an artifact
 */
export declare function exampleReindexing(): Promise<import("../services/indexing-agent.service").IndexingResult>;
/**
 * Example 5: Getting index statistics
 */
export declare function exampleIndexStats(): Promise<import("../services/indexing-agent.service").IndexStats>;
/**
 * Example 6: Error recovery
 */
export declare function exampleErrorRecovery(): Promise<import("../services/indexing-agent.service").IndexingResult>;
/**
 * Example 7: Full pipeline integration
 */
export declare function exampleFullPipeline(): Promise<{
    document: {
        id: string;
        patientId: string;
        type: string;
        occurredAt: string;
        author: string;
        content: string;
    };
    chunks: Chunk[];
    result: import("../services/indexing-agent.service").IndexingResult;
    stats: import("../services/indexing-agent.service").IndexStats;
}>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=indexing-agent.example.d.ts.map