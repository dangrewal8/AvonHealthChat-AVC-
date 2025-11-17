/**
 * Hybrid Search Engine Service
 * Combines keyword search (BM25) and semantic search (vector similarity)
 *
 * Features:
 * - BM25 keyword scoring
 * - Vector similarity (cosine similarity)
 * - Hybrid score combination (alpha weighting)
 * - Metadata pre-filtering (date, type, patient)
 * - Recency boosting with time decay
 * - Snippet extraction
 */
/**
 * Search options interface
 */
export interface SearchOptions {
    k: number;
    alpha: number;
    filters?: {
        dateFrom?: string;
        dateTo?: string;
        artifactTypes?: string[];
        patientId?: string;
    };
    recencyBoost?: boolean;
    snippetLength?: number;
}
/**
 * Search result interface
 */
export interface SearchResult {
    chunk_id: string;
    score: number;
    semanticScore: number;
    keywordScore: number;
    recencyBoost: number;
    snippet: string;
    metadata: {
        artifact_id: string;
        patient_id: string;
        artifact_type: string;
        occurred_at: string;
        author?: string;
        source_url?: string;
    };
}
/**
 * Document for indexing
 */
export interface Document {
    chunk_id: string;
    chunk_text: string;
    embedding: number[];
    metadata: {
        artifact_id: string;
        patient_id: string;
        artifact_type: string;
        occurred_at: string;
        author?: string;
        source_url?: string;
    };
}
/**
 * Hybrid Search Engine Class
 * Manages in-memory keyword index and integrates with FAISS for semantic search
 */
declare class HybridSearchEngine {
    private documents;
    private documentFrequency;
    private averageDocLength;
    private totalDocuments;
    private readonly k1;
    private readonly b;
    private readonly halfLifeDays;
    /**
     * Add a document to the search engine
     * Indexes both keyword (BM25) and vector (FAISS)
     * @param doc - Document with chunk text, embedding, and metadata
     */
    addDocument(doc: Document): Promise<void>;
    /**
     * Batch add documents (more efficient than individual adds)
     * @param docs - Array of documents
     */
    addDocuments(docs: Document[]): Promise<void>;
    /**
     * Hybrid search combining keyword and semantic search
     * @param query - Search query text
     * @param queryEmbedding - Query embedding vector
     * @param options - Search options
     * @returns Array of search results
     */
    search(query: string, queryEmbedding: number[], options: SearchOptions): Promise<SearchResult[]>;
    /**
     * Pre-filter chunks by metadata (date, type, patient)
     * @param filters - Filter criteria
     * @returns Array of chunk IDs that match filters
     */
    private preFilterByMetadata;
    /**
     * Semantic search using FAISS vector similarity
     * @param queryEmbedding - Query embedding vector
     * @param candidateIds - Optional list of candidate chunk IDs to search within
     * @param k - Number of results
     * @returns Array of results with semantic scores
     */
    private semanticSearch;
    /**
     * Keyword search using BM25 algorithm
     * @param query - Search query
     * @param candidateIds - Optional list of candidate chunk IDs
     * @param k - Number of results
     * @returns Array of results with BM25 scores
     */
    private keywordSearch;
    /**
     * Calculate BM25 score for a document given query tokens
     * @param queryTokens - Tokenized query
     * @param doc - Document to score
     * @returns BM25 score
     */
    private calculateBM25;
    /**
     * Combine semantic and keyword scores with alpha weighting
     * @param semanticResults - Results from semantic search
     * @param keywordResults - Results from keyword search
     * @param alpha - Weight for semantic score (0-1)
     * @param applyRecencyBoost - Whether to apply time decay boost
     * @returns Combined results
     */
    private combineScores;
    /**
     * Normalize scores to 0-1 range using min-max normalization
     * @param results - Results with raw scores
     * @returns Results with normalized scores
     */
    private normalizeScores;
    /**
     * Calculate recency boost using exponential time decay
     * Boost = 2^(-age_in_days / half_life_days)
     * @param chunkIds - Chunk IDs to calculate boosts for
     * @returns Map of chunk_id to boost factor (0-1)
     */
    private calculateRecencyBoosts;
    /**
     * Enrich results with full chunk data and snippets
     * @param results - Combined search results
     * @param query - Original query for snippet highlighting
     * @param snippetLength - Length of snippet in characters
     * @returns Final search results
     */
    private enrichResults;
    /**
     * Extract snippet from text around query terms
     * @param text - Full chunk text
     * @param query - Search query
     * @param maxLength - Maximum snippet length
     * @returns Snippet with ellipsis if truncated
     */
    private extractSnippet;
    /**
     * Tokenize text into lowercase alphanumeric tokens
     * @param text - Text to tokenize
     * @returns Array of tokens
     */
    private tokenize;
    /**
     * Compute term frequency for a list of tokens
     * @param tokens - Array of tokens
     * @returns Map of term to frequency
     */
    private computeTermFrequency;
    /**
     * Get index statistics
     */
    getStats(): {
        totalDocuments: number;
        totalTerms: number;
        averageDocLength: number;
    };
    /**
     * Clear all indexed data
     */
    clear(): void;
}
export declare const hybridSearchEngine: HybridSearchEngine;
export default hybridSearchEngine;
//# sourceMappingURL=hybrid-search.service.d.ts.map