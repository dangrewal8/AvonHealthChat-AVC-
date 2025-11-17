/**
 * Re-Ranker Service
 *
 * Refines initial retrieval rankings using additional relevance signals
 *
 * Features:
 * - Entity coverage scoring
 * - Query term overlap analysis
 * - Document position boosting
 * - Artifact type matching
 * - Rule-based re-ranking (no ML models)
 *
 */
import { Chunk } from './metadata-filter.service';
import { StructuredQuery } from './query-understanding-agent.service';
import { Entity } from './entity-extractor.service';
import { RetrievalCandidate } from './retriever-agent.service';
/**
 * Re-ranking result with detailed scores
 */
export interface ReRankingResult {
    candidate: RetrievalCandidate;
    original_score: number;
    rerank_score: number;
    signals: {
        entity_coverage: number;
        query_overlap: number;
        position_boost: number;
        type_match_bonus: number;
    };
    rank_change?: number;
}
/**
 * Re-ranking weights
 */
interface ReRankingWeights {
    original_score: number;
    entity_coverage: number;
    query_overlap: number;
    type_match_bonus: number;
}
/**
 * Re-Ranker Class
 *
 * Refines retrieval results using additional relevance signals
 */
declare class ReRanker {
    private readonly DEFAULT_WEIGHTS;
    private readonly TOP_K_FOR_RERANKING;
    /**
     * Intent to artifact type preference for re-ranking
     */
    private readonly INTENT_TYPE_BONUS;
    /**
     * Re-rank candidates to improve top results
     *
     * @param candidates - Initial retrieval candidates
     * @param query - Structured query
     * @param topK - Number of candidates to re-rank (default: 20)
     * @returns Re-ranked candidates
     */
    rerank(candidates: RetrievalCandidate[], query: StructuredQuery, topK?: number): RetrievalCandidate[];
    /**
     * Re-rank with detailed results
     *
     * @param candidates - Initial retrieval candidates
     * @param query - Structured query
     * @param topK - Number of candidates to re-rank
     * @returns Detailed re-ranking results
     */
    rerankWithDetails(candidates: RetrievalCandidate[], query: StructuredQuery, topK?: number): ReRankingResult[];
    /**
     * Calculate query relevance based on term overlap
     *
     * @param chunk - Chunk to score
     * @param query - Query string
     * @returns Query overlap score (0-1)
     */
    calculateQueryRelevance(chunk: Chunk, query: string): number;
    /**
     * Calculate boost based on entity matches
     *
     * @param chunk - Chunk to score
     * @param entities - Query entities
     * @returns Entity coverage score (0-1)
     */
    boostByEntityMatch(chunk: Chunk, entities: Entity[]): number;
    /**
     * Calculate position boost (earlier chunks get slight boost)
     *
     * @param position - Position in results (0-indexed)
     * @param totalResults - Total number of results
     * @returns Position boost (0-1)
     */
    private calculatePositionBoost;
    /**
     * Calculate type match bonus
     *
     * @param artifactType - Chunk artifact type
     * @param intent - Query intent
     * @returns Type match bonus (0-1)
     */
    private calculateTypeMatchBonus;
    /**
     * Combine re-ranking scores with weights
     *
     * @param originalScore - Original retrieval score
     * @param entityCoverage - Entity coverage score
     * @param queryOverlap - Query overlap score
     * @param typeMatchBonus - Type match bonus
     * @param weights - Custom weights (optional)
     * @returns Combined re-ranking score
     */
    private combineScores;
    /**
     * Tokenize text
     *
     * @param text - Input text
     * @returns Array of tokens
     */
    private tokenize;
    /**
     * Get default re-ranking weights
     *
     * @returns Default weights
     */
    getDefaultWeights(): ReRankingWeights;
    /**
     * Explain re-ranking for a candidate
     *
     * @param result - Re-ranking result
     * @returns Human-readable explanation
     */
    explainReRanking(result: ReRankingResult): string;
    /**
     * Compare rankings before and after re-ranking
     *
     * @param originalCandidates - Original candidates
     * @param rerankedCandidates - Re-ranked candidates
     * @returns Comparison summary
     */
    compareRankings(originalCandidates: RetrievalCandidate[], rerankedCandidates: RetrievalCandidate[]): {
        improved: number;
        degraded: number;
        unchanged: number;
        top_changes: Array<{
            chunk_id: string;
            old_rank: number;
            new_rank: number;
        }>;
    };
    /**
     * Batch re-rank multiple candidate lists
     *
     * @param candidateLists - Array of candidate lists
     * @param queries - Corresponding queries
     * @param topK - Number to re-rank per list
     * @returns Array of re-ranked lists
     */
    batchRerank(candidateLists: RetrievalCandidate[][], queries: StructuredQuery[], topK?: number): RetrievalCandidate[][];
}
declare const reranker: ReRanker;
export default reranker;
//# sourceMappingURL=reranker.service.d.ts.map