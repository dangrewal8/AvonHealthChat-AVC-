/**
 * Retriever Agent Service
 *
 * Orchestrates the entire retrieval pipeline:
 * 1. Metadata filtering (reduce search space)
 * 2. Hybrid search (semantic + keyword)
 * 3. Scoring and ranking
 * 4. Snippet and highlight generation
 *
 * Features:
 * - Full pipeline orchestration
 * - Query caching for performance
 * - Parallel execution where possible
 * - Comprehensive diagnostics
 *
 */
import { Chunk } from './metadata-filter.service';
import { StructuredQuery } from './query-understanding-agent.service';
/**
 * Highlight span in content
 */
export interface Highlight {
    start: number;
    end: number;
    text: string;
    score: number;
}
/**
 * Chunk metadata for retrieval result
 */
export interface ChunkMetadata {
    artifact_type: string;
    date: string;
    author?: string;
    section?: string;
    [key: string]: any;
}
/**
 * Retrieval candidate with enriched information
 */
export interface RetrievalCandidate {
    chunk: Chunk;
    score: number;
    snippet: string;
    highlights: Highlight[];
    metadata: ChunkMetadata;
    rank?: number;
}
/**
 * Retrieval result with diagnostics
 */
export interface RetrievalResult {
    candidates: RetrievalCandidate[];
    total_searched: number;
    filtered_count: number;
    retrieval_time_ms: number;
    query_id: string;
    diagnostics?: {
        metadata_filter_time_ms: number;
        search_time_ms: number;
        scoring_time_ms: number;
        snippet_time_ms: number;
        cache_hit: boolean;
    };
}
/**
 * Retriever Agent Class
 *
 * Orchestrates the full retrieval pipeline
 */
declare class RetrieverAgent {
    private cache;
    private readonly CACHE_TTL_MS;
    private readonly DEFAULT_TOP_K;
    private readonly SNIPPET_LENGTH;
    private dimensionValidated;
    private chunks;
    /**
     * Initialize with chunks
     *
     * @param chunks - Array of chunks to search
     */
    initialize(chunks: Chunk[]): void;
    /**
     * Retrieve relevant chunks for a structured query
     *
     * @param structuredQuery - Parsed query with filters
     * @param topK - Number of top results to return (default: 10)
     * @returns Retrieval result with candidates and diagnostics
     */
    retrieve(structuredQuery: StructuredQuery, topK?: number): Promise<RetrievalResult>;
    /**
     * Apply metadata filters to reduce search space
     *
     * @param query - Structured query
     * @returns Filtered chunks
     */
    private applyMetadataFilters;
    /**
     * Validate embedding dimensions match FAISS vector store
     *
     * Logs warning if mismatch detected
     */
    private validateEmbeddingDimensions;
    /**
     * Perform hybrid search (semantic + keyword)
     *
     * Uses actual vector embeddings via embedding factory and FAISS vector store
     * Combines semantic similarity with keyword matching (BM25)
     *
     * @param query - Query string
     * @param chunks - Filtered chunks to search
     * @param topK - Number of results
     * @returns Search results with scores
     */
    private hybridSearch;
    /**
     * Score and rank search results
     *
     * @param searchResults - Results from hybrid search
     * @param query - Structured query
     * @param topK - Number of top results
     * @returns Ranked candidates
     */
    private scoreAndRank;
    /**
     * Enrich candidates with snippets and highlights
     *
     * @param candidates - Ranked candidates
     * @param query - Original query string
     * @returns Enriched candidates
     */
    private enrichCandidates;
    /**
     * Generate contextual snippet around query terms
     *
     * @param content - Full content
     * @param queryTokens - Query tokens
     * @returns Snippet
     */
    private generateSnippet;
    /**
     * Generate highlights for query terms
     *
     * @param content - Content to highlight
     * @param queryTokens - Query tokens
     * @returns Array of highlights
     */
    private generateHighlights;
    /**
     * Tokenize text
     *
     * @param text - Input text
     * @returns Array of tokens
     */
    private tokenize;
    /**
     * Generate cache key for query
     *
     * @param query - Structured query
     * @returns Cache key
     */
    private getCacheKey;
    /**
     * Get result from cache
     *
     * @param key - Cache key
     * @returns Cached result or null
     */
    private getFromCache;
    /**
     * Add result to cache
     *
     * @param key - Cache key
     * @param result - Result to cache
     */
    private addToCache;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     *
     * @returns Cache stats
     */
    getCacheStats(): {
        size: number;
        ttl_ms: number;
    };
    /**
     * Batch retrieve for multiple queries
     *
     * @param queries - Array of structured queries
     * @param topK - Number of results per query
     * @returns Array of retrieval results
     */
    batchRetrieve(queries: StructuredQuery[], topK?: number): Promise<RetrievalResult[]>;
    /**
     * Get retrieval diagnostics summary
     *
     * @param result - Retrieval result
     * @returns Human-readable summary
     */
    getDiagnosticsSummary(result: RetrievalResult): string;
    /**
     * Explain ranking for top result
     *
     * @param result - Retrieval result
     * @returns Explanation
     */
    explainTopResult(result: RetrievalResult): string;
}
declare const retrieverAgent: RetrieverAgent;
export default retrieverAgent;
//# sourceMappingURL=retriever-agent.service.d.ts.map