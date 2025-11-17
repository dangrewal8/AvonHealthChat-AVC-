/**
 * Confidence Calibration Service
 *
 * Phase 9: Calculates multi-factor confidence scores and uncertainty quantification.
 * Provides confidence breakdown and recommendations based on confidence levels.
 *
 * Tech Stack: PostgreSQL (raw SQL), TypeScript strict mode
 * HIPAA Compliant: All processing local
 */

import { Pool } from 'pg';
import {
  ConfidenceScore,
  AggregateConfidence,
  UncertaintyLevel,
  ConfidenceMetricsRecord,
} from '../types/hallucination-prevention.types';
import { Extraction } from '../services/extraction-prompt-builder.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import { v4 as uuidv4 } from 'uuid';

class ConfidenceCalibrationService {
  private pool: Pool;

  // Confidence weights (must sum to 1.0)
  private readonly WEIGHTS = {
    retrieval: 0.30,      // Based on similarity score from FAISS
    source: 0.25,         // Based on artifact type quality
    extraction: 0.25,     // Based on LLM temperature/settings
    consistency: 0.20,    // Based on cross-query consistency
  };

  // Source type quality scores
  private readonly SOURCE_QUALITY: Record<string, number> = {
    note: 1.00,          // Clinical notes are highest quality
    document: 0.95,      // Documents are very reliable
    medication: 0.90,    // Medication records are reliable
    condition: 0.90,     // Condition records are reliable
    lab_observation: 0.85, // Lab results are reliable
    vital: 0.80,         // Vitals are reliable
    care_plan: 0.85,     // Care plans are reliable
    form_response: 0.75, // Form responses moderately reliable
    message: 0.70,       // Messages less reliable
    allergy: 0.90,       // Allergy records important
    appointment: 0.65,   // Appointments less critical for medical info
    default: 0.60,       // Default for unknown types
  };

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

    console.log('[Confidence Calibration] PostgreSQL pool initialized');
  }

  /**
   * Calculate confidence for a single extraction
   */
  async calculateConfidence(
    extraction: Extraction,
    candidate: RetrievalCandidate,
    consistencyScore?: number
  ): Promise<ConfidenceScore> {
    // 1. Retrieval confidence (from similarity score)
    const retrievalConfidence = candidate.score;

    // 2. Source confidence (from artifact type)
    const sourceConfidence = this.SOURCE_QUALITY[candidate.metadata.artifact_type] ||
                            this.SOURCE_QUALITY.default;

    // 3. Extraction confidence (from LLM settings)
    // Lower temperature = higher confidence
    const extractionConfidence = this.calculateExtractionConfidence(extraction);

    // 4. Consistency confidence (from cross-query check)
    const consistencyConfidence = consistencyScore ?? 0.80; // Default if not provided

    // 5. Calculate weighted aggregate
    const aggregateConfidence =
      (retrievalConfidence * this.WEIGHTS.retrieval) +
      (sourceConfidence * this.WEIGHTS.source) +
      (extractionConfidence * this.WEIGHTS.extraction) +
      (consistencyConfidence * this.WEIGHTS.consistency);

    return {
      retrieval_confidence: retrievalConfidence,
      source_confidence: sourceConfidence,
      extraction_confidence: extractionConfidence,
      consistency_confidence: consistencyConfidence,
      aggregate_confidence: aggregateConfidence,
    };
  }

  /**
   * Aggregate confidence across multiple extractions
   */
  async aggregateConfidence(
    extractions: Extraction[],
    candidates: RetrievalCandidate[],
    consistencyScore?: number
  ): Promise<AggregateConfidence> {
    console.log(`[Confidence Calibration] Aggregating confidence for ${extractions.length} extractions`);

    const confidenceScores: ConfidenceScore[] = [];
    const lowConfidenceReasons: string[] = [];

    for (let i = 0; i < extractions.length; i++) {
      const extraction = extractions[i];

      // Find matching candidate (by extraction provenance)
      const candidate = this.findMatchingCandidate(extraction, candidates);

      if (!candidate) {
        console.warn(`[Confidence Calibration] No matching candidate for extraction ${i}`);
        continue;
      }

      const score = await this.calculateConfidence(extraction, candidate, consistencyScore);
      confidenceScores.push(score);

      // Track low confidence reasons
      if (score.aggregate_confidence < 0.7) {
        lowConfidenceReasons.push(
          this.identifyLowConfidenceReason(score, extraction)
        );
      }
    }

    // Calculate overall confidence (average)
    const overallConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, s) => sum + s.aggregate_confidence, 0) / confidenceScores.length
      : 0.5;

    // Quantify uncertainty
    const uncertaintyLevel = this.quantifyUncertainty(overallConfidence);
    const uncertaintyExplanation = this.getUncertaintyExplanation(
      uncertaintyLevel,
      confidenceScores
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      overallConfidence,
      uncertaintyLevel
    );

    return {
      overall_confidence: overallConfidence,
      confidence_breakdown: confidenceScores,
      uncertainty_level: uncertaintyLevel,
      uncertainty_explanation: uncertaintyExplanation,
      recommendation,
      low_confidence_reasons: lowConfidenceReasons,
    };
  }

  /**
   * Calculate extraction confidence based on LLM settings
   */
  private calculateExtractionConfidence(extraction: Extraction): number {
    // Confidence is higher when:
    // - Extraction confidence score is high
    // - LLM temperature was low (deterministic)
    // - Extraction has provenance

    let confidence = 0.70; // Base confidence

    // Boost for having provenance
    if (extraction.provenance) {
      confidence += 0.15;
    }

    // Boost for high extraction confidence
    if (extraction.provenance.confidence && extraction.provenance.confidence >= 0.9) {
      confidence += 0.10;
    } else if (extraction.provenance.confidence && extraction.provenance.confidence >= 0.8) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find matching candidate for extraction
   */
  private findMatchingCandidate(
    extraction: Extraction,
    candidates: RetrievalCandidate[]
  ): RetrievalCandidate | null {
    if (!extraction.provenance) {
      // No provenance - use first candidate as fallback
      return candidates[0] || null;
    }

    // Find candidate matching provenance
    const match = candidates.find(c =>
      c.chunk.chunk_id === extraction.provenance.chunk_id ||
      c.chunk.artifact_id === extraction.provenance.artifact_id
    );

    return match || candidates[0] || null;
  }

  /**
   * Identify reason for low confidence
   */
  private identifyLowConfidenceReason(
    score: ConfidenceScore,
    extraction: Extraction
  ): string {
    const reasons: string[] = [];

    if (score.retrieval_confidence < 0.7) {
      reasons.push('Low retrieval similarity');
    }

    if (score.source_confidence < 0.7) {
      reasons.push('Low-quality source type');
    }

    if (score.extraction_confidence < 0.7) {
      reasons.push('Low extraction confidence');
    }

    if (score.consistency_confidence < 0.7) {
      reasons.push('Inconsistent with patient history');
    }

    const extractionValue = Object.values(extraction.content)[0] || 'unknown';
    return `${extraction.type} "${String(extractionValue)}": ${reasons.join(', ')}`;
  }

  /**
   * Quantify uncertainty level
   */
  private quantifyUncertainty(confidence: number): UncertaintyLevel {
    if (confidence >= 0.90) return 'very_low';
    if (confidence >= 0.80) return 'low';
    if (confidence >= 0.60) return 'medium';
    if (confidence >= 0.40) return 'high';
    return 'very_high';
  }

  /**
   * Get uncertainty explanation
   */
  private getUncertaintyExplanation(
    level: UncertaintyLevel,
    scores: ConfidenceScore[]
  ): string {
    const avgRetrieval = scores.reduce((s, c) => s + c.retrieval_confidence, 0) / scores.length;
    const avgSource = scores.reduce((s, c) => s + c.source_confidence, 0) / scores.length;
    const avgExtraction = scores.reduce((s, c) => s + c.extraction_confidence, 0) / scores.length;
    const avgConsistency = scores.reduce((s, c) => s + c.consistency_confidence, 0) / scores.length;

    switch (level) {
      case 'very_low':
        return 'Very high confidence based on strong source match, consistent history, and reliable extraction.';

      case 'low':
        return 'High confidence with minor uncertainty. Information is well-supported by sources.';

      case 'medium':
        return `Moderate confidence. Contributing factors: ` +
               `retrieval=${avgRetrieval.toFixed(2)}, ` +
               `source quality=${avgSource.toFixed(2)}, ` +
               `extraction=${avgExtraction.toFixed(2)}, ` +
               `consistency=${avgConsistency.toFixed(2)}`;

      case 'high':
        return 'Low confidence. Recommend verifying information against original source documents.';

      case 'very_high':
        return 'Very low confidence. This information should be verified by a healthcare provider.';
    }
  }

  /**
   * Generate recommendation based on confidence
   */
  private generateRecommendation(
    confidence: number,
    uncertaintyLevel: UncertaintyLevel
  ): string {
    if (confidence >= 0.90) {
      return 'High confidence - information is well-supported';
    }

    if (confidence >= 0.80) {
      return 'Good confidence - information appears reliable';
    }

    if (confidence >= 0.70) {
      return 'Acceptable confidence - consider verifying with source documents';
    }

    if (confidence >= 0.60) {
      return 'Moderate confidence - verify this information with source medical records';
    }

    if (confidence >= 0.40) {
      return 'Low confidence - consult original medical records for accuracy';
    }

    return 'Very low confidence - consult healthcare provider for verification';
  }

  /**
   * Store confidence metrics to database
   */
  async storeConfidenceMetrics(
    conversationId: string,
    aggregateConfidence: AggregateConfidence
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Store overall confidence
      const overallQuery = `
        INSERT INTO confidence_metrics (
          id,
          conversation_id,
          extraction_index,
          retrieval_confidence,
          source_confidence,
          extraction_confidence,
          consistency_confidence,
          aggregate_confidence,
          uncertainty_level,
          uncertainty_explanation,
          recommendation,
          low_confidence_reasons,
          calculated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      `;

      // Overall confidence (extraction_index = NULL)
      await client.query(overallQuery, [
        uuidv4(),
        conversationId,
        null,
        null,
        null,
        null,
        null,
        aggregateConfidence.overall_confidence,
        aggregateConfidence.uncertainty_level,
        aggregateConfidence.uncertainty_explanation,
        aggregateConfidence.recommendation,
        aggregateConfidence.low_confidence_reasons,
      ]);

      // Individual extraction confidences
      for (let i = 0; i < aggregateConfidence.confidence_breakdown.length; i++) {
        const score = aggregateConfidence.confidence_breakdown[i];

        await client.query(overallQuery, [
          uuidv4(),
          conversationId,
          i,
          score.retrieval_confidence,
          score.source_confidence,
          score.extraction_confidence,
          score.consistency_confidence,
          score.aggregate_confidence,
          this.quantifyUncertainty(score.aggregate_confidence),
          null,
          null,
          [],
        ]);
      }

      console.log(`[Confidence Calibration] Stored confidence metrics for conversation ${conversationId}`);
    } catch (error) {
      console.error('[Confidence Calibration] Error storing confidence metrics:', error);
      // Don't throw - confidence calculation failure shouldn't block the response
    } finally {
      client.release();
    }
  }

  /**
   * Get confidence metrics for a conversation
   */
  async getConfidenceMetrics(conversationId: string): Promise<ConfidenceMetricsRecord[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM confidence_metrics
        WHERE conversation_id = $1
        ORDER BY extraction_index ASC NULLS FIRST
      `;

      const result = await client.query(query, [conversationId]);

      return result.rows.map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        extraction_index: row.extraction_index,
        retrieval_confidence: row.retrieval_confidence ? parseFloat(row.retrieval_confidence) : null,
        source_confidence: row.source_confidence ? parseFloat(row.source_confidence) : null,
        extraction_confidence: row.extraction_confidence ? parseFloat(row.extraction_confidence) : null,
        consistency_confidence: row.consistency_confidence ? parseFloat(row.consistency_confidence) : null,
        aggregate_confidence: parseFloat(row.aggregate_confidence),
        uncertainty_level: row.uncertainty_level as UncertaintyLevel,
        uncertainty_explanation: row.uncertainty_explanation,
        recommendation: row.recommendation,
        low_confidence_reasons: row.low_confidence_reasons || [],
        calculated_at: new Date(row.calculated_at),
      }));
    } catch (error) {
      console.error('[Confidence Calibration] Error getting confidence metrics:', error);
      throw new Error(`Failed to get confidence metrics: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Confidence Calibration] PostgreSQL pool closed');
  }
}

// Export singleton instance
const confidenceCalibration = new ConfidenceCalibrationService();
export default confidenceCalibration;
