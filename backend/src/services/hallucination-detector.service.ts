/**
 * Hallucination Detector Service
 *
 * Phase 9: Detects hallucinations using multi-response variance (SelfCheckGPT approach).
 * Generates multiple responses and checks for consistency.
 *
 * Tech Stack: Ollama (local LLM), PostgreSQL, TypeScript strict mode
 * HIPAA Compliant: All processing local, no external APIs
 */

import { Pool } from 'pg';
import {
  HallucinationRisk,
  MultiResponseDetection,
  DetectionMethod,
  RiskLevel,
  HallucinationDetectionRecord,
} from '../types/hallucination-prevention.types';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import llmService from '../services/llm-factory.service';
import embeddingService from '../services/embedding-factory.service';
import { v4 as uuidv4 } from 'uuid';

class HallucinationDetectorService {
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

    console.log('[Hallucination Detector] PostgreSQL pool initialized');
  }

  /**
   * Assess hallucination risk based on quality scores
   */
  async assessHallucinationRisk(
    conversationId: string,
    groundingScore: number,
    consistencyScore: number,
    confidenceScore: number
  ): Promise<HallucinationRisk> {
    console.log(`[Hallucination Detector] Assessing risk for conversation ${conversationId}`);

    const contributingFactors: string[] = [];

    // Factor 1: Low grounding score
    if (groundingScore < 0.7) {
      contributingFactors.push(
        `Low grounding score (${groundingScore.toFixed(2)}) - statements not well-supported by sources`
      );
    }

    // Factor 2: Low consistency score
    if (consistencyScore < 0.8) {
      contributingFactors.push(
        `Low consistency score (${consistencyScore.toFixed(2)}) - contradicts previous conversations`
      );
    }

    // Factor 3: Low confidence score
    if (confidenceScore < 0.6) {
      contributingFactors.push(
        `Low confidence score (${confidenceScore.toFixed(2)}) - weak retrieval or source quality`
      );
    }

    // Calculate risk score (weighted combination)
    const riskScore = this.calculateRiskScore(
      groundingScore,
      consistencyScore,
      confidenceScore
    );

    const riskLevel = this.categorizeRiskLevel(riskScore);
    const hallucinationDetected = riskScore > 0.3; // Threshold

    const recommendation = this.generateRecommendation(
      riskLevel,
      contributingFactors
    );

    const risk: HallucinationRisk = {
      conversation_id: conversationId,
      detection_method: 'factual_inconsistency',
      hallucination_detected: hallucinationDetected,
      risk_level: riskLevel,
      risk_score: riskScore,
      contributing_factors: contributingFactors,
      recommendation,
      detected_at: new Date(),
    };

    // Store to database
    await this.storeHallucinationDetection(risk);

    console.log(
      `[Hallucination Detector] Risk assessment complete: ` +
      `${riskLevel} (score: ${riskScore.toFixed(2)})`
    );

    return risk;
  }

  /**
   * Detect hallucinations via multi-response variance (SelfCheckGPT)
   * EXPENSIVE - only use when hallucination detection is enabled
   */
  async detectViaMultiResponse(
    conversationId: string,
    query: string,
    candidates: RetrievalCandidate[],
    numSamples: number = 3
  ): Promise<MultiResponseDetection> {
    console.log(`[Hallucination Detector] Running multi-response detection with ${numSamples} samples`);

    const responses: string[] = [];
    const tempRange = parseFloat(process.env.HALLUCINATION_DETECTION_TEMP_RANGE || '0.1');

    // Build prompt from candidates
    const prompt = this.buildPromptFromCandidates(query, candidates);

    // Generate multiple responses with varying temperatures
    for (let i = 0; i < numSamples; i++) {
      const temperature = i * tempRange; // 0.0, 0.1, 0.2, etc.

      try {
        const response = await llmService.generate(prompt, {
          temperature,
          maxTokens: 200,
        });

        responses.push(response);
      } catch (error) {
        console.error(`[Hallucination Detector] Error generating response ${i}:`, error);
      }
    }

    if (responses.length < 2) {
      console.warn('[Hallucination Detector] Not enough responses for variance detection');
      return {
        sample_responses: responses,
        num_samples: responses.length,
        variance_score: 0.0,
        semantic_consistency: 1.0,
        hallucination_detected: false,
      };
    }

    // Calculate semantic consistency between responses
    const semanticConsistency = await this.calculateSemanticConsistency(responses);

    // Variance score = 1 - consistency
    const varianceScore = 1.0 - semanticConsistency;

    // High variance indicates potential hallucination
    const hallucinationDetected = varianceScore > 0.4;

    const result: MultiResponseDetection = {
      sample_responses: responses,
      num_samples: responses.length,
      variance_score: varianceScore,
      semantic_consistency: semanticConsistency,
      hallucination_detected: hallucinationDetected,
    };

    // Store detailed detection
    await this.storeMultiResponseDetection(conversationId, result);

    console.log(
      `[Hallucination Detector] Multi-response detection: ` +
      `variance=${varianceScore.toFixed(2)}, ` +
      `hallucination=${hallucinationDetected}`
    );

    return result;
  }

  /**
   * Calculate risk score from quality metrics
   */
  private calculateRiskScore(
    groundingScore: number,
    consistencyScore: number,
    confidenceScore: number
  ): number {
    // Risk is inverse of quality
    // Weight: 40% grounding, 30% consistency, 30% confidence

    const groundingRisk = (1 - groundingScore) * 0.40;
    const consistencyRisk = (1 - consistencyScore) * 0.30;
    const confidenceRisk = (1 - confidenceScore) * 0.30;

    return groundingRisk + consistencyRisk + confidenceRisk;
  }

  /**
   * Categorize risk level
   */
  private categorizeRiskLevel(riskScore: number): RiskLevel {
    if (riskScore < 0.1) return 'very_low';
    if (riskScore < 0.2) return 'low';
    if (riskScore < 0.4) return 'medium';
    if (riskScore < 0.7) return 'high';
    return 'very_high';
  }

  /**
   * Generate recommendation based on risk
   */
  private generateRecommendation(
    riskLevel: RiskLevel,
    contributingFactors: string[]
  ): string {
    switch (riskLevel) {
      case 'very_low':
        return 'Very low hallucination risk - information is well-grounded and consistent';

      case 'low':
        return 'Low hallucination risk - information appears reliable';

      case 'medium':
        return `Moderate hallucination risk. Factors: ${contributingFactors.length} issues detected. ` +
               `Verify information against source documents.`;

      case 'high':
        return `High hallucination risk. Multiple quality concerns detected. ` +
               `Consult original medical records for verification.`;

      case 'very_high':
        return `CRITICAL: Very high hallucination risk. This response should not be trusted. ` +
               `Consult healthcare provider and original medical records.`;
    }
  }

  /**
   * Build prompt from candidates
   */
  private buildPromptFromCandidates(
    query: string,
    candidates: RetrievalCandidate[]
  ): string {
    const context = candidates
      .slice(0, 5) // Top 5 candidates
      .map((c, i) => `[${i + 1}] ${c.chunk.content}`)
      .join('\n\n');

    return `Based on the following information, answer the question concisely.

Context:
${context}

Question: ${query}

Answer:`;
  }

  /**
   * Calculate semantic consistency between responses
   */
  private async calculateSemanticConsistency(responses: string[]): Promise<number> {
    try {
      // Generate embeddings for all responses
      const embeddings = await Promise.all(
        responses.map(r => embeddingService.generateEmbedding(r))
      );

      // Calculate pairwise cosine similarities
      const similarities: number[] = [];

      for (let i = 0; i < embeddings.length; i++) {
        for (let j = i + 1; j < embeddings.length; j++) {
          const sim = this.cosineSimilarity(embeddings[i], embeddings[j]);
          similarities.push(sim);
        }
      }

      // Return average similarity
      const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;

      return avgSimilarity;
    } catch (error) {
      console.error('[Hallucination Detector] Error calculating semantic consistency:', error);
      return 1.0; // Assume consistent if calculation fails
    }
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Store hallucination detection to database
   */
  private async storeHallucinationDetection(risk: HallucinationRisk): Promise<void> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO hallucination_detections (
          id,
          conversation_id,
          detection_method,
          sample_responses,
          num_samples,
          variance_score,
          hallucination_detected,
          risk_level,
          risk_score,
          contributing_factors,
          inconsistent_statements,
          recommendation,
          detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      `;

      const values = [
        uuidv4(),
        risk.conversation_id,
        risk.detection_method,
        null, // No sample responses for risk assessment method
        null,
        null,
        risk.hallucination_detected,
        risk.risk_level,
        risk.risk_score,
        risk.contributing_factors,
        risk.inconsistent_statements || [],
        risk.recommendation,
      ];

      await client.query(query, values);

      console.log(`[Hallucination Detector] Stored detection record for conversation ${risk.conversation_id}`);
    } catch (error) {
      console.error('[Hallucination Detector] Error storing hallucination detection:', error);
      // Don't throw - detection failure shouldn't block the response
    } finally {
      client.release();
    }
  }

  /**
   * Store multi-response detection to database
   */
  private async storeMultiResponseDetection(
    conversationId: string,
    detection: MultiResponseDetection
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      const riskScore = detection.variance_score;
      const riskLevel = this.categorizeRiskLevel(riskScore);

      const query = `
        INSERT INTO hallucination_detections (
          id,
          conversation_id,
          detection_method,
          sample_responses,
          num_samples,
          variance_score,
          hallucination_detected,
          risk_level,
          risk_score,
          contributing_factors,
          inconsistent_statements,
          recommendation,
          detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      `;

      const values = [
        uuidv4(),
        conversationId,
        'multi_response',
        JSON.stringify(detection.sample_responses),
        detection.num_samples,
        detection.variance_score,
        detection.hallucination_detected,
        riskLevel,
        riskScore,
        detection.hallucination_detected
          ? ['High variance detected across multiple response samples']
          : [],
        [],
        this.generateRecommendation(riskLevel, []),
      ];

      await client.query(query, values);

      console.log(`[Hallucination Detector] Stored multi-response detection for conversation ${conversationId}`);
    } catch (error) {
      console.error('[Hallucination Detector] Error storing multi-response detection:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Get hallucination detection records
   */
  async getHallucinationDetections(conversationId: string): Promise<HallucinationDetectionRecord[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM hallucination_detections
        WHERE conversation_id = $1
        ORDER BY detected_at DESC
      `;

      const result = await client.query(query, [conversationId]);

      return result.rows.map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        detection_method: row.detection_method as DetectionMethod,
        sample_responses: row.sample_responses || null,
        num_samples: row.num_samples,
        variance_score: row.variance_score ? parseFloat(row.variance_score) : null,
        hallucination_detected: row.hallucination_detected,
        risk_level: row.risk_level as RiskLevel,
        risk_score: parseFloat(row.risk_score),
        contributing_factors: row.contributing_factors || [],
        inconsistent_statements: row.inconsistent_statements || [],
        recommendation: row.recommendation,
        detected_at: new Date(row.detected_at),
      }));
    } catch (error) {
      console.error('[Hallucination Detector] Error getting hallucination detections:', error);
      throw new Error(`Failed to get hallucination detections: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Hallucination Detector] PostgreSQL pool closed');
  }
}

// Export singleton instance
const hallucinationDetector = new HallucinationDetectorService();
export default hallucinationDetector;
