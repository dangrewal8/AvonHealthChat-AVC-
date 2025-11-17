/**
 * Result Diversification Service
 *
 * Implements diversity penalties per ChatGPT specification:
 * "Penalize nth chunk from same artifact by factor of 0.9^(n-1)"
 *
 * Ensures diverse results by penalizing multiple chunks from the same artifact.
 *
 * Penalty Formula:
 * - 1st chunk: 1.0 (no penalty)
 * - 2nd chunk: 0.9 (10% penalty)
 * - 3rd chunk: 0.81 (19% penalty)
 * - 4th chunk: 0.729 (27% penalty)
 * - 5th chunk: 0.656 (34% penalty)
 *
 * Minimum Diversity: Ensures at least 2 different sources in top-5 results
 *
 */
import { RetrievalCandidate } from './retriever-agent.service';
/**
 * Candidate with diversity penalty information
 */
export interface DiversifiedCandidate extends RetrievalCandidate {
    original_score: number;
    diversity_penalty: number;
    artifact_position: number;
}
/**
 * Diversity statistics
 */
export interface DiversityStats {
    total_candidates: number;
    unique_artifacts: number;
    avg_chunks_per_artifact: number;
    max_chunks_from_single_artifact: number;
    diversity_ratio: number;
}
/**
 * Result Diversifier Class
 *
 * Applies diversity penalties to ensure varied results
 */
declare class ResultDiversifier {
    /**
     * Penalty base per ChatGPT specification
     * Formula: 0.9^(n-1)
     */
    private readonly PENALTY_BASE;
    /**
     * Minimum sources required in top-K results
     */
    private readonly MIN_SOURCES_IN_TOP_K;
    /**
     * Default top-K for minimum diversity check
     */
    private readonly DEFAULT_TOP_K;
    /**
     * Diversify candidates by penalizing multiple chunks from same artifact
     *
     * @param candidates - Candidates to diversify
     * @returns Diversified candidates with penalties applied
     */
    diversify(candidates: RetrievalCandidate[]): DiversifiedCandidate[];
    /**
     * Calculate diversity penalty per ChatGPT specification
     *
     * Formula: 0.9^(n-1)
     *
     * @param position - Position within artifact (1-indexed)
     * @returns Penalty multiplier (0-1)
     */
    calculateDiversityPenalty(position: number): number;
    /**
     * Group candidates by artifact_id
     *
     * @param candidates - Candidates to group
     * @returns Map of artifact_id → candidates
     */
    groupByArtifact(candidates: RetrievalCandidate[]): Map<string, RetrievalCandidate[]>;
    /**
     * Ensure minimum diversity in top-K results per ChatGPT specification
     *
     * "Ensure at least 2 different sources in top-5 if available"
     *
     * @param results - Diversified results
     * @param topK - Number of top results to check (default: 5)
     * @param minSources - Minimum unique sources required (default: 2)
     * @returns Results with minimum diversity ensured
     */
    ensureMinimumDiversity(results: DiversifiedCandidate[], topK?: number, minSources?: number): DiversifiedCandidate[];
    /**
     * Calculate diversity statistics
     *
     * @param candidates - Candidates to analyze
     * @returns Diversity statistics
     */
    calculateDiversityStats(candidates: RetrievalCandidate[]): DiversityStats;
    /**
     * Compare diversity before and after
     *
     * @param original - Original candidates
     * @param diversified - Diversified candidates
     * @returns Comparison analysis
     */
    compareBeforeAfter(original: RetrievalCandidate[], diversified: DiversifiedCandidate[]): {
        rank_changes: Array<{
            chunk_id: string;
            artifact_id: string;
            original_rank: number;
            diversified_rank: number;
            rank_change: number;
            original_score: number;
            diversified_score: number;
            penalty: number;
        }>;
        stats: {
            improved: number;
            degraded: number;
            unchanged: number;
            avg_penalty: number;
        };
    };
    /**
     * Explain diversification for a candidate
     *
     * @param candidate - Diversified candidate
     * @returns Human-readable explanation
     */
    explainDiversification(candidate: DiversifiedCandidate): string;
    /**
     * Get penalty curve data points
     *
     * @param maxPosition - Maximum position (default: 10)
     * @returns Array of penalty curve points
     */
    getPenaltyCurve(maxPosition?: number): Array<{
        position: number;
        penalty: number;
        penalty_pct: number;
    }>;
    /**
     * Check if top-K has minimum diversity
     *
     * @param results - Results to check
     * @param topK - Top K to check (default: 5)
     * @param minSources - Minimum sources (default: 2)
     * @returns True if minimum diversity met
     */
    hasMinimumDiversity(results: DiversifiedCandidate[], topK?: number, minSources?: number): boolean;
    /**
     * Find most penalized candidates
     *
     * @param diversified - Diversified candidates
     * @param threshold - Minimum penalty percentage (default: 20)
     * @returns Candidates with penalty >= threshold
     */
    findMostPenalized(diversified: DiversifiedCandidate[], threshold?: number): DiversifiedCandidate[];
    /**
     * Batch diversification
     *
     * @param candidateLists - Array of candidate lists
     * @returns Array of diversified lists
     */
    batchDiversify(candidateLists: RetrievalCandidate[][]): DiversifiedCandidate[][];
    /**
     * Get penalty base constant
     *
     * @returns Penalty base (0.9 per spec)
     */
    getPenaltyBase(): number;
    /**
     * Interleave groups for maximum diversity
     * (Alternative diversification strategy)
     *
     * @param groups - Grouped candidates
     * @returns Interleaved candidates
     */
    interleaveGroups(groups: Map<string, RetrievalCandidate[]>): RetrievalCandidate[];
}
declare const resultDiversifier: ResultDiversifier;
export default resultDiversifier;
//# sourceMappingURL=result-diversifier.service.d.ts.map