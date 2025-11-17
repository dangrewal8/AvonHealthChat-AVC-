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

import { Chunk, FilterCriteria } from './metadata-filter.service';
import { StructuredQuery } from './query-understanding-agent.service';
import metadataFilter from './metadata-filter.service';
import retrievalScorer from './retrieval-scorer.service';
import embeddingService from './embedding-factory.service';
import faissVectorStore from './faiss-vector-store.service';

/**
 * Highlight span in content
 */
export interface Highlight {
  start: number; // Character offset start
  end: number; // Character offset end
  text: string; // Highlighted text
  score: number; // Relevance score
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
  snippet: string; // Contextual snippet with query terms
  highlights: Highlight[]; // Highlighted query terms
  metadata: ChunkMetadata;
  rank?: number;
}

/**
 * Retrieval result with diagnostics
 */
export interface RetrievalResult {
  candidates: RetrievalCandidate[];
  total_searched: number; // Total chunks searched
  filtered_count: number; // Chunks after metadata filtering
  retrieval_time_ms: number; // Total retrieval time
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
 * Simulated hybrid search result
 * In production, this would come from vector store
 */
interface SearchResult {
  chunk: Chunk;
  semantic_similarity: number;
  keyword_score: number;
}

/**
 * Cache entry for query results
 */
interface CacheEntry {
  result: RetrievalResult;
  timestamp: number;
}

/**
 * Retriever Agent Class
 *
 * Orchestrates the full retrieval pipeline
 */
class RetrieverAgent {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_TOP_K = 10;
  private readonly SNIPPET_LENGTH = 200; // Characters
  private dimensionValidated: boolean = false;

  // Simulated chunk database (in production, this would be a vector store)
  private chunks: Chunk[] = [];

  /**
   * Initialize with chunks
   *
   * @param chunks - Array of chunks to search
   */
  initialize(chunks: Chunk[]): void {
    this.chunks = chunks;
    metadataFilter.buildIndexes(chunks);
  }

  /**
   * Retrieve relevant chunks for a structured query
   *
   * @param structuredQuery - Parsed query with filters
   * @param topK - Number of top results to return (default: 10)
   * @returns Retrieval result with candidates and diagnostics
   */
  async retrieve(structuredQuery: StructuredQuery, topK: number = this.DEFAULT_TOP_K): Promise<RetrievalResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(structuredQuery);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        diagnostics: {
          ...cached.diagnostics!,
          cache_hit: true,
        },
      };
    }

    const diagnostics = {
      metadata_filter_time_ms: 0,
      search_time_ms: 0,
      scoring_time_ms: 0,
      snippet_time_ms: 0,
      cache_hit: false,
    };

    // Step 1: Apply metadata filters
    const filterStart = Date.now();
    const filtered = this.applyMetadataFilters(structuredQuery);
    diagnostics.metadata_filter_time_ms = Date.now() - filterStart;

    // Step 2: Hybrid search (semantic + keyword)
    const searchStart = Date.now();
    const searchResults = await this.hybridSearch(structuredQuery.original_query, filtered, topK * 2);
    diagnostics.search_time_ms = Date.now() - searchStart;

    // Step 3: Score and rank
    const scoringStart = Date.now();
    const ranked = this.scoreAndRank(searchResults, structuredQuery, topK);
    diagnostics.scoring_time_ms = Date.now() - scoringStart;

    // Step 4: Generate snippets and highlights
    const snippetStart = Date.now();
    const candidates = this.enrichCandidates(ranked, structuredQuery.original_query);
    diagnostics.snippet_time_ms = Date.now() - snippetStart;

    // Build result
    const result: RetrievalResult = {
      candidates,
      total_searched: this.chunks.length,
      filtered_count: filtered.length,
      retrieval_time_ms: Date.now() - startTime,
      query_id: structuredQuery.query_id,
      diagnostics,
    };

    // Cache result
    this.addToCache(cacheKey, result);

    return result;
  }

  /**
   * Apply metadata filters to reduce search space
   *
   * @param query - Structured query
   * @returns Filtered chunks
   */
  private applyMetadataFilters(query: StructuredQuery): Chunk[] {
    const filters: FilterCriteria = {
      patient_id: query.patient_id,
      artifact_types: query.filters.artifact_types,
      date_from: query.filters.date_range?.from,
      date_to: query.filters.date_range?.to,
    };

    // Use indexed filtering for performance
    return metadataFilter.applyFiltersWithIndexes(filters);
  }

  /**
   * Validate embedding dimensions match FAISS vector store
   *
   * Logs warning if mismatch detected
   */
  private async validateEmbeddingDimensions(queryEmbedding: number[]): Promise<void> {
    if (this.dimensionValidated) {
      return; // Already validated
    }

    try {
      // Get embedding model info
      const modelInfo = await embeddingService.getModelInfo();
      const queryDimensions = queryEmbedding.length;
      const expectedDimensions = modelInfo.dimensions;

      if (queryDimensions !== expectedDimensions) {
        console.warn(
          `[Retriever Agent] ⚠️  Embedding dimension mismatch detected!\n` +
          `  Query embedding: ${queryDimensions} dimensions\n` +
          `  Expected (${modelInfo.provider}/${modelInfo.model}): ${expectedDimensions} dimensions\n` +
          `  This may cause retrieval issues.`
        );
      } else {
        console.log(
          `[Retriever Agent] ✓ Embedding dimensions validated: ${queryDimensions}D (${modelInfo.provider}/${modelInfo.model})`
        );
      }

      this.dimensionValidated = true;
    } catch (error) {
      console.warn('[Retriever Agent] Could not validate embedding dimensions:', error);
      this.dimensionValidated = true; // Don't keep trying
    }
  }

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
  private async hybridSearch(query: string, chunks: Chunk[], topK: number): Promise<SearchResult[]> {
    // Generate query embedding using factory (Ollama provider)
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Validate dimensions on first call
    await this.validateEmbeddingDimensions(queryEmbedding);

    // Get chunk IDs from filtered chunks
    const chunkIds = chunks.map(c => c.chunk_id);

    // If no chunks to search, return empty
    if (chunkIds.length === 0) {
      return [];
    }

    // Search FAISS vector store for semantic similarity
    // This returns chunks with their similarity scores
    const semanticResults = await faissVectorStore.search(
      queryEmbedding,
      Math.min(topK * 2, chunkIds.length) // Get 2x topK for reranking
    );

    // Create a map of chunk_id -> semantic similarity score
    const semanticScoreMap = new Map<string, number>();
    for (const result of semanticResults) {
      semanticScoreMap.set(result.id, result.score);
    }

    // Combine semantic and keyword scores for filtered chunks
    const results: SearchResult[] = [];

    for (const chunk of chunks) {
      // Get semantic similarity from FAISS results (0 if not found)
      const semantic = semanticScoreMap.get(chunk.chunk_id) || 0;

      // Calculate keyword score using BM25
      const keyword = retrievalScorer.calculateKeywordMatch(chunk.content, query);

      results.push({
        chunk,
        semantic_similarity: semantic,
        keyword_score: keyword,
      });
    }

    // Sort by combined semantic (60%) + keyword (40%) score
    results.sort((a, b) => {
      const scoreA = 0.6 * a.semantic_similarity + 0.4 * a.keyword_score;
      const scoreB = 0.6 * b.semantic_similarity + 0.4 * b.keyword_score;
      return scoreB - scoreA;
    });

    // Return top K
    return results.slice(0, topK);
  }


  /**
   * Score and rank search results
   *
   * @param searchResults - Results from hybrid search
   * @param query - Structured query
   * @param topK - Number of top results
   * @returns Ranked candidates
   */
  private scoreAndRank(
    searchResults: SearchResult[],
    query: StructuredQuery,
    topK: number
  ): RetrievalCandidate[] {
    // Score all candidates
    const chunks = searchResults.map((r) => r.chunk);
    const similarities = searchResults.map((r) => r.semantic_similarity);

    const scored = retrievalScorer.scoreAndRank(chunks, query, similarities, topK);

    // Convert to retrieval candidates
    return scored.map((candidate) => ({
      chunk: candidate.chunk,
      score: candidate.scores.combined,
      snippet: '', // Will be filled in enrichCandidates
      highlights: [], // Will be filled in enrichCandidates
      metadata: candidate.chunk.metadata,
      rank: candidate.rank,
    }));
  }

  /**
   * Enrich candidates with snippets and highlights
   *
   * @param candidates - Ranked candidates
   * @param query - Original query string
   * @returns Enriched candidates
   */
  private enrichCandidates(candidates: RetrievalCandidate[], query: string): RetrievalCandidate[] {
    const queryTokens = this.tokenize(query.toLowerCase());

    return candidates.map((candidate) => {
      // Generate snippet
      const snippet = this.generateSnippet(candidate.chunk.content, queryTokens);

      // Generate highlights
      const highlights = this.generateHighlights(candidate.chunk.content, queryTokens);

      return {
        ...candidate,
        snippet,
        highlights,
      };
    });
  }

  /**
   * Generate contextual snippet around query terms
   *
   * @param content - Full content
   * @param queryTokens - Query tokens
   * @returns Snippet
   */
  private generateSnippet(content: string, queryTokens: string[]): string {
    if (content.length <= this.SNIPPET_LENGTH) {
      return content;
    }

    // Find first occurrence of any query token
    const contentLower = content.toLowerCase();
    let bestPos = -1;

    for (const token of queryTokens) {
      const pos = contentLower.indexOf(token);
      if (pos !== -1 && (bestPos === -1 || pos < bestPos)) {
        bestPos = pos;
      }
    }

    if (bestPos === -1) {
      // No match, return beginning
      return content.substring(0, this.SNIPPET_LENGTH) + '...';
    }

    // Center snippet around match
    const halfLength = Math.floor(this.SNIPPET_LENGTH / 2);
    let start = Math.max(0, bestPos - halfLength);
    let end = Math.min(content.length, start + this.SNIPPET_LENGTH);

    // Adjust start if we're at the end
    if (end - start < this.SNIPPET_LENGTH) {
      start = Math.max(0, end - this.SNIPPET_LENGTH);
    }

    // Try to start/end at word boundaries
    if (start > 0) {
      const nextSpace = content.indexOf(' ', start);
      if (nextSpace !== -1 && nextSpace - start < 20) {
        start = nextSpace + 1;
      }
    }

    let snippet = content.substring(start, end);

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Generate highlights for query terms
   *
   * @param content - Content to highlight
   * @param queryTokens - Query tokens
   * @returns Array of highlights
   */
  private generateHighlights(content: string, queryTokens: string[]): Highlight[] {
    const highlights: Highlight[] = [];
    const contentLower = content.toLowerCase();

    for (const token of queryTokens) {
      if (token.length < 3) continue; // Skip very short tokens

      let pos = 0;
      while ((pos = contentLower.indexOf(token, pos)) !== -1) {
        highlights.push({
          start: pos,
          end: pos + token.length,
          text: content.substring(pos, pos + token.length),
          score: 1.0, // Could vary based on importance
        });
        pos += token.length;
      }
    }

    // Sort by position
    highlights.sort((a, b) => a.start - b.start);

    return highlights;
  }

  /**
   * Tokenize text
   *
   * @param text - Input text
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Generate cache key for query
   *
   * @param query - Structured query
   * @returns Cache key
   */
  private getCacheKey(query: StructuredQuery): string {
    return JSON.stringify({
      query: query.original_query,
      patient_id: query.patient_id,
      intent: query.intent,
      filters: query.filters,
    });
  }

  /**
   * Get result from cache
   *
   * @param key - Cache key
   * @returns Cached result or null
   */
  private getFromCache(key: string): RetrievalResult | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Add result to cache
   *
   * @param key - Cache key
   * @param result - Result to cache
   */
  private addToCache(key: string, result: RetrievalResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   *
   * @returns Cache stats
   */
  getCacheStats(): {
    size: number;
    ttl_ms: number;
  } {
    return {
      size: this.cache.size,
      ttl_ms: this.CACHE_TTL_MS,
    };
  }

  /**
   * Batch retrieve for multiple queries
   *
   * @param queries - Array of structured queries
   * @param topK - Number of results per query
   * @returns Array of retrieval results
   */
  async batchRetrieve(queries: StructuredQuery[], topK: number = this.DEFAULT_TOP_K): Promise<RetrievalResult[]> {
    return Promise.all(queries.map((query) => this.retrieve(query, topK)));
  }

  /**
   * Get retrieval diagnostics summary
   *
   * @param result - Retrieval result
   * @returns Human-readable summary
   */
  getDiagnosticsSummary(result: RetrievalResult): string {
    const lines = [
      `Query ID: ${result.query_id}`,
      `Total Time: ${result.retrieval_time_ms}ms`,
      ``,
      'Pipeline Breakdown:',
      `  Metadata Filtering: ${result.diagnostics?.metadata_filter_time_ms || 0}ms`,
      `  Hybrid Search: ${result.diagnostics?.search_time_ms || 0}ms`,
      `  Scoring & Ranking: ${result.diagnostics?.scoring_time_ms || 0}ms`,
      `  Snippet Generation: ${result.diagnostics?.snippet_time_ms || 0}ms`,
      ``,
      'Search Space:',
      `  Total chunks: ${result.total_searched}`,
      `  After filtering: ${result.filtered_count}`,
      `  Candidates returned: ${result.candidates.length}`,
      `  Reduction: ${(((result.total_searched - result.filtered_count) / result.total_searched) * 100).toFixed(1)}%`,
      ``,
      `Cache Hit: ${result.diagnostics?.cache_hit ? 'Yes' : 'No'}`,
    ];

    return lines.join('\n');
  }

  /**
   * Explain ranking for top result
   *
   * @param result - Retrieval result
   * @returns Explanation
   */
  explainTopResult(result: RetrievalResult): string {
    if (result.candidates.length === 0) {
      return 'No results found';
    }

    const top = result.candidates[0];

    const lines = [
      `Top Result: Rank ${top.rank}`,
      `Chunk ID: ${top.chunk.chunk_id}`,
      `Score: ${top.score.toFixed(3)}`,
      ``,
      'Metadata:',
      `  Type: ${top.metadata.artifact_type}`,
      `  Date: ${top.metadata.date}`,
      `  Author: ${top.metadata.author || 'N/A'}`,
      ``,
      'Content Preview:',
      `  ${top.snippet}`,
      ``,
      `Highlights: ${top.highlights.length} query terms found`,
    ];

    return lines.join('\n');
  }
}

// Export singleton instance
const retrieverAgent = new RetrieverAgent();
export default retrieverAgent;
