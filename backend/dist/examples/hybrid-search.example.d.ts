/**
 * Hybrid Search Engine Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Adding documents with embeddings
 * - Semantic-only search (alpha=1.0)
 * - Keyword-only search (alpha=0.0)
 * - Balanced hybrid search (alpha=0.5)
 * - Metadata filtering (date, type, patient)
 * - Recency boosting
 * - Batch document insertion
 */
/**
 * Example 1: Add documents to hybrid search index
 */
export declare function exampleAddDocuments(): Promise<void>;
/**
 * Example 2: Semantic-only search (alpha=1.0)
 */
export declare function exampleSemanticSearch(): Promise<import("../services/hybrid-search.service").SearchResult[]>;
/**
 * Example 3: Keyword-only search (alpha=0.0)
 */
export declare function exampleKeywordSearch(): Promise<import("../services/hybrid-search.service").SearchResult[]>;
/**
 * Example 4: Balanced hybrid search (alpha=0.5)
 */
export declare function exampleBalancedSearch(): Promise<import("../services/hybrid-search.service").SearchResult[]>;
/**
 * Example 5: Search with metadata filters (date range + type)
 */
export declare function exampleFilteredSearch(): Promise<import("../services/hybrid-search.service").SearchResult[]>;
/**
 * Example 6: Search with recency boosting
 */
export declare function exampleRecencyBoost(): Promise<{
    resultsNoBoost: import("../services/hybrid-search.service").SearchResult[];
    resultsWithBoost: import("../services/hybrid-search.service").SearchResult[];
}>;
/**
 * Example 7: Compare different alpha values
 */
export declare function exampleAlphaComparison(): Promise<void>;
/**
 * Example 8: Full RAG pipeline with hybrid search
 */
export declare function exampleRAGPipeline(): Promise<{
    results: import("../services/hybrid-search.service").SearchResult[];
    context: string;
}>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=hybrid-search.example.d.ts.map