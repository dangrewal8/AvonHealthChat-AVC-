/**
 * Retrieval Scorer Service
 *
 * Combines multiple scoring signals for ranking retrieval candidates
 *
 * Features:
 * - Semantic similarity scoring (vector search)
 * - Keyword matching (BM25/TF-IDF)
 * - Recency boost (time decay)
 * - Type preference (intent-based)
 * - Weighted score combination
 * - Score normalization
 *
 */
import { Chunk } from './metadata-filter.service';
import { StructuredQuery } from './query-understanding-agent.service';
import { QueryIntent } from './intent-classifier.service';
/**
 * Candidate chunk with scores
 */
export interface Candidate {
    chunk: Chunk;
    scores: {
        semantic_similarity: number;
        keyword_match: number;
        recency_boost: number;
        type_preference: number;
        combined: number;
    };
    rank?: number;
}
/**
 * Scoring weights configuration
 */
export interface ScoringWeights {
    semantic: number;
    keyword: number;
    recency: number;
    type_preference: number;
}
/**
 * Retrieval Scorer Class
 *
 * Scores and ranks retrieval candidates using multiple signals
 */
declare class RetrievalScorer {
    private readonly DEFAULT_WEIGHTS;
    private readonly BM25_PARAMS;
    /**
     * Intent to artifact type preference mapping
     * Higher scores for matching types
     */
    private readonly INTENT_TYPE_PREFERENCE;
    /**
     * Score a candidate chunk against a structured query
     *
     * @param chunk - Candidate chunk with semantic similarity
     * @param query - Structured query
     * @param semanticSimilarity - Similarity score from vector search (0-1)
     * @returns Candidate with all scores
     */
    scoreCandidate(chunk: Chunk, query: StructuredQuery, semanticSimilarity: number): Candidate;
    /**
     * Combine multiple scoring signals with weights
     *
     * @param semantic - Semantic similarity (0-1)
     * @param keyword - Keyword match score (0-1)
     * @param recency - Recency boost (0-1)
     * @param typePreference - Type preference (0-1)
     * @param weights - Optional custom weights
     * @returns Combined score (0-1)
     */
    combineScores(semantic: number, keyword: number, recency: number, typePreference: number, weights?: ScoringWeights): number;
    /**
     * Calculate keyword match score using simplified BM25
     *
     * @param content - Chunk content
     * @param query - Query string
     * @returns Keyword match score (0-1)
     */
    calculateKeywordMatch(content: string, query: string): number;
    /**
     * Calculate recency boost using exponential time decay
     *
     * @param dateString - ISO 8601 date string
     * @returns Recency boost score (0-1)
     */
    calculateRecencyBoost(dateString: string): number;
    /**
     * Calculate type preference based on query intent
     *
     * @param artifactType - Artifact type
     * @param intent - Query intent
     * @returns Type preference score (0-1)
     */
    calculateTypePreference(artifactType: string, intent: QueryIntent): number;
    /**
     * Normalize scores to [0, 1] range
     *
     * @param candidates - Array of candidates
     * @returns Candidates with normalized scores
     */
    normalizeScores(candidates: Candidate[]): Candidate[];
    /**
     * Rank candidates by combined score
     *
     * @param candidates - Array of candidates
     * @param topK - Number of top candidates to return
     * @returns Sorted and ranked candidates
     */
    rankCandidates(candidates: Candidate[], topK?: number): Candidate[];
    /**
     * Score and rank multiple candidates
     *
     * @param chunks - Array of chunks with semantic similarities
     * @param query - Structured query
     * @param similarities - Corresponding semantic similarity scores
     * @param topK - Number of top candidates to return
     * @returns Ranked candidates
     */
    scoreAndRank(chunks: Chunk[], query: StructuredQuery, similarities: number[], topK?: number): Candidate[];
    /**
     * Tokenize text into words
     *
     * @param text - Input text
     * @returns Array of tokens
     */
    private tokenize;
    /**
     * Calculate term frequencies
     *
     * @param tokens - Array of tokens
     * @returns Map of term frequencies
     */
    private calculateTermFrequencies;
    /**
     * Get default scoring weights
     *
     * @returns Default weights
     */
    getDefaultWeights(): ScoringWeights;
    /**
     * Set custom scoring weights
     *
     * Weights should sum to 1.0 for proper normalization
     *
     * @param weights - Custom weights
     * @returns Normalized weights
     */
    setWeights(weights: Partial<ScoringWeights>): ScoringWeights;
    /**
     * Calculate score breakdown for analysis
     *
     * @param candidate - Candidate to analyze
     * @param weights - Scoring weights
     * @returns Score breakdown
     */
    getScoreBreakdown(candidate: Candidate, weights?: ScoringWeights): {
        semantic_contribution: number;
        keyword_contribution: number;
        recency_contribution: number;
        type_contribution: number;
        total: number;
    };
    /**
     * Explain ranking for debugging
     *
     * @param candidate - Candidate to explain
     * @returns Human-readable explanation
     */
    explainRanking(candidate: Candidate): string;
    /**
     * Batch score candidates
     *
     * @param chunks - Array of chunks
     * @param query - Structured query
     * @param similarities - Semantic similarity scores
     * @returns Array of candidates
     */
    batchScore(chunks: Chunk[], query: StructuredQuery, similarities: number[]): Candidate[];
    /**
     * Re-rank candidates with custom weights
     *
     * @param candidates - Existing candidates
     * @param weights - New weights
     * @returns Re-ranked candidates
     */
    rerank(candidates: Candidate[], weights: ScoringWeights): Candidate[];
    /**
     * Calculate diversity-aware ranking
     *
     * Promotes diversity by penalizing similar chunks
     *
     * @param candidates - Ranked candidates
     * @param diversityWeight - Weight for diversity (0-1, default: 0.3)
     * @returns Diversity-ranked candidates
     */
    diversityRank(candidates: Candidate[], diversityWeight?: number): Candidate[];
}
declare const retrievalScorer: RetrievalScorer;
export default retrievalScorer;
//# sourceMappingURL=retrieval-scorer.service.d.ts.map