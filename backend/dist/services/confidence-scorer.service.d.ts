/**
 * Confidence Scorer Service
 *
 * Calculates confidence scores for generated answers using the CORRECT formula:
 * Confidence = 0.6 * avg_retrieval_score + 0.3 * extraction_quality + 0.1 * support_density
 *
 * ⚠️ NOTE: This uses the CORRECT weights (0.6/0.3/0.1) per ChatGPT specification
 *
 * Features:
 * - Average retrieval score calculation
 * - Extraction quality assessment
 * - Support density calculation
 * - Confidence labeling (high/medium/low)
 * - Confidence explanation
 *
 */
import { RetrievalResult, RetrievalCandidate } from './retriever-agent.service';
import { Extraction } from './extraction-prompt-builder.service';
/**
 * Confidence score with components and explanation
 */
export interface ConfidenceScore {
    score: number;
    label: 'high' | 'medium' | 'low';
    components: {
        avg_retrieval_score: number;
        extraction_quality: number;
        support_density: number;
    };
    reason: string;
}
/**
 * Confidence Scorer Class
 *
 * Calculates confidence scores for generated answers
 */
declare class ConfidenceScorer {
    /**
     * CORRECT weights per ChatGPT specification
     */
    private readonly RETRIEVAL_WEIGHT;
    private readonly EXTRACTION_WEIGHT;
    private readonly SUPPORT_WEIGHT;
    /**
     * Confidence thresholds
     */
    private readonly HIGH_THRESHOLD;
    private readonly MEDIUM_THRESHOLD;
    /**
     * Calculate confidence score
     *
     * CORRECT FORMULA: 0.6 * retrieval + 0.3 * extraction + 0.1 * support
     *
     * @param retrieval - Retrieval result with candidates
     * @param extractions - Structured extractions
     * @returns Confidence score with components
     */
    calculateConfidence(retrieval: RetrievalResult, extractions: Extraction[]): ConfidenceScore;
    /**
     * Assess extraction quality
     *
     * Scoring:
     * - Base score: 0.5
     * - +0.3 if has valid provenance
     * - +0.2 if has char_offsets
     *
     * @param extractions - Structured extractions
     * @returns Quality score (0-1)
     */
    assessExtractionQuality(extractions: Extraction[]): number;
    /**
     * Calculate support density
     *
     * How many unique sources support the extractions?
     * Density = unique sources / total candidates
     *
     * @param extractions - Structured extractions
     * @param candidates - Retrieved candidates
     * @returns Support density (0-1)
     */
    calculateSupportDensity(extractions: Extraction[], candidates: RetrievalCandidate[]): number;
    /**
     * Get confidence label from score
     *
     * Labels:
     * - high: >= 0.7
     * - medium: >= 0.4
     * - low: < 0.4
     *
     * @param score - Confidence score (0-1)
     * @returns Confidence label
     */
    getConfidenceLabel(score: number): 'high' | 'medium' | 'low';
    /**
     * Explain confidence score
     *
     * @param score - Overall confidence score
     * @param avgRetrievalScore - Average retrieval score
     * @param extractionQuality - Extraction quality
     * @param supportDensity - Support density
     * @returns Explanation string
     */
    explainConfidence(score: number, avgRetrievalScore: number, extractionQuality: number, supportDensity: number): string;
    /**
     * Get detailed breakdown of confidence calculation
     *
     * @param retrieval - Retrieval result
     * @param extractions - Structured extractions
     * @returns Detailed breakdown string
     */
    getConfidenceBreakdown(retrieval: RetrievalResult, extractions: Extraction[]): string;
    /**
     * Check if confidence is acceptable
     *
     * @param score - Confidence score
     * @returns True if confidence is acceptable (>= medium threshold)
     */
    isAcceptable(score: ConfidenceScore): boolean;
    /**
     * Get recommendation based on confidence
     *
     * @param score - Confidence score
     * @returns Recommendation string
     */
    getRecommendation(score: ConfidenceScore): string;
    /**
     * Identify weakest component
     *
     * @param components - Confidence components
     * @returns Name of weakest component
     */
    private identifyWeakestComponent;
    /**
     * Explain formula
     *
     * @returns Formula explanation
     */
    explainFormula(): string;
    /**
     * Get weights used in formula
     *
     * @returns Weights object
     */
    getWeights(): {
        retrieval: number;
        extraction: number;
        support: number;
    };
    /**
     * Get thresholds used for labeling
     *
     * @returns Thresholds object
     */
    getThresholds(): {
        high: number;
        medium: number;
    };
}
declare const confidenceScorer: ConfidenceScorer;
export default confidenceScorer;
//# sourceMappingURL=confidence-scorer.service.d.ts.map