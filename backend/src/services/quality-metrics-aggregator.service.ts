/**
 * Quality Metrics Aggregator Service
 *
 * Phase 9: Aggregates all quality metrics into comprehensive reports and trends.
 * Provides dashboard data and quality monitoring.
 *
 * Tech Stack: PostgreSQL (raw SQL), TypeScript strict mode
 * HIPAA Compliant: All processing local
 */

import { Pool } from 'pg';
import {
  QualityMetrics,
  QualityGrade,
  QualityReport,
  QualityTrends,
  TimeRange,
} from '../types/hallucination-prevention.types';
import conversationHistoryService from './conversation-history.service';
import answerGroundingVerifier from './answer-grounding-verifier.service';
import crossQueryConsistency from './cross-query-consistency.service';
import confidenceCalibration from './confidence-calibration.service';
import hallucinationDetector from './hallucination-detector.service';

class QualityMetricsAggregatorService {
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

    console.log('[Quality Metrics Aggregator] PostgreSQL pool initialized');
  }

  /**
   * Aggregate all quality metrics for a conversation
   */
  async aggregateMetrics(conversationId: string): Promise<QualityMetrics> {
    console.log(`[Quality Metrics Aggregator] Aggregating metrics for conversation ${conversationId}`);

    // Get conversation to extract quality scores
    const conversation = await conversationHistoryService.getConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const groundingScore = conversation.grounding_score ?? 0.5;
    const consistencyScore = conversation.consistency_score ?? 0.8;
    const confidenceScore = conversation.confidence_score ?? 0.7;
    const hallucinationRisk = conversation.hallucination_risk ?? 0.2;

    // Calculate overall quality score (weighted combination)
    const overallQualityScore = this.calculateOverallQuality(
      groundingScore,
      consistencyScore,
      confidenceScore,
      hallucinationRisk
    );

    const qualityGrade = this.categorizeQualityGrade(overallQualityScore);

    return {
      conversation_id: conversationId,
      grounding_score: groundingScore,
      consistency_score: consistencyScore,
      confidence_score: confidenceScore,
      hallucination_risk: hallucinationRisk,
      overall_quality_score: overallQualityScore,
      quality_grade: qualityGrade,
    };
  }

  /**
   * Generate comprehensive quality report
   */
  async generateQualityReport(conversationId: string): Promise<QualityReport> {
    console.log(`[Quality Metrics Aggregator] Generating quality report for ${conversationId}`);

    // Get conversation
    const conversation = await conversationHistoryService.getConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Get all quality metrics
    const qualityMetrics = await this.aggregateMetrics(conversationId);

    // Get detailed results
    const groundingResults = await answerGroundingVerifier.getGroundingResults(conversationId);
    const confidenceResults = await confidenceCalibration.getConfidenceMetrics(conversationId);
    const hallucinationResults = await hallucinationDetector.getHallucinationDetections(conversationId);

    // Build grounding result summary
    const groundingResult = {
      conversation_id: conversationId,
      overall_grounded: groundingResults.every(g => g.is_grounded),
      grounding_score: qualityMetrics.grounding_score,
      statements: groundingResults.map(g => ({
        statement: g.statement,
        statement_index: g.statement_index,
        is_grounded: g.is_grounded,
        source_chunk_id: g.source_chunk_id ?? undefined,
        source_artifact_id: g.source_artifact_id ?? undefined,
        source_text: g.source_text ?? undefined,
        supporting_evidence: g.supporting_evidence ?? undefined,
        grounding_confidence: g.grounding_confidence,
        verification_method: g.verification_method,
        similarity_score: g.similarity_score ?? undefined,
      })),
      unsupported_statements: groundingResults.filter(g => !g.is_grounded).map(g => g.statement),
      warnings: this.buildGroundingWarnings(groundingResults),
      verified_at: new Date(),
    };

    // Build consistency result (simplified)
    const consistencyResult = {
      conversation_id: conversationId,
      patient_id: conversation.patient_id,
      is_consistent: qualityMetrics.consistency_score >= 0.8,
      consistency_score: qualityMetrics.consistency_score,
      contradictions: [], // Would need to query consistency_checks table
      warnings: qualityMetrics.consistency_score < 0.8
        ? ['Consistency score below threshold']
        : [],
      checked_at: new Date(),
    };

    // Build confidence metrics summary
    const overallConfidence = confidenceResults.find(c => c.extraction_index === null);
    const confidenceMetrics = {
      overall_confidence: overallConfidence?.aggregate_confidence ?? qualityMetrics.confidence_score,
      confidence_breakdown: confidenceResults
        .filter(c => c.extraction_index !== null)
        .map(c => ({
          retrieval_confidence: c.retrieval_confidence ?? 0,
          source_confidence: c.source_confidence ?? 0,
          extraction_confidence: c.extraction_confidence ?? 0,
          consistency_confidence: c.consistency_confidence ?? 0,
          aggregate_confidence: c.aggregate_confidence,
        })),
      uncertainty_level: overallConfidence?.uncertainty_level ?? 'medium',
      uncertainty_explanation: overallConfidence?.uncertainty_explanation ?? 'No detailed explanation available',
      recommendation: overallConfidence?.recommendation ?? 'Verify with source documents',
      low_confidence_reasons: overallConfidence?.low_confidence_reasons ?? [],
    };

    // Build hallucination risk summary
    const latestHallucination = hallucinationResults[0]; // Most recent
    const hallucinationRisk = {
      conversation_id: conversationId,
      detection_method: latestHallucination?.detection_method ?? 'factual_inconsistency',
      hallucination_detected: qualityMetrics.hallucination_risk > 0.3,
      risk_level: latestHallucination?.risk_level ?? this.riskScoreToLevel(qualityMetrics.hallucination_risk),
      risk_score: qualityMetrics.hallucination_risk,
      contributing_factors: latestHallucination?.contributing_factors ?? [],
      inconsistent_statements: latestHallucination?.inconsistent_statements,
      recommendation: latestHallucination?.recommendation ?? 'No specific recommendation',
      detected_at: new Date(),
    };

    // Determine if passed quality checks
    const passedQualityChecks =
      qualityMetrics.grounding_score >= 0.7 &&
      qualityMetrics.consistency_score >= 0.8 &&
      qualityMetrics.confidence_score >= 0.6 &&
      qualityMetrics.hallucination_risk < 0.3;

    // Collect all warnings and recommendations
    const warnings = [
      ...groundingResult.warnings,
      ...consistencyResult.warnings,
      ...(qualityMetrics.confidence_score < 0.6 ? ['Low confidence score'] : []),
      ...(qualityMetrics.hallucination_risk > 0.3 ? ['High hallucination risk'] : []),
    ];

    const recommendations = [
      confidenceMetrics.recommendation,
      hallucinationRisk.recommendation,
    ].filter(r => r !== 'No specific recommendation');

    return {
      conversation_id: conversationId,
      patient_id: conversation.patient_id,
      query: conversation.query,
      query_timestamp: conversation.query_timestamp,
      quality_metrics: qualityMetrics,
      grounding_result: groundingResult,
      consistency_result: consistencyResult,
      confidence_metrics: confidenceMetrics,
      hallucination_risk: hallucinationRisk,
      passed_quality_checks: passedQualityChecks,
      warnings,
      recommendations,
      generated_at: new Date(),
    };
  }

  /**
   * Get quality trends for a patient
   */
  async getQualityTrends(
    patientId: string,
    timeRange: TimeRange
  ): Promise<QualityTrends | null> {
    return conversationHistoryService.getQualityTrends(patientId, timeRange);
  }

  /**
   * Get system-wide quality trends
   */
  async getSystemQualityTrends(timeRange: TimeRange): Promise<QualityTrends | null> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT
          $1 as time_period,
          $2::timestamp as period_start,
          $3::timestamp as period_end,
          COUNT(*) as total_queries,
          AVG(grounding_score) as avg_grounding_score,
          AVG(consistency_score) as avg_consistency_score,
          AVG(confidence_score) as avg_confidence_score,
          AVG(hallucination_risk) as avg_hallucination_risk,
          AVG(overall_quality_score) as avg_overall_quality,
          COUNT(*) FILTER (WHERE grounding_score < 0.7) as low_grounding_count,
          COUNT(*) FILTER (WHERE consistency_score < 0.8) as inconsistent_count,
          COUNT(*) FILTER (WHERE confidence_score < 0.6) as low_confidence_count,
          COUNT(*) FILTER (WHERE hallucination_risk > 0.3) as high_hallucination_count,
          AVG(execution_time_ms) as avg_execution_time_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time_ms
        FROM conversation_history
        WHERE query_timestamp >= $2
          AND query_timestamp <= $3
      `;

      const values = [
        timeRange.period,
        timeRange.start,
        timeRange.end,
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0 || result.rows[0].total_queries === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        patient_id: null,
        time_period: timeRange.period,
        period_start: timeRange.start,
        period_end: timeRange.end,
        total_queries: parseInt(row.total_queries),
        avg_grounding_score: parseFloat(row.avg_grounding_score) || 0,
        avg_consistency_score: parseFloat(row.avg_consistency_score) || 0,
        avg_confidence_score: parseFloat(row.avg_confidence_score) || 0,
        avg_hallucination_risk: parseFloat(row.avg_hallucination_risk) || 0,
        avg_overall_quality: parseFloat(row.avg_overall_quality) || 0,
        low_grounding_count: parseInt(row.low_grounding_count) || 0,
        inconsistent_count: parseInt(row.inconsistent_count) || 0,
        low_confidence_count: parseInt(row.low_confidence_count) || 0,
        high_hallucination_count: parseInt(row.high_hallucination_count) || 0,
        avg_execution_time_ms: parseInt(row.avg_execution_time_ms) || 0,
        p95_execution_time_ms: parseInt(row.p95_execution_time_ms) || 0,
      };
    } catch (error) {
      console.error('[Quality Metrics Aggregator] Error getting system quality trends:', error);
      throw new Error(`Failed to get system quality trends: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQuality(
    groundingScore: number,
    consistencyScore: number,
    confidenceScore: number,
    hallucinationRisk: number
  ): number {
    // Weighted combination:
    // - 35% grounding (most important)
    // - 25% consistency
    // - 25% confidence
    // - 15% hallucination risk (inverted)

    const score =
      groundingScore * 0.35 +
      consistencyScore * 0.25 +
      confidenceScore * 0.25 +
      (1 - hallucinationRisk) * 0.15;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Categorize quality grade
   */
  private categorizeQualityGrade(score: number): QualityGrade {
    if (score >= 0.90) return 'excellent';
    if (score >= 0.80) return 'good';
    if (score >= 0.70) return 'acceptable';
    if (score >= 0.50) return 'poor';
    return 'unacceptable';
  }

  /**
   * Convert risk score to risk level
   */
  private riskScoreToLevel(score: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (score < 0.1) return 'very_low';
    if (score < 0.2) return 'low';
    if (score < 0.4) return 'medium';
    if (score < 0.7) return 'high';
    return 'very_high';
  }

  /**
   * Build grounding warnings
   */
  private buildGroundingWarnings(groundingResults: any[]): string[] {
    const warnings: string[] = [];

    const unsupported = groundingResults.filter(g => !g.is_grounded).length;
    if (unsupported > 0) {
      warnings.push(`${unsupported} unsupported statement(s)`);
    }

    const lowConfidence = groundingResults.filter(
      g => g.is_grounded && g.grounding_confidence < 0.7
    ).length;
    if (lowConfidence > 0) {
      warnings.push(`${lowConfidence} statement(s) with low grounding confidence`);
    }

    return warnings;
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Quality Metrics Aggregator] PostgreSQL pool closed');
  }
}

// Export singleton instance
const qualityMetricsAggregator = new QualityMetricsAggregatorService();
export default qualityMetricsAggregator;
