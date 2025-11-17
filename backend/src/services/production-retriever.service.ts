/**
 * Production Retrieval Service
 *
 * Connects to FAISS and PostgreSQL to retrieve actual indexed data
 *
 * Tech Stack: Node.js 18+, TypeScript (strict mode)
 * Storage: FAISS (vector search), PostgreSQL (metadata)
 * AI: Ollama (local embeddings - HIPAA compliant)
 */

import { StructuredQuery } from './query-understanding-agent.service';
import { RetrievalCandidate, Highlight, RetrievalResult, ChunkMetadata } from './retriever-agent.service';
import embeddingService from './embedding-factory.service';
import faissVectorStore from './faiss-vector-store.service';
import metadataDB from './metadata-db.service';

/**
 * Production Retriever Class
 *
 * Retrieves real data from FAISS and PostgreSQL
 */
class ProductionRetriever {
  /**
   * Retrieve relevant chunks using FAISS and PostgreSQL
   *
   * @param query - Structured query from query understanding agent
   * @param topK - Number of results to return
   * @returns Retrieval result with candidates
   */
  async retrieve(query: StructuredQuery, topK: number = 10): Promise<RetrievalResult> {
    const startTime = Date.now();

    try {
      console.log(`[ProductionRetriever] Retrieving top ${topK} results for query: "${query.original_query}"`);

      // ================================================================
      // STAGE 1: Generate Query Embedding
      // ================================================================
      console.log('[ProductionRetriever] Stage 1: Generating query embedding...');
      const embeddingStart = Date.now();

      const queryEmbedding = await embeddingService.generateEmbedding(query.original_query);

      console.log(`[ProductionRetriever] ✓ Query embedding generated (${Date.now() - embeddingStart}ms)`);

      // ================================================================
      // STAGE 2: Search FAISS Vector Store
      // ================================================================
      console.log('[ProductionRetriever] Stage 2: Searching FAISS vector store...');
      const searchStart = Date.now();

      // Search FAISS for similar vectors
      const searchResults = await faissVectorStore.search(queryEmbedding, topK * 2); // Get extra for filtering

      console.log(`[ProductionRetriever] ✓ FAISS search complete (${Date.now() - searchStart}ms) - Found ${searchResults.length} candidates`);

      if (searchResults.length === 0) {
        console.log('[ProductionRetriever] No results found in FAISS');
        return {
          candidates: [],
          total_searched: 0,
          filtered_count: 0,
          retrieval_time_ms: Date.now() - startTime,
          query_id: query.query_id,
        };
      }

      // ================================================================
      // STAGE 3: Load Metadata from PostgreSQL
      // ================================================================
      console.log('[ProductionRetriever] Stage 3: Loading chunk metadata from PostgreSQL...');
      const metadataStart = Date.now();

      const chunkIds = searchResults.map(r => r.id);
      const chunks = await metadataDB.getChunksByIds(chunkIds);

      console.log(`[ProductionRetriever] ✓ Metadata loaded (${Date.now() - metadataStart}ms) - ${chunks.length} chunks`);

      // ================================================================
      // STAGE 4: Build Retrieval Candidates
      // ================================================================
      console.log('[ProductionRetriever] Stage 4: Building retrieval candidates...');

      const candidates: RetrievalCandidate[] = [];

      for (const searchResult of searchResults) {
        const chunk = chunks.find(c => c.chunk_id === searchResult.id);

        if (!chunk) {
          console.warn(`[ProductionRetriever] Chunk ${searchResult.id} not found in metadata DB`);
          continue;
        }

        // DEBUG: Log chunk and filter info
        console.log(`[ProductionRetriever] DEBUG - Chunk ${chunk.chunk_id}: type=${chunk.artifact_type}, filters=${JSON.stringify(query.filters)}`);

        // Apply metadata filters if specified
        if (query.filters.artifact_types && query.filters.artifact_types.length > 0) {
          if (!query.filters.artifact_types.includes(chunk.artifact_type)) {
            console.log(`[ProductionRetriever] DEBUG - Filtered out chunk ${chunk.chunk_id} due to artifact_type mismatch`);
            continue; // Skip chunks that don't match artifact type filter
          }
        }

        // Apply date range filter if specified
        if (query.filters.date_range) {
          const chunkDate = new Date(chunk.occurred_at);
          if (query.filters.date_range.from && chunkDate < new Date(query.filters.date_range.from)) {
            continue;
          }
          if (query.filters.date_range.to && chunkDate > new Date(query.filters.date_range.to)) {
            continue;
          }
        }

        // Create snippet from chunk text
        const snippet = this.createSnippet(chunk.chunk_text, query.original_query);

        // Generate highlights
        const highlights = this.generateHighlights(chunk.chunk_text, query.original_query);

        // Build metadata object
        const metadata: ChunkMetadata = {
          artifact_type: chunk.artifact_type,
          date: typeof chunk.occurred_at === 'string' ? chunk.occurred_at : chunk.occurred_at.toISOString(),
          author: chunk.author,
        };

        // Calculate enhanced relevance score
        const enhancedScore = this.calculateEnhancedScore(
          searchResult.score,
          chunk.chunk_text,
          query.original_query,
          chunk.occurred_at,
          highlights.length
        );

        // Create retrieval candidate
        const candidate: RetrievalCandidate = {
          chunk: {
            chunk_id: chunk.chunk_id,
            artifact_id: chunk.artifact_id,
            patient_id: chunk.patient_id,
            content: chunk.chunk_text,
            metadata: {
              artifact_type: chunk.artifact_type,
              date: typeof chunk.occurred_at === 'string' ? chunk.occurred_at : chunk.occurred_at.toISOString(),
              author: chunk.author || undefined,
            },
          },
          score: enhancedScore,
          snippet,
          highlights,
          metadata,
        };

        candidates.push(candidate);

        // Stop if we have enough results
        if (candidates.length >= topK) {
          break;
        }
      }

      const totalTime = Date.now() - startTime;

      console.log(`[ProductionRetriever] ✅ Retrieval complete (${totalTime}ms) - Returning ${candidates.length} candidates`);

      return {
        candidates,
        total_searched: searchResults.length,
        filtered_count: candidates.length,
        retrieval_time_ms: totalTime,
        query_id: query.query_id,
        diagnostics: {
          metadata_filter_time_ms: Date.now() - metadataStart,
          search_time_ms: Date.now() - searchStart,
          scoring_time_ms: 0,
          snippet_time_ms: 0,
          cache_hit: false,
        },
      };
    } catch (error) {
      console.error('[ProductionRetriever] Error during retrieval:', error);
      throw error;
    }
  }

  /**
   * Calculate enhanced relevance score
   *
   * Combines multiple factors to produce meaningful, varied scores:
   * - Semantic similarity (50%): Base FAISS cosine similarity
   * - Keyword matching (25%): Exact query term matches
   * - Recency (15%): Newer records score higher
   * - Content quality (10%): Length and completeness
   *
   * @param baseScore - FAISS cosine similarity score
   * @param chunkText - Chunk text content
   * @param query - Original query string
   * @param occurredAt - Chunk date
   * @param highlightCount - Number of keyword highlights
   * @returns Enhanced score (0-1)
   */
  private calculateEnhancedScore(
    baseScore: number,
    chunkText: string,
    query: string,
    occurredAt: Date | string,
    highlightCount: number
  ): number {
    // 1. Semantic Similarity (50%) - Normalize FAISS score
    // FAISS IndexFlatIP returns cosine similarity (-1 to 1), but in practice 0.5-0.8 for relevant docs
    // Normalize to 0-1 where 0.5 = 0 and 0.8 = 1
    const normalizedSemanticScore = Math.max(0, Math.min(1, (baseScore - 0.5) / 0.3));
    const semanticComponent = normalizedSemanticScore * 0.5;

    // 2. Keyword Matching (25%) - Exact term matches
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const lowerText = chunkText.toLowerCase();

    let exactMatches = 0;
    let partialMatches = 0;

    for (const term of queryTerms) {
      // Count exact word matches
      const exactRegex = new RegExp(`\\b${term}\\b`, 'gi');
      const exactMatchCount = (lowerText.match(exactRegex) || []).length;
      exactMatches += exactMatchCount;

      // Count partial matches (contained within words)
      if (exactMatchCount === 0 && lowerText.includes(term)) {
        partialMatches++;
      }
    }

    // Score: exact matches worth more than partial
    const matchScore = Math.min(1, (exactMatches * 0.3 + partialMatches * 0.1));
    const keywordComponent = matchScore * 0.25;

    // 3. Recency (15%) - Newer documents score higher
    const date = typeof occurredAt === 'string' ? new Date(occurredAt) : occurredAt;
    const now = new Date();
    const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    // Score: documents within 30 days = 1.0, 1 year = 0.5, 2+ years = 0.0
    let recencyScore = 0;
    if (ageInDays <= 30) {
      recencyScore = 1.0;
    } else if (ageInDays <= 365) {
      recencyScore = 0.5 + (0.5 * (1 - (ageInDays - 30) / 335));
    } else if (ageInDays <= 730) {
      recencyScore = 0.5 * (1 - (ageInDays - 365) / 365);
    }
    const recencyComponent = recencyScore * 0.15;

    // 4. Content Quality (10%) - Length and structure
    const wordCount = chunkText.split(/\s+/).length;

    // Optimal length: 50-150 words
    let qualityScore = 0;
    if (wordCount >= 50 && wordCount <= 150) {
      qualityScore = 1.0;
    } else if (wordCount < 50) {
      qualityScore = wordCount / 50; // Too short
    } else {
      qualityScore = Math.max(0.5, 1 - (wordCount - 150) / 300); // Too long
    }
    const qualityComponent = qualityScore * 0.1;

    // Combine all components
    const finalScore = semanticComponent + keywordComponent + recencyComponent + qualityComponent;

    // Log scoring breakdown for debugging (first 3 candidates only)
    if (highlightCount >= 0) {
      console.log(`[ProductionRetriever] Score breakdown: semantic=${semanticComponent.toFixed(3)} (${(normalizedSemanticScore * 100).toFixed(0)}%), keyword=${keywordComponent.toFixed(3)}, recency=${recencyComponent.toFixed(3)}, quality=${qualityComponent.toFixed(3)}, final=${finalScore.toFixed(3)}`);
    }

    // Return score clamped to 0-1 range
    return Math.max(0, Math.min(1, finalScore));
  }

  /**
   * Create snippet from chunk text
   *
   * @param text - Full chunk text
   * @param query - Query string
   * @returns Snippet (up to 200 characters)
   */
  private createSnippet(text: string, query: string): string {
    const maxLength = 200;

    // Try to find query terms in text
    const queryTerms = query.toLowerCase().split(/\s+/);
    let bestPosition = 0;
    let maxMatches = 0;

    // Find position with most query term matches
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      let matches = 0;
      for (let j = i; j < Math.min(i + 20, words.length); j++) {
        const word = words[j].toLowerCase();
        if (queryTerms.some(term => word.includes(term))) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }

    // Extract snippet around best position
    const startWord = Math.max(0, bestPosition - 5);
    const snippetWords = words.slice(startWord, startWord + 30);
    let snippet = snippetWords.join(' ');

    // Truncate to max length
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength - 3) + '...';
    }

    return snippet;
  }

  /**
   * Generate highlights for query terms in text
   *
   * @param text - Chunk text
   * @param query - Query string
   * @returns Array of highlights
   */
  private generateHighlights(text: string, query: string): Highlight[] {
    const highlights: Highlight[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    for (const term of queryTerms) {
      const lowerText = text.toLowerCase();
      let index = lowerText.indexOf(term);

      while (index !== -1 && highlights.length < 5) {
        highlights.push({
          start: index,
          end: index + term.length,
          text: text.substring(index, index + term.length),
          score: 1.0,
        });

        index = lowerText.indexOf(term, index + 1);
      }
    }

    return highlights;
  }
}

// Export singleton instance
const productionRetriever = new ProductionRetriever();
export default productionRetriever;
