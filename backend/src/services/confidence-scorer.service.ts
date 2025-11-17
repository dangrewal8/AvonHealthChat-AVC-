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
  score: number; // 0-1
  label: 'high' | 'medium' | 'low'; // Confidence label
  components: {
    avg_retrieval_score: number; // Average retrieval score (0-1)
    extraction_quality: number; // Extraction quality (0-1)
    support_density: number; // Support density (0-1)
  };
  reason: string; // Explanation of confidence score
}

/**
 * Confidence Scorer Class
 *
 * Calculates confidence scores for generated answers
 */
class ConfidenceScorer {
  /**
   * CORRECT weights per ChatGPT specification
   */
  private readonly RETRIEVAL_WEIGHT = 0.6;
  private readonly EXTRACTION_WEIGHT = 0.3;
  private readonly SUPPORT_WEIGHT = 0.1;

  /**
   * Confidence thresholds
   */
  private readonly HIGH_THRESHOLD = 0.7;
  private readonly MEDIUM_THRESHOLD = 0.4;

  /**
   * Calculate confidence score
   *
   * CORRECT FORMULA: 0.6 * retrieval + 0.3 * extraction + 0.1 * support
   *
   * @param retrieval - Retrieval result with candidates
   * @param extractions - Structured extractions
   * @returns Confidence score with components
   */
  calculateConfidence(
    retrieval: RetrievalResult,
    extractions: Extraction[]
  ): ConfidenceScore {
    // Component 1: Average retrieval score (0-1)
    const avgRetrievalScore =
      retrieval.candidates.length > 0
        ? retrieval.candidates.reduce((sum, c) => sum + c.score, 0) /
          retrieval.candidates.length
        : 0;

    // Component 2: Extraction quality (0-1)
    const extractionQuality = this.assessExtractionQuality(extractions);

    // Component 3: Support density (0-1)
    const supportDensity = this.calculateSupportDensity(
      extractions,
      retrieval.candidates
    );

    // CORRECT FORMULA: 0.6 * retrieval + 0.3 * extraction + 0.1 * support
    const confidenceScore =
      this.RETRIEVAL_WEIGHT * avgRetrievalScore +
      this.EXTRACTION_WEIGHT * extractionQuality +
      this.SUPPORT_WEIGHT * supportDensity;

    return {
      score: confidenceScore,
      label: this.getConfidenceLabel(confidenceScore),
      components: {
        avg_retrieval_score: avgRetrievalScore,
        extraction_quality: extractionQuality,
        support_density: supportDensity,
      },
      reason: this.explainConfidence(
        confidenceScore,
        avgRetrievalScore,
        extractionQuality,
        supportDensity
      ),
    };
  }

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
  assessExtractionQuality(extractions: Extraction[]): number {
    if (extractions.length === 0) return 0;

    let qualitySum = 0;
    for (const extraction of extractions) {
      let quality = 0.5; // Base score

      // +0.3 if has valid provenance
      if (extraction.provenance) {
        quality += 0.3;
      }

      // +0.2 if has char_offsets
      if (extraction.provenance?.char_offsets) {
        quality += 0.2;
      }

      qualitySum += quality;
    }

    return qualitySum / extractions.length;
  }

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
  calculateSupportDensity(
    extractions: Extraction[],
    candidates: RetrievalCandidate[]
  ): number {
    if (extractions.length === 0) return 0;

    // How many unique sources support the extractions?
    const supportingSources = new Set<string>();
    extractions.forEach(extraction => {
      if (extraction.provenance?.artifact_id) {
        supportingSources.add(extraction.provenance.artifact_id);
      }
    });

    // Density = unique sources / total candidates
    return supportingSources.size / Math.max(candidates.length, 1);
  }

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
  getConfidenceLabel(score: number): 'high' | 'medium' | 'low' {
    if (score >= this.HIGH_THRESHOLD) return 'high';
    if (score >= this.MEDIUM_THRESHOLD) return 'medium';
    return 'low';
  }

  /**
   * Explain confidence score
   *
   * @param score - Overall confidence score
   * @param avgRetrievalScore - Average retrieval score
   * @param extractionQuality - Extraction quality
   * @param supportDensity - Support density
   * @returns Explanation string
   */
  explainConfidence(
    score: number,
    avgRetrievalScore: number,
    extractionQuality: number,
    supportDensity: number
  ): string {
    const label = this.getConfidenceLabel(score);

    let reason = `Confidence is ${label} (${score.toFixed(2)}) because: `;

    const reasons: string[] = [];

    // Retrieval score reasoning
    if (avgRetrievalScore >= 0.8) {
      reasons.push('retrieval scores are very high');
    } else if (avgRetrievalScore >= 0.6) {
      reasons.push('retrieval scores are good');
    } else if (avgRetrievalScore >= 0.4) {
      reasons.push('retrieval scores are moderate');
    } else {
      reasons.push('retrieval scores are low');
    }

    // Extraction quality reasoning
    if (extractionQuality >= 0.8) {
      reasons.push('extraction quality is excellent');
    } else if (extractionQuality >= 0.6) {
      reasons.push('extraction quality is good');
    } else if (extractionQuality >= 0.4) {
      reasons.push('extraction quality is fair');
    } else {
      reasons.push('extraction quality is poor');
    }

    // Support density reasoning
    if (supportDensity >= 0.7) {
      reasons.push('multiple sources confirm findings');
    } else if (supportDensity >= 0.4) {
      reasons.push('some sources confirm findings');
    } else {
      reasons.push('limited source confirmation');
    }

    reason += reasons.join(', ') + '.';

    return reason;
  }

  /**
   * Get detailed breakdown of confidence calculation
   *
   * @param retrieval - Retrieval result
   * @param extractions - Structured extractions
   * @returns Detailed breakdown string
   */
  getConfidenceBreakdown(
    retrieval: RetrievalResult,
    extractions: Extraction[]
  ): string {
    const confidence = this.calculateConfidence(retrieval, extractions);

    let breakdown = '';
    breakdown += 'Confidence Score Breakdown:\n';
    breakdown += '═'.repeat(60) + '\n\n';

    breakdown += `Overall Score: ${confidence.score.toFixed(3)} (${confidence.label})\n\n`;

    breakdown += 'Components:\n';
    breakdown += '─'.repeat(60) + '\n';
    breakdown += `  Retrieval Score:     ${confidence.components.avg_retrieval_score.toFixed(3)} × ${this.RETRIEVAL_WEIGHT} = ${(confidence.components.avg_retrieval_score * this.RETRIEVAL_WEIGHT).toFixed(3)}\n`;
    breakdown += `  Extraction Quality:  ${confidence.components.extraction_quality.toFixed(3)} × ${this.EXTRACTION_WEIGHT} = ${(confidence.components.extraction_quality * this.EXTRACTION_WEIGHT).toFixed(3)}\n`;
    breakdown += `  Support Density:     ${confidence.components.support_density.toFixed(3)} × ${this.SUPPORT_WEIGHT} = ${(confidence.components.support_density * this.SUPPORT_WEIGHT).toFixed(3)}\n`;
    breakdown += '─'.repeat(60) + '\n';
    breakdown += `  Total:               ${confidence.score.toFixed(3)}\n\n`;

    breakdown += `Explanation: ${confidence.reason}\n`;

    return breakdown;
  }

  /**
   * Check if confidence is acceptable
   *
   * @param score - Confidence score
   * @returns True if confidence is acceptable (>= medium threshold)
   */
  isAcceptable(score: ConfidenceScore): boolean {
    return score.score >= this.MEDIUM_THRESHOLD;
  }

  /**
   * Get recommendation based on confidence
   *
   * @param score - Confidence score
   * @returns Recommendation string
   */
  getRecommendation(score: ConfidenceScore): string {
    if (score.label === 'high') {
      return 'Answer can be used with high confidence. All components are strong.';
    }

    if (score.label === 'medium') {
      const weakest = this.identifyWeakestComponent(score.components);
      return `Answer is acceptable but consider improving ${weakest} for better confidence.`;
    }

    // Low confidence
    const weakest = this.identifyWeakestComponent(score.components);
    return `Low confidence. Consider: (1) retrieving more candidates, (2) improving query, or (3) checking if data exists. Weakest component: ${weakest}.`;
  }

  /**
   * Identify weakest component
   *
   * @param components - Confidence components
   * @returns Name of weakest component
   */
  private identifyWeakestComponent(components: {
    avg_retrieval_score: number;
    extraction_quality: number;
    support_density: number;
  }): string {
    const scores = [
      { name: 'retrieval score', value: components.avg_retrieval_score },
      { name: 'extraction quality', value: components.extraction_quality },
      { name: 'support density', value: components.support_density },
    ];

    scores.sort((a, b) => a.value - b.value);
    return scores[0].name;
  }

  /**
   * Explain formula
   *
   * @returns Formula explanation
   */
  explainFormula(): string {
    return `Confidence Score Formula (CORRECT per ChatGPT spec):

Confidence = ${this.RETRIEVAL_WEIGHT} × avg_retrieval_score + ${this.EXTRACTION_WEIGHT} × extraction_quality + ${this.SUPPORT_WEIGHT} × support_density

Components:
1. Average Retrieval Score (weight: ${this.RETRIEVAL_WEIGHT})
   - Average of all candidate retrieval scores
   - Measures how well candidates match the query

2. Extraction Quality (weight: ${this.EXTRACTION_WEIGHT})
   - Base: 0.5
   - +0.3 if has valid provenance
   - +0.2 if has char_offsets
   - Average across all extractions

3. Support Density (weight: ${this.SUPPORT_WEIGHT})
   - Unique supporting sources / total candidates
   - Measures how many sources confirm findings

Thresholds:
- High:   >= ${this.HIGH_THRESHOLD}
- Medium: >= ${this.MEDIUM_THRESHOLD}
- Low:    < ${this.MEDIUM_THRESHOLD}`;
  }

  /**
   * Get weights used in formula
   *
   * @returns Weights object
   */
  getWeights(): {
    retrieval: number;
    extraction: number;
    support: number;
  } {
    return {
      retrieval: this.RETRIEVAL_WEIGHT,
      extraction: this.EXTRACTION_WEIGHT,
      support: this.SUPPORT_WEIGHT,
    };
  }

  /**
   * Get thresholds used for labeling
   *
   * @returns Thresholds object
   */
  getThresholds(): {
    high: number;
    medium: number;
  } {
    return {
      high: this.HIGH_THRESHOLD,
      medium: this.MEDIUM_THRESHOLD,
    };
  }
}

// Export singleton instance
const confidenceScorer = new ConfidenceScorer();
export default confidenceScorer;
