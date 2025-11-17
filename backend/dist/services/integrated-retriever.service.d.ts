/**
 * Integrated Retrieval Pipeline Service
 *
 * Orchestrates complete end-to-end retrieval pipeline:
 * 1. Metadata filtering (reduce search space)
 * 2. Hybrid search (semantic + keyword)
 * 3. Initial scoring (multi-signal combination)
 * 4. Re-ranking (entity coverage, query overlap)
 * 5. Diversification (penalize duplicates)
 * 6. Time decay (boost recent documents)
 * 7. Highlight generation (mark query terms)
 *
 * Features:
 * - Complete pipeline orchestration
 * - Performance metrics for each stage
 * - Error handling with fallback strategies
 * - Cache support
 * - Comprehensive diagnostics
 *
 */
import { Chunk } from './metadata-filter.service';
import { StructuredQuery } from './query-understanding-agent.service';
import { RetrievalCandidate } from './retriever-agent.service';
/**
 * Pipeline stage timing information
 */
interface StageMetrics {
    stage: string;
    duration_ms: number;
    input_count: number;
    output_count: number;
}
/**
 * Complete retrieval result with diagnostics
 */
export interface IntegratedRetrievalResult {
    candidates: RetrievalCandidate[];
    total_searched: number;
    filtered_count: number;
    retrieval_time_ms: number;
    query_id: string;
    stage_metrics: StageMetrics[];
    cache_hit: boolean;
    error?: string;
}
/**
 * Pipeline configuration
 */
interface PipelineConfig {
    k: number;
    hybrid_alpha: number;
    enable_diversification: boolean;
    enable_time_decay: boolean;
    enable_reranking: boolean;
    diversity_threshold: number;
    time_decay_rate: number;
}
/**
 * Integrated Retriever Class
 *
 * Combines all retrieval components into unified pipeline
 */
declare class IntegratedRetriever {
    private cache;
    private readonly CACHE_TTL_MS;
    private readonly DEFAULT_CONFIG;
    private chunks;
    /**
     * Initialize with chunks
     *
     * @param chunks - Array of chunks to search
     */
    initialize(chunks: Chunk[]): void;
    /**
     * Execute complete retrieval pipeline
     *
     * @param query - Structured query with filters and entities
     * @param config - Pipeline configuration (optional)
     * @returns Complete retrieval result with diagnostics
     */
    retrieve(query: StructuredQuery, config?: Partial<PipelineConfig>): Promise<IntegratedRetrievalResult>;
    /**
     * Stage 1: Metadata Filtering
     * Reduces search space using metadata filters
     */
    private stageMetadataFiltering;
    /**
     * Stage 2: Hybrid Search
     * Combines semantic and keyword search
     */
    private stageHybridSearch;
    /**
     * Stage 3: Initial Scoring
     * Combines multiple relevance signals
     */
    private stageInitialScoring;
    /**
     * Stage 4: Re-Ranking
     * Refines top results using entity coverage and query overlap
     */
    private stageReRanking;
    /**
     * Stage 5: Diversification
     * Penalizes duplicate or highly similar content
     */
    private stageDiversification;
    /**
     * Stage 6: Time Decay
     * Boosts more recent documents
     */
    private stageTimeDecay;
    /**
     * Stage 7: Highlight Generation
     * Marks query terms in content and generates snippets
     */
    private stageHighlightGeneration;
    /**
     * Generate contextual snippet around query terms
     */
    private generateSnippet;
    /**
     * Generate highlights for query terms
     */
    private generateHighlights;
    /**
     * Calculate content similarity using Jaccard similarity
     */
    private calculateContentSimilarity;
    /**
     * Simulate semantic similarity (placeholder for production vector search)
     */
    private simulateSemanticSimilarity;
    /**
     * Tokenize text
     */
    private tokenize;
    /**
     * Generate empty result when no candidates found
     */
    private emptyResult;
    /**
     * Handle pipeline errors with partial results
     */
    private handleError;
    /**
     * Generate cache key
     */
    private getCacheKey;
    /**
     * Get from cache
     */
    private getFromCache;
    /**
     * Add to cache
     */
    private addToCache;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get pipeline summary
     */
    getPipelineSummary(result: IntegratedRetrievalResult): string;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        ttl_ms: number;
    };
    /**
     * Batch retrieve for multiple queries
     */
    batchRetrieve(queries: StructuredQuery[], config?: Partial<PipelineConfig>): Promise<IntegratedRetrievalResult[]>;
}
declare const integratedRetriever: IntegratedRetriever;
export default integratedRetriever;
//# sourceMappingURL=integrated-retriever.service.d.ts.map