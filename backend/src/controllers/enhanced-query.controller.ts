/**
 * Enhanced Query Controller (Phase 7 Integration)
 *
 * Integrates enrichment features into the RAG pipeline:
 * - Multi-hop retrieval (Phase 5)
 * - Reasoning prompt generation (Phase 6)
 *
 * Feature Flags:
 * - ENABLE_MULTI_HOP: Enable multi-hop relationship expansion
 * - ENABLE_REASONING: Enable reasoning-rich prompts
 * - MAX_HOPS: Maximum relationship hops (0, 1, or 2)
 *
 * Tech Stack: Node.js 18+, Express.js, TypeScript (strict mode)
 * AI Processing: Ollama (local - HIPAA compliant)
 * Vector Storage: FAISS (local disk)
 */

import { Request, Response } from 'express';
import {
  QueryRequest,
  QueryResponse,
  ErrorResponse,
} from '../types/api.types';
import { v4 as uuidv4 } from 'uuid';
import queryUnderstandingAgent from '../services/query-understanding-agent.service';
import productionRetriever from '../services/production-retriever.service';
import multiHopRetriever from '../services/multi-hop-retriever.service';
import reasoningPromptBuilder from '../services/reasoning-prompt-builder.service';
import answerGenerationAgent from '../services/answer-generation-agent.service';
import queryHistoryService from '../services/query-history.service';

// Phase 9: Hallucination Prevention Services
import conversationHistoryService from '../services/conversation-history.service';
import answerGroundingVerifier from '../services/answer-grounding-verifier.service';
import crossQueryConsistency from '../services/cross-query-consistency.service';
import confidenceCalibration from '../services/confidence-calibration.service';
import hallucinationDetector from '../services/hallucination-detector.service';
import qualityMetricsAggregator from '../services/quality-metrics-aggregator.service';

/**
 * Feature flags for enrichment (Phase 7-8)
 */
interface EnrichmentConfig {
  enableMultiHop: boolean;
  enableReasoning: boolean;
  maxHops: number;
  relationshipBoost: number;
  reasoningStyle: 'detailed' | 'concise';
}

/**
 * Feature flags for hallucination prevention (Phase 9)
 */
interface Phase9Config {
  enableConversationHistory: boolean;
  enableGroundingVerification: boolean;
  enableConsistencyChecking: boolean;
  enableConfidenceCalibration: boolean;
  enableHallucinationDetection: boolean;
  groundingScoreThreshold: number;
  consistencyScoreThreshold: number;
  confidenceScoreThreshold: number;
  hallucinationRiskThreshold: number;
}

class EnhancedQueryController {
  /**
   * Get enrichment configuration from environment variables
   */
  private getEnrichmentConfig(): EnrichmentConfig {
    return {
      enableMultiHop: process.env.ENABLE_MULTI_HOP === 'true',
      enableReasoning: process.env.ENABLE_REASONING === 'true',
      maxHops: parseInt(process.env.MAX_HOPS || '1'),
      relationshipBoost: parseFloat(process.env.RELATIONSHIP_BOOST || '0.3'),
      reasoningStyle:
        (process.env.REASONING_STYLE as 'detailed' | 'concise') || 'detailed',
    };
  }

  /**
   * Get Phase 9 configuration from environment variables
   */
  private getPhase9Config(): Phase9Config {
    return {
      enableConversationHistory: process.env.ENABLE_CONVERSATION_HISTORY === 'true',
      enableGroundingVerification: process.env.ENABLE_GROUNDING_VERIFICATION === 'true',
      enableConsistencyChecking: process.env.ENABLE_CONSISTENCY_CHECKING === 'true',
      enableConfidenceCalibration: process.env.ENABLE_CONFIDENCE_CALIBRATION === 'true',
      enableHallucinationDetection: process.env.ENABLE_HALLUCINATION_DETECTION === 'true',
      groundingScoreThreshold: parseFloat(process.env.GROUNDING_SCORE_THRESHOLD || '0.7'),
      consistencyScoreThreshold: parseFloat(process.env.CONSISTENCY_SCORE_THRESHOLD || '0.8'),
      confidenceScoreThreshold: parseFloat(process.env.CONFIDENCE_SCORE_THRESHOLD || '0.6'),
      hallucinationRiskThreshold: parseFloat(process.env.HALLUCINATION_RISK_THRESHOLD || '0.3'),
    };
  }

  /**
   * POST /api/query/enhanced
   * Process a natural language query with enrichment features
   *
   * Enhanced RAG Pipeline:
   * 1. Parse and understand the query (Query Understanding Agent)
   * 2. Retrieve with multi-hop expansion (Multi-Hop Retriever) [PHASE 5]
   * 3. Build reasoning-rich prompt (Reasoning Prompt Builder) [PHASE 6]
   * 4. Generate answer with clinical reasoning (Answer Generator Agent)
   * 5. Format and return response (Response Formatter)
   */
  async search(
    req: Request<{}, {}, QueryRequest>,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const { query, patient_id, options } = req.body;

    try {
      // Generate query ID
      const query_id = uuidv4();

      console.log(
        `[Enhanced Query] Processing query ${query_id} for patient ${patient_id}: "${query}"`
      );

      const detail_level = options?.detail_level || 3;
      const max_results = options?.max_results || 10;

      // Get enrichment configuration
      const enrichmentConfig = this.getEnrichmentConfig();
      console.log(
        `[Enhanced Query] Enrichment config: multi-hop=${enrichmentConfig.enableMultiHop}, reasoning=${enrichmentConfig.enableReasoning}, maxHops=${enrichmentConfig.maxHops}`
      );

      // ================================================================
      // STAGE 1: Query Understanding
      // ================================================================
      console.log(`[Enhanced Query] Stage 1: Understanding query...`);
      const queryUnderstandingStart = Date.now();

      const structuredQuery = await queryUnderstandingAgent.parse(query, patient_id);

      const queryUnderstandingTime = Date.now() - queryUnderstandingStart;
      console.log(
        `[Enhanced Query] ✓ Query understanding complete (${queryUnderstandingTime}ms) - Intent: ${structuredQuery.intent}`
      );

      // ================================================================
      // STAGE 2: Enhanced Retrieval with Multi-Hop (PHASE 5)
      // ================================================================
      console.log(`[Enhanced Query] Stage 2: Retrieving with enrichment...`);
      const retrievalStart = Date.now();

      let retrievalResult;
      let hopStats = undefined;
      let enrichmentStats = undefined;

      if (enrichmentConfig.enableMultiHop) {
        console.log(
          `[Enhanced Query] Using multi-hop retrieval (maxHops: ${enrichmentConfig.maxHops})`
        );

        const multiHopResult = await multiHopRetriever.retrieve(
          structuredQuery,
          max_results,
          {
            enableMultiHop: true,
            maxHops: enrichmentConfig.maxHops,
            relationshipBoost: enrichmentConfig.relationshipBoost,
            useEnrichedText: true,
          }
        );

        retrievalResult = multiHopResult;
        hopStats = multiHopResult.hop_stats;
        enrichmentStats = multiHopResult.enrichment_stats;

        console.log(
          `[Enhanced Query] ✓ Multi-hop retrieval: ${hopStats.initial_chunks} initial + ${hopStats.hop_1_chunks} 1-hop + ${hopStats.hop_2_chunks} 2-hop = ${multiHopResult.candidates.length} total`
        );
      } else {
        console.log(`[Enhanced Query] Using standard retrieval (multi-hop disabled)`);
        retrievalResult = await productionRetriever.retrieve(structuredQuery, max_results);
      }

      const retrievalTime = Date.now() - retrievalStart;
      console.log(
        `[Enhanced Query] ✓ Retrieval complete (${retrievalTime}ms) - ` +
          `Found ${retrievalResult.candidates.length} candidates`
      );

      // ================================================================
      // STAGE 3: Reasoning Prompt Generation (PHASE 6)
      // ================================================================
      let reasoningPrompt = undefined;

      if (enrichmentConfig.enableReasoning) {
        console.log(`[Enhanced Query] Stage 3a: Building reasoning-rich prompt...`);
        const reasoningStart = Date.now();

        reasoningPrompt = await reasoningPromptBuilder.buildPrompt(
          structuredQuery,
          retrievalResult.candidates as any, // Type compatibility
          {
            includeRelationships: true,
            includeRationale: true,
            maxContextChunks: max_results,
            reasoningStyle: enrichmentConfig.reasoningStyle,
          }
        );

        const reasoningTime = Date.now() - reasoningStart;
        console.log(
          `[Enhanced Query] ✓ Reasoning prompt built (${reasoningTime}ms) - Style: ${enrichmentConfig.reasoningStyle}`
        );

        // Log prompt preview (first 500 chars)
        console.log(
          `[Enhanced Query] Prompt preview: ${reasoningPrompt.full_prompt.substring(0, 500)}...`
        );
      } else {
        console.log(`[Enhanced Query] Reasoning prompt disabled (using standard generation)`);
      }

      // ================================================================
      // STAGE 4: Answer Generation
      // ================================================================
      console.log(`[Enhanced Query] Stage 4: Generating answer...`);
      const generationStart = Date.now();

      // TODO: Pass reasoning prompt to answer generation agent
      // For now, use standard generation
      const generatedAnswer = await answerGenerationAgent.generate(
        retrievalResult.candidates,
        structuredQuery
      );

      const generationTime = Date.now() - generationStart;
      console.log(
        `[Enhanced Query] ✓ Answer generation complete (${generationTime}ms) - ` +
          `Generated ${generatedAnswer.structured_extractions.length} extractions`
      );

      // ================================================================
      // STAGE 5: Phase 9 Quality Assurance (Hallucination Prevention)
      // ================================================================
      const phase9Config = this.getPhase9Config();
      let conversationId: string | undefined;
      let groundingScore: number | undefined;
      let consistencyScore: number | undefined;
      let confidenceScore: number | undefined;
      let hallucinationRisk: number | undefined;
      let overallQualityScore: number | undefined;
      let qualityWarnings: string[] = [];

      const phase9Enabled =
        phase9Config.enableConversationHistory ||
        phase9Config.enableGroundingVerification ||
        phase9Config.enableConsistencyChecking ||
        phase9Config.enableConfidenceCalibration;

      if (phase9Enabled) {
        console.log(`[Enhanced Query] Stage 5: Running Phase 9 quality checks...`);
        const phase9Start = Date.now();

        try {
          // Step 5a: Store conversation history (foundation for all other checks)
          if (phase9Config.enableConversationHistory) {
            console.log(`[Enhanced Query] 5a: Storing conversation history...`);
            conversationId = await conversationHistoryService.storeConversation({
              patient_id,
              query,
              query_intent: structuredQuery.intent,
              query_timestamp: new Date(),
              short_answer: generatedAnswer.short_answer,
              detailed_summary: generatedAnswer.detailed_summary,
              model_used: generatedAnswer.model,
              extractions: generatedAnswer.structured_extractions as any,
              sources: retrievalResult.candidates.map((c) => ({
                artifact_id: c.chunk.artifact_id,
                artifact_type: c.metadata.artifact_type,
                chunk_id: c.chunk.chunk_id,
                text: c.chunk.content,
                relevance_score: c.score,
              })),
              retrieval_candidates: retrievalResult.candidates as any,
              enrichment_enabled: enrichmentConfig.enableMultiHop || enrichmentConfig.enableReasoning,
              multi_hop_enabled: enrichmentConfig.enableMultiHop,
              reasoning_enabled: enrichmentConfig.enableReasoning,
              execution_time_ms: undefined, // Will be updated later
              retrieval_time_ms: retrievalTime,
              generation_time_ms: generationTime,
            });
            console.log(`[Enhanced Query] ✓ Conversation stored: ${conversationId}`);
          }

          // Step 5b: Answer grounding verification
          if (phase9Config.enableGroundingVerification && conversationId) {
            console.log(`[Enhanced Query] 5b: Verifying answer grounding...`);
            const groundingResult = await answerGroundingVerifier.verifyAnswer(
              conversationId,
              generatedAnswer.short_answer,
              retrievalResult.candidates
            );
            groundingScore = groundingResult.grounding_score;
            console.log(
              `[Enhanced Query] ✓ Grounding: ${groundingResult.statements.length} statements, ` +
              `score: ${groundingScore.toFixed(2)}, unsupported: ${groundingResult.unsupported_statements.length}`
            );

            if (groundingResult.warnings.length > 0) {
              qualityWarnings.push(...groundingResult.warnings);
            }

            if (groundingScore < phase9Config.groundingScoreThreshold) {
              qualityWarnings.push(
                `Low grounding score (${groundingScore.toFixed(2)} < ${phase9Config.groundingScoreThreshold})`
              );
            }
          }

          // Step 5c: Cross-query consistency checking
          if (phase9Config.enableConsistencyChecking && conversationId) {
            console.log(`[Enhanced Query] 5c: Checking cross-query consistency...`);
            const conversation = await conversationHistoryService.getConversation(conversationId);
            if (conversation) {
              const consistencyResult = await crossQueryConsistency.checkConsistency(
                conversation,
                patient_id
              );
              consistencyScore = consistencyResult.consistency_score;
              console.log(
                `[Enhanced Query] ✓ Consistency: score ${consistencyScore.toFixed(2)}, ` +
                `contradictions: ${consistencyResult.contradictions.length}`
              );

              if (consistencyResult.warnings.length > 0) {
                qualityWarnings.push(...consistencyResult.warnings);
              }

              if (consistencyScore < phase9Config.consistencyScoreThreshold) {
                qualityWarnings.push(
                  `Low consistency score (${consistencyScore.toFixed(2)} < ${phase9Config.consistencyScoreThreshold})`
                );
              }
            }
          }

          // Step 5d: Confidence calibration
          if (phase9Config.enableConfidenceCalibration && conversationId) {
            console.log(`[Enhanced Query] 5d: Calibrating confidence...`);
            const confidenceResult = await confidenceCalibration.aggregateConfidence(
              generatedAnswer.structured_extractions as any,
              retrievalResult.candidates,
              consistencyScore
            );
            confidenceScore = confidenceResult.overall_confidence;
            console.log(
              `[Enhanced Query] ✓ Confidence: ${confidenceScore.toFixed(2)} (${confidenceResult.uncertainty_level})`
            );

            await confidenceCalibration.storeConfidenceMetrics(conversationId, confidenceResult);

            if (confidenceResult.low_confidence_reasons.length > 0) {
              qualityWarnings.push(...confidenceResult.low_confidence_reasons);
            }

            if (confidenceScore < phase9Config.confidenceScoreThreshold) {
              qualityWarnings.push(
                `Low confidence score (${confidenceScore.toFixed(2)} < ${phase9Config.confidenceScoreThreshold})`
              );
            }
          }

          // Step 5e: Hallucination risk assessment
          if (conversationId) {
            console.log(`[Enhanced Query] 5e: Assessing hallucination risk...`);
            const riskResult = await hallucinationDetector.assessHallucinationRisk(
              conversationId,
              groundingScore ?? 0.8,
              consistencyScore ?? 0.9,
              confidenceScore ?? 0.7
            );
            hallucinationRisk = riskResult.risk_score;
            console.log(
              `[Enhanced Query] ✓ Hallucination risk: ${hallucinationRisk.toFixed(2)} (${riskResult.risk_level})`
            );

            if (riskResult.contributing_factors.length > 0) {
              qualityWarnings.push(...riskResult.contributing_factors);
            }

            if (hallucinationRisk > phase9Config.hallucinationRiskThreshold) {
              qualityWarnings.push(
                `High hallucination risk (${hallucinationRisk.toFixed(2)} > ${phase9Config.hallucinationRiskThreshold})`
              );
            }

            // Multi-response detection (expensive, only if enabled)
            if (phase9Config.enableHallucinationDetection) {
              console.log(`[Enhanced Query] 5e-extra: Multi-response hallucination detection...`);
              const numSamples = parseInt(process.env.HALLUCINATION_DETECTION_SAMPLES || '3');
              await hallucinationDetector.detectViaMultiResponse(
                conversationId,
                query,
                retrievalResult.candidates,
                numSamples
              );
            }
          }

          // Step 5f: Calculate overall quality score
          if (conversationId) {
            console.log(`[Enhanced Query] 5f: Calculating overall quality...`);
            const qualityMetrics = await qualityMetricsAggregator.aggregateMetrics(conversationId);
            overallQualityScore = qualityMetrics.overall_quality_score;
            console.log(
              `[Enhanced Query] ✓ Overall quality: ${overallQualityScore.toFixed(2)} (${qualityMetrics.quality_grade})`
            );

            // Update conversation with quality metrics
            await conversationHistoryService.updateQualityMetrics(conversationId, {
              grounding_score: groundingScore,
              consistency_score: consistencyScore,
              confidence_score: confidenceScore,
              hallucination_risk: hallucinationRisk,
              overall_quality_score: overallQualityScore,
            });
          }

          const phase9Time = Date.now() - phase9Start;
          console.log(`[Enhanced Query] ✓ Phase 9 quality checks complete (${phase9Time}ms)`);
        } catch (error) {
          console.error('[Enhanced Query] Phase 9 quality checks failed:', error);
          qualityWarnings.push('Quality checks partially failed - see logs');
          // Don't throw - quality checks should not block response
        }
      } else {
        console.log(`[Enhanced Query] Phase 9 quality checks disabled`);
      }

      // ================================================================
      // STAGE 6: Format Response
      // ================================================================
      const totalTime = Date.now() - startTime;

      // Map retrieval candidates to provenance format
      const provenance = retrievalResult.candidates.map((candidate) => ({
        chunk_id: candidate.chunk.chunk_id,
        artifact_id: candidate.chunk.artifact_id,
        artifact_type: candidate.metadata.artifact_type,
        relevance_score: candidate.score,
        content: candidate.chunk.content,
        date: candidate.metadata.date,
        author: candidate.metadata.author,
        highlights: candidate.highlights.map((h) => ({
          text: h.text,
          start_offset: h.start,
          end_offset: h.end,
        })),
      }));

      // Build response
      const response = {
        query_id,
        query: query,
        patient_id,
        short_answer: generatedAnswer.short_answer,
        detailed_summary: generatedAnswer.detailed_summary,
        structured_extractions: generatedAnswer.structured_extractions,
        provenance,
        metadata: {
          detail_level,
          query_understanding_time_ms: queryUnderstandingTime,
          retrieval_time_ms: retrievalTime,
          generation_time_ms: generationTime,
          total_time_ms: totalTime,
          model: generatedAnswer.model,
          total_tokens: generatedAnswer.total_tokens,
          // Phase 7-8: Enrichment metadata
          enrichment_enabled: enrichmentConfig.enableMultiHop || enrichmentConfig.enableReasoning,
          multi_hop_enabled: enrichmentConfig.enableMultiHop,
          reasoning_enabled: enrichmentConfig.enableReasoning,
          hop_stats: hopStats,
          enrichment_stats: enrichmentStats,
          // Phase 9: Quality assurance metadata
          conversation_id: conversationId,
          quality_metrics: phase9Enabled
            ? {
                grounding_score: groundingScore,
                consistency_score: consistencyScore,
                confidence_score: confidenceScore,
                hallucination_risk: hallucinationRisk,
                overall_quality_score: overallQualityScore,
              }
            : undefined,
          quality_warnings: qualityWarnings.length > 0 ? qualityWarnings : undefined,
        },
      };

      // Save to query history (disabled - using conversation history instead)
      // Note: Phase 9 conversation history provides more comprehensive tracking
      // await queryHistoryService.saveQuery(...)

      console.log(
        `[Enhanced Query] ✅ Query complete (${totalTime}ms) - Returning ${provenance.length} provenance items`
      );

      res.status(200).json(response);
    } catch (error) {
      console.error('[Enhanced Query] Error processing query:', error);

      const errorResponse = {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * GET /api/query/enrichment/config
   * Get current enrichment configuration
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = this.getEnrichmentConfig();

      res.status(200).json({
        success: true,
        config: {
          multi_hop_enabled: config.enableMultiHop,
          reasoning_enabled: config.enableReasoning,
          max_hops: config.maxHops,
          relationship_boost: config.relationshipBoost,
          reasoning_style: config.reasoningStyle,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/query/enrichment/test
   * Test enrichment features with comparison
   */
  async testEnrichment(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const { query, patient_id, options } = req.body;

    try {
      const query_id = uuidv4();
      const max_results = options?.max_results || 10;

      console.log(`[Enhanced Query Test] Running A/B test for query: "${query}"`);

      // Parse query
      const structuredQuery = await queryUnderstandingAgent.parse(query, patient_id);

      // Run BOTH standard and enhanced retrieval for comparison
      const [standardResult, enhancedResult] = await Promise.all([
        productionRetriever.retrieve(structuredQuery, max_results),
        multiHopRetriever.retrieve(structuredQuery, max_results, {
          enableMultiHop: true,
          maxHops: 1,
          relationshipBoost: 0.3,
          useEnrichedText: true,
        }),
      ]);

      const totalTime = Date.now() - startTime;

      res.status(200).json({
        query_id,
        query,
        patient_id,
        comparison: {
          standard: {
            candidates_count: standardResult.candidates.length,
            retrieval_time_ms: standardResult.retrieval_time_ms,
            sample_candidates: standardResult.candidates.slice(0, 3).map((c) => ({
              content_preview: c.chunk.content.substring(0, 100),
              score: c.score,
            })),
          },
          enhanced: {
            candidates_count: enhancedResult.candidates.length,
            retrieval_time_ms: enhancedResult.retrieval_time_ms,
            hop_stats: enhancedResult.hop_stats,
            enrichment_stats: enhancedResult.enrichment_stats,
            sample_candidates: enhancedResult.candidates.slice(0, 3).map((c) => ({
              content_preview: c.chunk.content.substring(0, 100),
              score: c.score,
              hop_distance: c.hop_distance,
              enrichment_score: c.enrichment_score,
            })),
          },
        },
        total_time_ms: totalTime,
      });
    } catch (error) {
      console.error('[Enhanced Query Test] Error:', error);
      res.status(500).json({
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const enhancedQueryController = new EnhancedQueryController();
export default enhancedQueryController;
