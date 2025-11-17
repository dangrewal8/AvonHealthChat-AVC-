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
import { RetrievalCandidate, Highlight } from './retriever-agent.service';
import metadataFilter from './metadata-filter.service';
import retrievalScorer from './retrieval-scorer.service';
import reranker from './reranker.service';

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
  k: number; // Number of results to return
  hybrid_alpha: number; // Weight for semantic vs keyword (0-1)
  enable_diversification: boolean;
  enable_time_decay: boolean;
  enable_reranking: boolean;
  diversity_threshold: number; // Content similarity threshold
  time_decay_rate: number; // Exponential decay rate
}

/**
 * Cache entry for integrated retrieval
 */
interface CacheEntry {
  result: IntegratedRetrievalResult;
  timestamp: number;
}

/**
 * Search result from hybrid search stage
 */
interface SearchResult {
  chunk: Chunk;
  semantic_similarity: number;
  keyword_score: number;
}

/**
 * Integrated Retriever Class
 *
 * Combines all retrieval components into unified pipeline
 */
class IntegratedRetriever {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_CONFIG: PipelineConfig = {
    k: 10,
    hybrid_alpha: 0.7, // 70% semantic, 30% keyword
    enable_diversification: true,
    enable_time_decay: true,
    enable_reranking: true,
    diversity_threshold: 0.85, // High similarity threshold
    time_decay_rate: 0.01, // Moderate decay
  };

  // Simulated chunk database
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
   * Execute complete retrieval pipeline
   *
   * @param query - Structured query with filters and entities
   * @param config - Pipeline configuration (optional)
   * @returns Complete retrieval result with diagnostics
   */
  async retrieve(
    query: StructuredQuery,
    config: Partial<PipelineConfig> = {}
  ): Promise<IntegratedRetrievalResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const stageMetrics: StageMetrics[] = [];

    try {
      // Check cache
      const cacheKey = this.getCacheKey(query, finalConfig);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          ...cached,
          cache_hit: true,
        };
      }

      // Stage 1: Metadata Filtering
      const filtered = await this.stageMetadataFiltering(query, stageMetrics);

      if (filtered.length === 0) {
        return this.emptyResult(query, stageMetrics, Date.now() - startTime);
      }

      // Stage 2: Hybrid Search
      const searchResults = await this.stageHybridSearch(
        query,
        filtered,
        finalConfig,
        stageMetrics
      );

      // Stage 3: Initial Scoring
      const scored = await this.stageInitialScoring(query, searchResults, stageMetrics);

      // Stage 4: Re-Ranking (optional)
      const reranked = finalConfig.enable_reranking
        ? await this.stageReRanking(query, scored, stageMetrics)
        : scored;

      // Stage 5: Diversification (optional)
      const diversified = finalConfig.enable_diversification
        ? await this.stageDiversification(reranked, finalConfig, stageMetrics)
        : reranked;

      // Stage 6: Time Decay (optional)
      const withDecay = finalConfig.enable_time_decay
        ? await this.stageTimeDecay(diversified, finalConfig, stageMetrics)
        : diversified;

      // Stage 7: Highlight Generation
      const final = await this.stageHighlightGeneration(query, withDecay, stageMetrics);

      // Build result
      const result: IntegratedRetrievalResult = {
        candidates: final.slice(0, finalConfig.k),
        total_searched: this.chunks.length,
        filtered_count: filtered.length,
        retrieval_time_ms: Date.now() - startTime,
        query_id: query.query_id,
        stage_metrics: stageMetrics,
        cache_hit: false,
      };

      // Cache result
      this.addToCache(cacheKey, result);

      return result;
    } catch (error) {
      // Error handling: return partial results
      return this.handleError(query, error, stageMetrics, Date.now() - startTime);
    }
  }

  /**
   * Stage 1: Metadata Filtering
   * Reduces search space using metadata filters
   */
  private async stageMetadataFiltering(
    query: StructuredQuery,
    metrics: StageMetrics[]
  ): Promise<Chunk[]> {
    const startTime = Date.now();

    try {
      const filters = {
        patient_id: query.patient_id,
        artifact_types: query.filters.artifact_types,
        date_from: query.filters.date_range?.from,
        date_to: query.filters.date_range?.to,
      };

      const filtered = metadataFilter.applyFiltersWithIndexes(filters);

      metrics.push({
        stage: 'metadata_filtering',
        duration_ms: Date.now() - startTime,
        input_count: this.chunks.length,
        output_count: filtered.length,
      });

      return filtered;
    } catch (error) {
      // Fallback: return all chunks
      metrics.push({
        stage: 'metadata_filtering',
        duration_ms: Date.now() - startTime,
        input_count: this.chunks.length,
        output_count: this.chunks.length,
      });
      return this.chunks;
    }
  }

  /**
   * Stage 2: Hybrid Search
   * Combines semantic and keyword search
   */
  private async stageHybridSearch(
    query: StructuredQuery,
    chunks: Chunk[],
    config: PipelineConfig,
    metrics: StageMetrics[]
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      // Simulate semantic similarity (in production: use vector embeddings)
      const results: SearchResult[] = chunks.map((chunk) => {
        const semantic = this.simulateSemanticSimilarity(query.original_query, chunk.content);
        const keyword = retrievalScorer.calculateKeywordMatch(chunk.content, query.original_query);

        return {
          chunk,
          semantic_similarity: semantic,
          keyword_score: keyword,
        };
      });

      // Sort by hybrid score: alpha * semantic + (1 - alpha) * keyword
      results.sort((a, b) => {
        const scoreA = config.hybrid_alpha * a.semantic_similarity + (1 - config.hybrid_alpha) * a.keyword_score;
        const scoreB = config.hybrid_alpha * b.semantic_similarity + (1 - config.hybrid_alpha) * b.keyword_score;
        return scoreB - scoreA;
      });

      // Take top 20 for further processing
      const topResults = results.slice(0, 20);

      metrics.push({
        stage: 'hybrid_search',
        duration_ms: Date.now() - startTime,
        input_count: chunks.length,
        output_count: topResults.length,
      });

      return topResults;
    } catch (error) {
      // Fallback: return all chunks as search results
      const fallback = chunks.slice(0, 20).map((chunk) => ({
        chunk,
        semantic_similarity: 0.5,
        keyword_score: 0.5,
      }));

      metrics.push({
        stage: 'hybrid_search',
        duration_ms: Date.now() - startTime,
        input_count: chunks.length,
        output_count: fallback.length,
      });

      return fallback;
    }
  }

  /**
   * Stage 3: Initial Scoring
   * Combines multiple relevance signals
   */
  private async stageInitialScoring(
    query: StructuredQuery,
    searchResults: SearchResult[],
    metrics: StageMetrics[]
  ): Promise<RetrievalCandidate[]> {
    const startTime = Date.now();

    try {
      const chunks = searchResults.map((r) => r.chunk);
      const similarities = searchResults.map((r) => r.semantic_similarity);

      const scored = retrievalScorer.scoreAndRank(chunks, query, similarities, 20);

      // Convert to retrieval candidates
      const candidates = scored.map((candidate) => ({
        chunk: candidate.chunk,
        score: candidate.scores.combined,
        snippet: '',
        highlights: [] as Highlight[],
        metadata: candidate.chunk.metadata,
        rank: candidate.rank,
      }));

      metrics.push({
        stage: 'initial_scoring',
        duration_ms: Date.now() - startTime,
        input_count: searchResults.length,
        output_count: candidates.length,
      });

      return candidates;
    } catch (error) {
      // Fallback: use hybrid scores
      const fallback = searchResults.map((result, index) => ({
        chunk: result.chunk,
        score: (result.semantic_similarity + result.keyword_score) / 2,
        snippet: '',
        highlights: [] as Highlight[],
        metadata: result.chunk.metadata,
        rank: index + 1,
      }));

      metrics.push({
        stage: 'initial_scoring',
        duration_ms: Date.now() - startTime,
        input_count: searchResults.length,
        output_count: fallback.length,
      });

      return fallback;
    }
  }

  /**
   * Stage 4: Re-Ranking
   * Refines top results using entity coverage and query overlap
   */
  private async stageReRanking(
    query: StructuredQuery,
    candidates: RetrievalCandidate[],
    metrics: StageMetrics[]
  ): Promise<RetrievalCandidate[]> {
    const startTime = Date.now();

    try {
      const reranked = reranker.rerank(candidates, query, 20);

      metrics.push({
        stage: 're_ranking',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: reranked.length,
      });

      return reranked;
    } catch (error) {
      // Fallback: return original candidates
      metrics.push({
        stage: 're_ranking',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: candidates.length,
      });

      return candidates;
    }
  }

  /**
   * Stage 5: Diversification
   * Penalizes duplicate or highly similar content
   */
  private async stageDiversification(
    candidates: RetrievalCandidate[],
    config: PipelineConfig,
    metrics: StageMetrics[]
  ): Promise<RetrievalCandidate[]> {
    const startTime = Date.now();

    try {
      const diversified: RetrievalCandidate[] = [];
      const seen: Set<string> = new Set();

      for (const candidate of candidates) {
        // Check if similar content already included
        for (const seenContent of seen) {
          const similarity = this.calculateContentSimilarity(candidate.chunk.content, seenContent);

          if (similarity > config.diversity_threshold) {
            // Penalize score for duplicate content but still include
            candidate.score *= 0.7;
            break;
          }
        }

        diversified.push(candidate);
        seen.add(candidate.chunk.content);
      }

      // Re-sort after score adjustments
      diversified.sort((a, b) => b.score - a.score);

      // Update ranks
      diversified.forEach((c, i) => {
        c.rank = i + 1;
      });

      metrics.push({
        stage: 'diversification',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: diversified.length,
      });

      return diversified;
    } catch (error) {
      // Fallback: return original candidates
      metrics.push({
        stage: 'diversification',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: candidates.length,
      });

      return candidates;
    }
  }

  /**
   * Stage 6: Time Decay
   * Boosts more recent documents
   */
  private async stageTimeDecay(
    candidates: RetrievalCandidate[],
    _config: PipelineConfig,
    metrics: StageMetrics[]
  ): Promise<RetrievalCandidate[]> {
    const startTime = Date.now();

    try {
      const withDecay = candidates.map((candidate) => {
        const recencyBoost = retrievalScorer.calculateRecencyBoost(candidate.metadata.date);

        // Apply time decay: boost score by recency factor
        const adjustedScore = candidate.score * (0.7 + 0.3 * recencyBoost);

        return {
          ...candidate,
          score: adjustedScore,
        };
      });

      // Re-sort by adjusted scores
      withDecay.sort((a, b) => b.score - a.score);

      // Update ranks
      withDecay.forEach((c, i) => {
        c.rank = i + 1;
      });

      metrics.push({
        stage: 'time_decay',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: withDecay.length,
      });

      return withDecay;
    } catch (error) {
      // Fallback: return original candidates
      metrics.push({
        stage: 'time_decay',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: candidates.length,
      });

      return candidates;
    }
  }

  /**
   * Stage 7: Highlight Generation
   * Marks query terms in content and generates snippets
   */
  private async stageHighlightGeneration(
    query: StructuredQuery,
    candidates: RetrievalCandidate[],
    metrics: StageMetrics[]
  ): Promise<RetrievalCandidate[]> {
    const startTime = Date.now();

    try {
      const queryTokens = this.tokenize(query.original_query.toLowerCase());

      const withHighlights = candidates.map((candidate) => {
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

      metrics.push({
        stage: 'highlight_generation',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: withHighlights.length,
      });

      return withHighlights;
    } catch (error) {
      // Fallback: return candidates with empty snippets/highlights
      metrics.push({
        stage: 'highlight_generation',
        duration_ms: Date.now() - startTime,
        input_count: candidates.length,
        output_count: candidates.length,
      });

      return candidates.map((c) => ({
        ...c,
        snippet: c.chunk.content.substring(0, 100) + '...',
        highlights: [],
      }));
    }
  }

  /**
   * Generate contextual snippet around query terms
   */
  private generateSnippet(content: string, queryTokens: string[], maxLength: number = 200): string {
    if (content.length <= maxLength) {
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
      return content.substring(0, maxLength) + '...';
    }

    // Center snippet around match
    const halfLength = Math.floor(maxLength / 2);
    let start = Math.max(0, bestPos - halfLength);
    let end = Math.min(content.length, start + maxLength);

    if (end - start < maxLength) {
      start = Math.max(0, end - maxLength);
    }

    let snippet = content.substring(start, end);

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Generate highlights for query terms
   */
  private generateHighlights(content: string, queryTokens: string[]): Highlight[] {
    const highlights: Highlight[] = [];
    const contentLower = content.toLowerCase();

    for (const token of queryTokens) {
      if (token.length < 3) continue;

      let pos = 0;
      while ((pos = contentLower.indexOf(token, pos)) !== -1) {
        highlights.push({
          start: pos,
          end: pos + token.length,
          text: content.substring(pos, pos + token.length),
          score: 1.0,
        });
        pos += token.length;
      }
    }

    highlights.sort((a, b) => a.start - b.start);
    return highlights;
  }

  /**
   * Calculate content similarity using Jaccard similarity
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const tokens1 = new Set(this.tokenize(content1.toLowerCase()));
    const tokens2 = new Set(this.tokenize(content2.toLowerCase()));

    const intersection = new Set([...tokens1].filter((t) => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  /**
   * Simulate semantic similarity (placeholder for production vector search)
   */
  private simulateSemanticSimilarity(query: string, content: string): number {
    const queryTokens = new Set(this.tokenize(query.toLowerCase()));
    const contentTokens = new Set(this.tokenize(content.toLowerCase()));

    const intersection = new Set([...queryTokens].filter((t) => contentTokens.has(t)));
    const union = new Set([...queryTokens, ...contentTokens]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Generate empty result when no candidates found
   */
  private emptyResult(
    query: StructuredQuery,
    metrics: StageMetrics[],
    elapsed: number
  ): IntegratedRetrievalResult {
    return {
      candidates: [],
      total_searched: this.chunks.length,
      filtered_count: 0,
      retrieval_time_ms: elapsed,
      query_id: query.query_id,
      stage_metrics: metrics,
      cache_hit: false,
    };
  }

  /**
   * Handle pipeline errors with partial results
   */
  private handleError(
    query: StructuredQuery,
    error: unknown,
    metrics: StageMetrics[],
    elapsed: number
  ): IntegratedRetrievalResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      candidates: [],
      total_searched: this.chunks.length,
      filtered_count: 0,
      retrieval_time_ms: elapsed,
      query_id: query.query_id,
      stage_metrics: metrics,
      cache_hit: false,
      error: errorMessage,
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(query: StructuredQuery, config: PipelineConfig): string {
    return JSON.stringify({
      query: query.original_query,
      patient_id: query.patient_id,
      intent: query.intent,
      filters: query.filters,
      config,
    });
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): IntegratedRetrievalResult | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, result: IntegratedRetrievalResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
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
   * Get pipeline summary
   */
  getPipelineSummary(result: IntegratedRetrievalResult): string {
    const lines = [
      `Integrated Retrieval Pipeline Summary`,
      `${'='.repeat(60)}`,
      ``,
      `Query ID: ${result.query_id}`,
      `Total Time: ${result.retrieval_time_ms}ms`,
      `Cache Hit: ${result.cache_hit ? 'Yes' : 'No'}`,
      ``,
      `Results:`,
      `  Total Searched: ${result.total_searched}`,
      `  After Filtering: ${result.filtered_count}`,
      `  Final Candidates: ${result.candidates.length}`,
      `  Reduction: ${(((result.total_searched - result.filtered_count) / result.total_searched) * 100).toFixed(1)}%`,
      ``,
      `Pipeline Stages:`,
    ];

    result.stage_metrics.forEach((stage) => {
      const pct = ((stage.duration_ms / result.retrieval_time_ms) * 100).toFixed(1);
      lines.push(
        `  ${stage.stage.padEnd(25)} ${String(stage.duration_ms).padStart(4)}ms (${pct.padStart(5)}%) ` +
          `[${stage.input_count} → ${stage.output_count}]`
      );
    });

    if (result.error) {
      lines.push('', `Error: ${result.error}`);
    }

    return lines.join('\n');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; ttl_ms: number } {
    return {
      size: this.cache.size,
      ttl_ms: this.CACHE_TTL_MS,
    };
  }

  /**
   * Batch retrieve for multiple queries
   */
  async batchRetrieve(
    queries: StructuredQuery[],
    config: Partial<PipelineConfig> = {}
  ): Promise<IntegratedRetrievalResult[]> {
    return Promise.all(queries.map((query) => this.retrieve(query, config)));
  }
}

// Export singleton instance
const integratedRetriever = new IntegratedRetriever();
export default integratedRetriever;
