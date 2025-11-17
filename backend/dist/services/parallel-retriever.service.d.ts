/**
 * Parallel Retrieval Optimization Service
 *
 * Reduces latency by 30-50% through parallel execution:
 * - Search multiple artifact types concurrently
 * - Search different time windows in parallel
 * - Execute chunk and sentence-level searches simultaneously
 *
 * Features:
 * - Promise.all() based parallelization (no external libraries)
 * - Intelligent result merging with score normalization
 * - Duplicate detection and removal
 * - Fallback to sequential on errors
 * - Performance metrics and diagnostics
 *
 */
import { StructuredQuery } from './query-understanding-agent.service';
import { IntegratedRetrievalResult } from './integrated-retriever.service';
/**
 * Parallel retrieval result with enhanced diagnostics
 */
export interface ParallelRetrievalResult extends IntegratedRetrievalResult {
    parallel_searches: number;
    merge_time_ms: number;
    deduplication_removed: number;
    sequential_fallback: boolean;
    speedup_factor?: number;
}
/**
 * Parallel Retriever Class
 *
 * Optimizes retrieval through intelligent parallelization
 */
declare class ParallelRetriever {
    private readonly MIN_PARTITIONS_FOR_PARALLEL;
    private readonly MAX_PARALLEL_SEARCHES;
    /**
     * Retrieve with automatic parallelization
     *
     * @param query - Structured query
     * @param forceParallel - Force parallel execution even if not optimal
     * @returns Parallel retrieval result
     */
    retrieve(query: StructuredQuery, forceParallel?: boolean): Promise<ParallelRetrievalResult>;
    /**
     * Create search partitions for parallel execution
     *
     * @param query - Structured query
     * @returns Array of search partitions
     */
    private createSearchPartitions;
    /**
     * Create time-based partitions for long date ranges
     *
     * @param query - Structured query with date range
     * @returns Array of time-based partitions
     */
    private createTimePartitions;
    /**
     * Execute parallel retrieval
     *
     * @param query - Original query
     * @param partitions - Search partitions
     * @param startTime - Start timestamp
     * @returns Parallel retrieval result
     */
    private retrieveParallel;
    /**
     * Execute search for a single partition
     *
     * @param partition - Search partition
     * @returns Partition result
     */
    private executePartitionSearch;
    /**
     * Merge results from parallel searches
     *
     * @param partitionResults - Results from all partitions
     * @param originalQuery - Original query for re-ranking
     * @returns Merged candidates and statistics
     */
    private mergeResults;
    /**
     * Normalize scores across different partitions
     *
     * @param candidates - All candidates
     * @param partitionResults - Partition results for context
     * @returns Normalized candidates
     */
    private normalizeScores;
    /**
     * Remove duplicate candidates
     *
     * @param candidates - Candidates to deduplicate
     * @returns Unique candidates
     */
    private removeDuplicates;
    /**
     * Aggregate stage metrics from multiple searches
     *
     * @param partitionResults - Results from all partitions
     * @returns Aggregated metrics
     */
    private aggregateStageMetrics;
    /**
     * Fallback to sequential retrieval
     *
     * @param query - Structured query
     * @param _startTime - Start timestamp (unused, for interface consistency)
     * @returns Sequential result wrapped as parallel result
     */
    private retrieveSequential;
    /**
     * Compare parallel vs sequential performance
     *
     * @param query - Query to test
     * @returns Performance comparison
     */
    comparePerformance(query: StructuredQuery): Promise<{
        parallel: ParallelRetrievalResult;
        sequential: ParallelRetrievalResult;
        speedup: number;
    }>;
    /**
     * Batch parallel retrieval
     *
     * @param queries - Array of queries
     * @returns Array of results
     */
    batchRetrieve(queries: StructuredQuery[]): Promise<ParallelRetrievalResult[]>;
    /**
     * Get retrieval summary
     *
     * @param result - Parallel retrieval result
     * @returns Human-readable summary
     */
    getSummary(result: ParallelRetrievalResult): string;
}
declare const parallelRetriever: ParallelRetriever;
export default parallelRetriever;
//# sourceMappingURL=parallel-retriever.service.d.ts.map