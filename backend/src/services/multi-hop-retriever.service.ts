/**
 * Multi-Hop Retriever Service
 *
 * Phase 5: Multi-Hop Retrieval
 *
 * Extends retrieval to follow clinical relationships:
 * - Retrieve initial chunks via vector search
 * - Expand to related chunks via relationship_ids (1-2 hops)
 * - Rank all chunks with context-awareness
 * - Return enriched results with clinical rationale
 *
 * Example:
 * Query: "Why is the patient on Atorvastatin?"
 * 1. Initial retrieval: Atorvastatin chunk
 * 2. 1-hop expansion: Hyperlipidemia chunk (related condition)
 * 3. 2-hop expansion: Other medications for same condition
 * 4. Context-aware ranking: Prioritize direct relationships
 * 5. Result: "Atorvastatin for Hyperlipidemia (with context)"
 */

import { Pool } from 'pg';
import { StructuredQuery } from './query-understanding-agent.service';
import { RetrievalCandidate, RetrievalResult } from './retriever-agent.service';
import productionRetriever from './production-retriever.service';
import enrichmentStorageService from './enrichment-storage.service';
import enhancedChunkingService from './enhanced-chunking.service';

/**
 * Multi-Hop Retrieval Options
 */
export interface MultiHopOptions {
  enableMultiHop: boolean; // Enable multi-hop retrieval (default: true)
  maxHops: number; // Maximum relationship hops (0, 1, or 2)
  relationshipBoost: number; // Boost score for related chunks (0.0-1.0)
  useEnrichedText: boolean; // Use enriched_text instead of chunk_text
}

/**
 * Enhanced Retrieval Candidate with Relationship Context
 */
export interface EnhancedRetrievalCandidate extends RetrievalCandidate {
  hop_distance?: number; // 0=initial, 1=1-hop, 2=2-hop
  relationship_path?: string[]; // Chain of relationship IDs to this chunk
  related_artifacts?: string[]; // Related artifact IDs
  enrichment_score?: number; // Quality score from enrichment (0.0-1.0)
  enriched_text?: string; // Enriched text if available
}

/**
 * Multi-Hop Retrieval Result
 */
export interface MultiHopRetrievalResult extends RetrievalResult {
  candidates: EnhancedRetrievalCandidate[];
  hop_stats: {
    initial_chunks: number;
    hop_1_chunks: number;
    hop_2_chunks: number;
    total_relationships_followed: number;
  };
  enrichment_stats: {
    enriched_chunks: number;
    original_chunks: number;
    avg_enrichment_score: number;
  };
}

class MultiHopRetrieverService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'avon_health_rag',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('[Multi-Hop Retriever] PostgreSQL pool initialized');
  }

  /**
   * Retrieve with multi-hop relationship expansion
   *
   * Main entry point for relationship-aware retrieval
   */
  async retrieve(
    query: StructuredQuery,
    topK: number = 10,
    options?: Partial<MultiHopOptions>
  ): Promise<MultiHopRetrievalResult> {
    const startTime = Date.now();

    // Default options
    const opts: MultiHopOptions = {
      enableMultiHop: options?.enableMultiHop !== false,
      maxHops: options?.maxHops ?? 1,
      relationshipBoost: options?.relationshipBoost ?? 0.3,
      useEnrichedText: options?.useEnrichedText !== false,
    };

    console.log(
      `[Multi-Hop Retriever] Starting retrieval (multi-hop: ${opts.enableMultiHop}, maxHops: ${opts.maxHops})`
    );

    // ================================================================
    // STAGE 1: Initial Vector Retrieval
    // ================================================================
    console.log('[Multi-Hop Retriever] Stage 1: Initial vector retrieval...');
    const initialResult = await productionRetriever.retrieve(query, topK);

    if (initialResult.candidates.length === 0) {
      console.log('[Multi-Hop Retriever] No initial results found');
      return this.emptyResult(query.query_id, startTime);
    }

    console.log(
      `[Multi-Hop Retriever] ✓ Found ${initialResult.candidates.length} initial chunks`
    );

    // Convert to enhanced candidates
    const initialCandidates: EnhancedRetrievalCandidate[] = initialResult.candidates.map(
      (c) => ({
        ...c,
        hop_distance: 0,
        relationship_path: [],
        related_artifacts: [],
        enrichment_score: 0.5, // Default
      })
    );

    // If multi-hop disabled, return initial results
    if (!opts.enableMultiHop || opts.maxHops === 0) {
      return this.buildResult(initialCandidates, initialResult, startTime, opts);
    }

    // ================================================================
    // STAGE 2: Multi-Hop Expansion
    // ================================================================
    console.log('[Multi-Hop Retriever] Stage 2: Multi-hop expansion...');
    const allCandidates = [...initialCandidates];

    // Track visited chunks to avoid duplicates
    const visitedChunkIds = new Set(initialCandidates.map((c) => c.chunk_id));
    let totalRelationships = 0;

    // 1-hop expansion
    if (opts.maxHops >= 1) {
      console.log('[Multi-Hop Retriever] Expanding 1-hop relationships...');
      const hop1Start = Date.now();

      const hop1Candidates = await this.expandRelationships(
        initialCandidates,
        1,
        visitedChunkIds,
        opts,
        query.patient_id
      );

      hop1Candidates.forEach((c) => {
        visitedChunkIds.add(c.chunk_id);
        allCandidates.push(c);
      });

      totalRelationships += hop1Candidates.length;
      console.log(
        `[Multi-Hop Retriever] ✓ Added ${hop1Candidates.length} 1-hop chunks (${Date.now() - hop1Start}ms)`
      );

      // 2-hop expansion
      if (opts.maxHops >= 2) {
        console.log('[Multi-Hop Retriever] Expanding 2-hop relationships...');
        const hop2Start = Date.now();

        const hop2Candidates = await this.expandRelationships(
          hop1Candidates,
          2,
          visitedChunkIds,
          opts,
          query.patient_id
        );

        hop2Candidates.forEach((c) => {
          visitedChunkIds.add(c.chunk_id);
          allCandidates.push(c);
        });

        totalRelationships += hop2Candidates.length;
        console.log(
          `[Multi-Hop Retriever] ✓ Added ${hop2Candidates.length} 2-hop chunks (${Date.now() - hop2Start}ms)`
        );
      }
    }

    // ================================================================
    // STAGE 3: Context-Aware Ranking
    // ================================================================
    console.log('[Multi-Hop Retriever] Stage 3: Context-aware ranking...');
    const rankedCandidates = this.rankCandidates(allCandidates, opts);

    // Limit to topK
    const finalCandidates = rankedCandidates.slice(0, topK);

    console.log(
      `[Multi-Hop Retriever] ✓ Ranked ${allCandidates.length} candidates, returning top ${finalCandidates.length}`
    );

    // ================================================================
    // STAGE 4: Build Result
    // ================================================================
    return this.buildResult(finalCandidates, initialResult, startTime, opts);
  }

  /**
   * Expand relationships for a set of candidates
   *
   * Follows relationship_ids to find related chunks
   */
  private async expandRelationships(
    candidates: EnhancedRetrievalCandidate[],
    hopDistance: number,
    visitedChunkIds: Set<string>,
    options: MultiHopOptions,
    patientId: string
  ): Promise<EnhancedRetrievalCandidate[]> {
    const relatedCandidates: EnhancedRetrievalCandidate[] = [];

    for (const candidate of candidates) {
      // Get chunk metadata with relationship_ids
      const chunkMetadata = await this.getChunkMetadata(candidate.chunk_id);

      if (!chunkMetadata || !chunkMetadata.relationship_ids) {
        continue;
      }

      // Get related chunks via relationships
      const relatedChunks = await this.getRelatedChunks(
        chunkMetadata.relationship_ids,
        patientId,
        visitedChunkIds
      );

      // Convert to enhanced candidates
      for (const relatedChunk of relatedChunks) {
        const chunkContent = options.useEnrichedText
          ? relatedChunk.enriched_text || relatedChunk.chunk_text
          : relatedChunk.chunk_text;

        const enhancedCandidate: EnhancedRetrievalCandidate = {
          chunk: {
            chunk_id: relatedChunk.chunk_id,
            artifact_id: relatedChunk.artifact_id,
            patient_id: relatedChunk.patient_id,
            content: chunkContent,
            metadata: {
              artifact_type: relatedChunk.artifact_type,
              date:
                typeof relatedChunk.occurred_at === 'string'
                  ? relatedChunk.occurred_at
                  : relatedChunk.occurred_at.toISOString(),
              author: relatedChunk.author || undefined,
            },
          },
          score: candidate.score * 0.8, // Decay score for hops
          snippet: chunkContent.substring(0, 150) + '...',
          highlights: [], // No highlights for expanded chunks
          metadata: {
            artifact_type: relatedChunk.artifact_type,
            date:
              typeof relatedChunk.occurred_at === 'string'
                ? relatedChunk.occurred_at
                : relatedChunk.occurred_at.toISOString(),
            author: relatedChunk.author || undefined,
          },
          hop_distance: hopDistance,
          relationship_path: [
            ...(candidate.relationship_path || []),
            ...chunkMetadata.relationship_ids,
          ],
          related_artifacts: relatedChunk.related_artifact_ids || [],
          enrichment_score: this.calculateEnrichmentScore(relatedChunk),
          enriched_text: relatedChunk.enriched_text,
        };

        relatedCandidates.push(enhancedCandidate);
      }
    }

    return relatedCandidates;
  }

  /**
   * Get chunk metadata from database
   */
  private async getChunkMetadata(chunkId: string): Promise<any> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM chunk_metadata
        WHERE chunk_id = $1
      `;

      const result = await client.query(query, [chunkId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get related chunks via relationship IDs
   *
   * Looks up chunks that share relationships with the source chunk
   */
  private async getRelatedChunks(
    relationshipIds: string[],
    patientId: string,
    visitedChunkIds: Set<string>
  ): Promise<any[]> {
    if (relationshipIds.length === 0) return [];

    const client = await this.pool.connect();

    try {
      // Find chunks that have ANY of the same relationship IDs
      const query = `
        SELECT DISTINCT cm.*,
          COALESCE(ea.related_artifact_ids, '{}') as related_artifact_ids
        FROM chunk_metadata cm
        LEFT JOIN enriched_artifacts ea ON cm.artifact_id = ea.artifact_id
        WHERE cm.patient_id = $1
          AND cm.relationship_ids && $2::text[]
          AND cm.chunk_id NOT IN (${Array.from(visitedChunkIds).map((_, i) => `$${i + 3}`).join(', ')})
        LIMIT 20
      `;

      const params = [patientId, relationshipIds, ...Array.from(visitedChunkIds)];
      const result = await client.query(query, params);

      return result.rows;
    } catch (error) {
      console.error('[Multi-Hop Retriever] Error getting related chunks:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Rank candidates with context-awareness
   *
   * Factors:
   * 1. Initial similarity score (vector search)
   * 2. Hop distance penalty (closer = better)
   * 3. Enrichment score bonus
   * 4. Relationship boost
   */
  private rankCandidates(
    candidates: EnhancedRetrievalCandidate[],
    options: MultiHopOptions
  ): EnhancedRetrievalCandidate[] {
    return candidates
      .map((candidate) => {
        // Base score from vector similarity
        let score = candidate.score;

        // Hop distance penalty (0-hop = no penalty, 1-hop = -10%, 2-hop = -20%)
        const hopPenalty = (candidate.hop_distance || 0) * 0.1;
        score -= hopPenalty;

        // Enrichment bonus
        const enrichmentBonus = (candidate.enrichment_score || 0) * 0.2;
        score += enrichmentBonus;

        // Relationship boost for expanded chunks
        if ((candidate.hop_distance || 0) > 0) {
          score += options.relationshipBoost;
        }

        return {
          ...candidate,
          score: Math.max(0, Math.min(1, score)), // Clamp to [0, 1]
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate enrichment quality score
   *
   * Based on:
   * - Has enriched_text
   * - Has extracted_entities
   * - Number of relationships
   */
  private calculateEnrichmentScore(chunk: any): number {
    let score = 0.0;

    // Has enriched text (+0.4)
    if (chunk.enriched_text) {
      score += 0.4;
    }

    // Has extracted entities (+0.3)
    if (chunk.extracted_entities) {
      score += 0.3;
    }

    // Has relationships (+0.3, scaled by count)
    if (chunk.relationship_ids && chunk.relationship_ids.length > 0) {
      const relationshipScore = Math.min(0.3, chunk.relationship_ids.length * 0.05);
      score += relationshipScore;
    }

    return Math.min(1.0, score);
  }

  /**
   * Build multi-hop retrieval result
   */
  private buildResult(
    candidates: EnhancedRetrievalCandidate[],
    initialResult: RetrievalResult,
    startTime: number,
    options: MultiHopOptions
  ): MultiHopRetrievalResult {
    // Calculate stats
    const hop0 = candidates.filter((c) => c.hop_distance === 0).length;
    const hop1 = candidates.filter((c) => c.hop_distance === 1).length;
    const hop2 = candidates.filter((c) => c.hop_distance === 2).length;

    const enriched = candidates.filter(
      (c) => c.enrichment_score && c.enrichment_score > 0.4
    ).length;
    const avgEnrichment =
      candidates.reduce((sum, c) => sum + (c.enrichment_score || 0), 0) /
      (candidates.length || 1);

    return {
      candidates,
      total_searched: initialResult.total_searched,
      filtered_count: initialResult.filtered_count,
      retrieval_time_ms: Date.now() - startTime,
      query_id: initialResult.query_id,
      hop_stats: {
        initial_chunks: hop0,
        hop_1_chunks: hop1,
        hop_2_chunks: hop2,
        total_relationships_followed: hop1 + hop2,
      },
      enrichment_stats: {
        enriched_chunks: enriched,
        original_chunks: candidates.length - enriched,
        avg_enrichment_score: avgEnrichment,
      },
    };
  }

  /**
   * Empty result
   */
  private emptyResult(queryId: string, startTime: number): MultiHopRetrievalResult {
    return {
      candidates: [],
      total_searched: 0,
      filtered_count: 0,
      retrieval_time_ms: Date.now() - startTime,
      query_id: queryId,
      hop_stats: {
        initial_chunks: 0,
        hop_1_chunks: 0,
        hop_2_chunks: 0,
        total_relationships_followed: 0,
      },
      enrichment_stats: {
        enriched_chunks: 0,
        original_chunks: 0,
        avg_enrichment_score: 0,
      },
    };
  }

  /**
   * Close database pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Multi-Hop Retriever] Database pool closed');
  }
}

export const multiHopRetrieverService = new MultiHopRetrieverService();
export default multiHopRetrieverService;
