/**
 * Time Decay Scoring Service
 *
 * Implements exponential time decay per ChatGPT specification:
 * Formula: e^(-0.01 * days_ago)
 *
 * Recent documents get higher scores, older documents are penalized.
 *
 * Decay Curve:
 * - 0 days:   1.00 (no penalty)
 * - 7 days:   0.93 (7% penalty)
 * - 30 days:  0.74 (26% penalty)
 * - 90 days:  0.41 (59% penalty)
 * - 180 days: 0.17 (83% penalty)
 * - 365 days: 0.03 (97% penalty)
 *
 */
import { RetrievalCandidate } from './retriever-agent.service';
/**
 * Candidate with time decay information
 */
export interface TimeDecayCandidate extends RetrievalCandidate {
    original_score: number;
    time_decay_factor: number;
    days_ago: number;
}
/**
 * Time decay analysis for a specific date
 */
export interface DecayAnalysis {
    date: string;
    days_ago: number;
    decay_factor: number;
    penalty_percentage: number;
    score_example: {
        original: number;
        decayed: number;
    };
}
/**
 * Decay curve data point
 */
export interface DecayCurvePoint {
    days_ago: number;
    decay_factor: number;
    penalty_pct: number;
}
/**
 * Time Decay Scorer Class
 *
 * Applies exponential time decay to retrieval scores
 */
declare class TimeDecayScorer {
    /**
     * Decay rate constant per ChatGPT specification
     * Formula: e^(-DECAY_RATE * days_ago)
     */
    private readonly DECAY_RATE;
    /**
     * Apply time decay to candidates
     *
     * @param candidates - Candidates to score
     * @param referenceDate - Reference date (default: now)
     * @returns Candidates with time decay applied
     */
    applyTimeDecay(candidates: RetrievalCandidate[], referenceDate?: Date): TimeDecayCandidate[];
    /**
     * Calculate time decay factor
     *
     * Per ChatGPT specification: e^(-0.01 * days_ago)
     *
     * @param occurredAt - ISO date string when event occurred
     * @param referenceDate - Reference date (default: now)
     * @returns Decay factor (0-1)
     */
    calculateDecayFactor(occurredAt: string, referenceDate?: Date): number;
    /**
     * Calculate days ago from a date
     *
     * @param occurredAt - ISO date string
     * @param referenceDate - Reference date (default: now)
     * @returns Days ago (negative for future dates)
     */
    calculateDaysAgo(occurredAt: string, referenceDate?: Date): number;
    /**
     * Analyze time decay for a specific date
     *
     * @param occurredAt - Date to analyze
     * @param referenceDate - Reference date (default: now)
     * @returns Decay analysis
     */
    analyzeDecay(occurredAt: string, referenceDate?: Date): DecayAnalysis;
    /**
     * Generate decay curve data points
     *
     * @param maxDays - Maximum days to analyze (default: 365)
     * @param stepSize - Days between data points (default: 10)
     * @returns Array of decay curve points
     */
    getDecayCurve(maxDays?: number, stepSize?: number): DecayCurvePoint[];
    /**
     * Get standard decay milestones per specification
     *
     * @returns Key decay curve points
     */
    getDecayMilestones(): DecayCurvePoint[];
    /**
     * Compare candidates before and after time decay
     *
     * @param candidates - Original candidates
     * @param decayed - Candidates with time decay
     * @returns Comparison analysis
     */
    compareBeforeAfter(candidates: RetrievalCandidate[], decayed: TimeDecayCandidate[]): {
        rank_changes: Array<{
            chunk_id: string;
            original_rank: number;
            decayed_rank: number;
            rank_change: number;
            original_score: number;
            decayed_score: number;
            days_ago: number;
        }>;
        summary: {
            improved: number;
            degraded: number;
            unchanged: number;
            avg_decay_factor: number;
        };
    };
    /**
     * Explain time decay for a candidate
     *
     * @param candidate - Candidate with time decay
     * @returns Human-readable explanation
     */
    explainDecay(candidate: TimeDecayCandidate): string;
    /**
     * Generate decay curve visualization (ASCII)
     *
     * @param width - Chart width in characters (default: 60)
     * @returns ASCII visualization
     */
    visualizeDecayCurve(width?: number): string;
    /**
     * Get decay rate constant
     *
     * @returns Decay rate (0.01 per spec)
     */
    getDecayRate(): number;
    /**
     * Batch apply time decay to multiple candidate lists
     *
     * @param candidateLists - Array of candidate lists
     * @param referenceDate - Reference date (default: now)
     * @returns Array of decayed candidate lists
     */
    batchApplyTimeDecay(candidateLists: RetrievalCandidate[][], referenceDate?: Date): TimeDecayCandidate[][];
    /**
     * Find candidates most affected by time decay
     *
     * @param decayed - Candidates with time decay
     * @param threshold - Minimum penalty percentage (default: 50)
     * @returns Candidates with penalty >= threshold
     */
    findMostAffected(decayed: TimeDecayCandidate[], threshold?: number): TimeDecayCandidate[];
}
declare const timeDecayScorer: TimeDecayScorer;
export default timeDecayScorer;
//# sourceMappingURL=time-decay-scorer.service.d.ts.map