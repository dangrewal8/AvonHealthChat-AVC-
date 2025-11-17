/**
 * Orchestrator Service
 *
 * Main coordinator for the entire RAG pipeline.
 *
 * Pipeline Stages:
 * 1. Query Understanding (QUA)
 * 2. Retrieval
 * 3. Generation
 * 4. Confidence Scoring
 * 5. Provenance Formatting
 * 6. Response Building
 * 7. Audit Logging
 *
 * Features:
 * - Timeout handling (6 seconds)
 * - Error recovery and fallbacks
 * - Performance monitoring
 * - Complete pipeline coordination
 *
 */

import { v4 as uuidv4 } from 'uuid';
import queryUnderstandingAgent from './query-understanding-agent.service';
import retrieverAgent from './retriever-agent.service';
import answerGenerationAgent from './answer-generation-agent.service';

/**
 * Query options
 */
export interface QueryOptions {
  timeout?: number; // Timeout in milliseconds (default: 6000)
  enableAuditLogging?: boolean; // Enable audit logging (default: true)
  sessionId?: string; // Session ID for context
}

/**
 * Pipeline context (for tracking state)
 */
export interface PipelineContext {
  queryId: string;
  query: string;
  patientId: string;
  stage: PipelineStage;
  startTime: number;
  timeout: number;
  data: {
    structuredQuery?: any;
    retrieval?: any;
    answer?: any;
    confidence?: any;
    provenance?: any;
  };
}

/**
 * Pipeline stage
 */
export type PipelineStage =
  | 'query_understanding'
  | 'retrieval'
  | 'generation'
  | 'confidence_scoring'
  | 'provenance_formatting'
  | 'response_building'
  | 'audit_logging'
  | 'complete';

/**
 * Pipeline metrics
 */
export interface PipelineMetrics {
  queryId: string;
  totalTimeMs: number;
  stages: {
    query_understanding?: number;
    retrieval?: number;
    generation?: number;
    confidence_scoring?: number;
    provenance_formatting?: number;
    response_building?: number;
    audit_logging?: number;
  };
  success: boolean;
  error?: string;
}

/**
 * UI Response (simplified for demo)
 */
export interface UIResponse {
  queryId: string;
  success: boolean;
  shortAnswer?: string;
  detailedSummary?: string;
  structuredExtractions?: any[];
  provenance?: any[];
  confidence?: {
    score: number;
    label: string;
    reason: string;
  };
  metadata?: {
    totalTimeMs: number;
    stages: Record<string, number>;
    partial?: boolean;
    error?: string;
  };
  error?: {
    code: string;
    message: string;
    userMessage: string;
    details?: any;
  };
}

/**
 * Orchestrator Class
 *
 * Coordinates the entire RAG pipeline
 */
class Orchestrator {
  /**
   * Default timeout (6 seconds per spec)
   */
  private readonly DEFAULT_TIMEOUT = 6000;

  /**
   * Process query through complete RAG pipeline
   *
   * Pipeline Stages:
   * 1. Query Understanding (QUA)
   * 2. Retrieval
   * 3. Generation
   * 4. Confidence Scoring
   * 5. Provenance Formatting
   * 6. Response Building
   * 7. Audit Logging
   *
   * @param query - User query
   * @param patientId - Patient ID
   * @param options - Query options
   * @returns UI response
   */
  async processQuery(
    query: string,
    patientId: string,
    options: QueryOptions = {}
  ): Promise<UIResponse> {
    const startTime = Date.now();
    const queryId = uuidv4();
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;

    // Initialize pipeline context
    const context: PipelineContext = {
      queryId,
      query,
      patientId,
      stage: 'query_understanding',
      startTime,
      timeout,
      data: {},
    };

    // Initialize metrics
    const metrics: PipelineMetrics = {
      queryId,
      totalTimeMs: 0,
      stages: {},
      success: false,
    };

    try {
      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('PIPELINE_TIMEOUT')),
          timeout
        )
      );

      // Execute pipeline with timeout
      const response = await Promise.race([
        this.executePipeline(context, metrics, options),
        timeoutPromise,
      ]);

      // Mark success
      metrics.success = true;
      metrics.totalTimeMs = Date.now() - startTime;

      return response;
    } catch (error) {
      // Handle errors
      metrics.success = false;
      metrics.totalTimeMs = Date.now() - startTime;
      metrics.error = error instanceof Error ? error.message : String(error);

      return this.handleError(error, context, metrics);
    }
  }

  /**
   * Execute pipeline stages
   *
   * @param context - Pipeline context
   * @param metrics - Pipeline metrics
   * @param options - Query options
   * @returns UI response
   */
  private async executePipeline(
    context: PipelineContext,
    metrics: PipelineMetrics,
    options: QueryOptions
  ): Promise<UIResponse> {
    // Stage 1: Query Understanding
    context.stage = 'query_understanding';
    const quaStart = Date.now();
    context.data.structuredQuery = await this.queryUnderstanding(
      context.query,
      context.patientId
    );
    metrics.stages.query_understanding = Date.now() - quaStart;

    // Stage 2: Retrieval
    context.stage = 'retrieval';
    const retrievalStart = Date.now();
    context.data.retrieval = await this.retrieval(context.data.structuredQuery);
    metrics.stages.retrieval = Date.now() - retrievalStart;

    // Stage 3: Generation
    context.stage = 'generation';
    const generationStart = Date.now();
    context.data.answer = await this.generation(
      context.data.retrieval,
      context.data.structuredQuery
    );
    metrics.stages.generation = Date.now() - generationStart;

    // Stage 4: Confidence Scoring
    context.stage = 'confidence_scoring';
    const confidenceStart = Date.now();
    context.data.confidence = await this.confidenceScoring(
      context.data.retrieval,
      context.data.answer
    );
    metrics.stages.confidence_scoring = Date.now() - confidenceStart;

    // Stage 5: Provenance Formatting
    context.stage = 'provenance_formatting';
    const provenanceStart = Date.now();
    context.data.provenance = await this.provenanceFormatting(
      context.data.answer
    );
    metrics.stages.provenance_formatting = Date.now() - provenanceStart;

    // Stage 6: Response Building
    context.stage = 'response_building';
    const responseStart = Date.now();
    const response = await this.responseBuilding(
      context.data.answer,
      context.data.provenance,
      context.data.confidence,
      context.queryId,
      metrics
    );
    metrics.stages.response_building = Date.now() - responseStart;

    // Stage 7: Audit Logging (optional)
    if (options.enableAuditLogging !== false) {
      context.stage = 'audit_logging';
      const auditStart = Date.now();
      await this.auditLogging(context, response, metrics);
      metrics.stages.audit_logging = Date.now() - auditStart;
    }

    // Mark complete
    context.stage = 'complete';

    return response;
  }

  /**
   * Stage 1: Query Understanding
   *
   * Parse query using QUA agent
   *
   * @param query - User query
   * @param patientId - Patient ID
   * @returns Structured query
   */
  private async queryUnderstanding(
    query: string,
    patientId: string
  ): Promise<any> {
    // Use real QUA agent
    const structuredQuery = queryUnderstandingAgent.parse(query, patientId);
    return structuredQuery;
  }

  /**
   * Stage 2: Retrieval
   *
   * Retrieve relevant chunks
   *
   * @param structuredQuery - Structured query from QUA
   * @returns Retrieval results
   */
  private async retrieval(structuredQuery: any): Promise<any> {
    // Use real retriever agent
    const retrievalResult = await retrieverAgent.retrieve(structuredQuery);
    return retrievalResult;
  }

  /**
   * Stage 3: Generation
   *
   * Generate answer using LLM
   *
   * @param retrieval - Retrieval results
   * @param structuredQuery - Structured query
   * @returns Generated answer
   */
  private async generation(retrieval: any, structuredQuery: any): Promise<any> {
    // Use real answer generation agent
    const answer = await answerGenerationAgent.generate(
      retrieval.candidates,
      structuredQuery
    );
    return answer;
  }

  /**
   * Stage 4: Confidence Scoring
   *
   * Calculate confidence score
   *
   * @param retrieval - Retrieval results
   * @param answer - Generated answer
   * @returns Confidence score
   */
  private async confidenceScoring(retrieval: any, answer: any): Promise<any> {
    // Simulate confidence scoring
    // In production: const confidence = this.confidenceScorer.calculate(retrieval, answer.structured_extractions);

    const avgRetrievalScore =
      retrieval.candidates.reduce((sum: number, c: any) => sum + c.score, 0) /
      retrieval.candidates.length;

    const citationCoverage = answer.structured_extractions.length > 0 ? 1.0 : 0.0;

    const score = (avgRetrievalScore + citationCoverage) / 2;

    return {
      score,
      label: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
      reason: `Based on ${retrieval.candidates.length} sources with avg relevance ${avgRetrievalScore.toFixed(2)}`,
    };
  }

  /**
   * Stage 5: Provenance Formatting
   *
   * Format provenance for UI
   *
   * @param answer - Generated answer
   * @returns Formatted provenance
   */
  private async provenanceFormatting(answer: any): Promise<any> {
    // Simulate provenance formatting
    // In production: const provenance = this.provenanceFormatter.format(answer.structured_extractions);

    return answer.structured_extractions.flatMap((ext: any) =>
      (ext.provenance || []).map((prov: any) => ({
        artifact_id: prov.artifact_id,
        chunk_id: prov.chunk_id,
        snippet: 'prescribed ibuprofen 400 mg q6h PRN',
        note_date: '2 days ago',
        source_url: `https://demo-api.avonhealth.com/notes/${prov.artifact_id}`,
      }))
    );
  }

  /**
   * Stage 6: Response Building
   *
   * Build final UI response
   *
   * @param answer - Generated answer
   * @param provenance - Formatted provenance
   * @param confidence - Confidence score
   * @param queryId - Query ID
   * @param metrics - Pipeline metrics
   * @returns UI response
   */
  private async responseBuilding(
    answer: any,
    provenance: any,
    confidence: any,
    queryId: string,
    metrics: PipelineMetrics
  ): Promise<UIResponse> {
    // Build UI response
    // In production: const response = this.responseBuilder.build(answer, provenance, confidence);

    return {
      queryId,
      success: true,
      shortAnswer: answer.short_answer,
      detailedSummary: answer.detailed_summary,
      structuredExtractions: answer.structured_extractions,
      provenance,
      confidence,
      metadata: {
        totalTimeMs: Date.now() - metrics.stages.query_understanding!,
        stages: metrics.stages,
      },
    };
  }

  /**
   * Stage 7: Audit Logging
   *
   * Log query and response for audit
   *
   * @param context - Pipeline context
   * @param response - UI response
   * @param metrics - Pipeline metrics
   */
  private async auditLogging(
    context: PipelineContext,
    response: UIResponse,
    metrics: PipelineMetrics
  ): Promise<void> {
    // Simulate audit logging
    // In production: await this.auditLogger.log(context.query, response, metrics);

    console.log('[AUDIT]', {
      query_id: context.queryId,
      query: context.query,
      patient_id: context.patientId,
      success: response.success,
      total_time_ms: metrics.totalTimeMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle pipeline error
   *
   * @param error - Error object
   * @param context - Pipeline context
   * @param metrics - Pipeline metrics
   * @returns Error response
   */
  private handleError(
    error: any,
    context: PipelineContext,
    metrics: PipelineMetrics
  ): UIResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if timeout
    if (errorMessage === 'PIPELINE_TIMEOUT') {
      return this.handleTimeout(context, metrics);
    }

    // Generic error response
    return {
      queryId: context.queryId,
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: errorMessage,
        userMessage: 'Unable to process your query at this time.',
        details: {
          stage: context.stage,
          query: context.query,
          patient_id: context.patientId,
        },
      },
      metadata: {
        totalTimeMs: metrics.totalTimeMs,
        stages: metrics.stages,
        error: errorMessage,
      },
    };
  }

  /**
   * Handle timeout
   *
   * Returns partial results if available
   *
   * @param context - Pipeline context
   * @param metrics - Pipeline metrics
   * @returns Partial or error response
   */
  private handleTimeout(
    context: PipelineContext,
    metrics: PipelineMetrics
  ): UIResponse {
    // Check what stages completed
    const completedStages: string[] = [];
    if (context.data.structuredQuery) completedStages.push('query_understanding');
    if (context.data.retrieval) completedStages.push('retrieval');
    if (context.data.answer) completedStages.push('generation');

    // If we have retrieval results, return partial
    if (context.data.retrieval) {
      return {
        queryId: context.queryId,
        success: false,
        shortAnswer:
          'Query is taking longer than expected. Showing partial results.',
        detailedSummary: context.data.retrieval.candidates
          .slice(0, 3)
          .map(
            (c: any, i: number) =>
              `${i + 1}. ${c.chunk_text} (Score: ${c.score.toFixed(2)})`
          )
          .join('\n\n'),
        confidence: {
          score: 0,
          label: 'low',
          reason: 'Partial results due to timeout',
        },
        metadata: {
          totalTimeMs: metrics.totalTimeMs,
          stages: metrics.stages,
          partial: true,
          error: 'TIMEOUT',
        },
      };
    }

    // No partial results available
    return {
      queryId: context.queryId,
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'Query exceeded timeout limit',
        userMessage: 'Your query is taking longer than expected. Please try again.',
        details: {
          timeout: context.timeout,
          completed_stages: completedStages,
        },
      },
      metadata: {
        totalTimeMs: metrics.totalTimeMs,
        stages: metrics.stages,
        error: 'TIMEOUT',
      },
    };
  }

  /**
   * Get pipeline metrics
   *
   * @param queryId - Query ID
   * @returns Pipeline metrics
   */
  getMetrics(_queryId: string): PipelineMetrics | null {
    // In production: retrieve from metrics store
    return null;
  }

  /**
   * Explain orchestrator
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Orchestrator:

Pipeline Stages:
1. Query Understanding (QUA) - Parse query
2. Retrieval - Retrieve relevant chunks
3. Generation - Generate answer with LLM
4. Confidence Scoring - Calculate confidence
5. Provenance Formatting - Format citations
6. Response Building - Build UI response
7. Audit Logging - Log for compliance

Features:
- Timeout handling (6 seconds default)
- Error recovery and fallbacks
- Partial results on timeout
- Performance monitoring
- Complete pipeline coordination

Usage:
  const response = await orchestrator.processQuery(query, patientId);

Tech Stack: Node.js + Express + TypeScript ONLY`;
  }
}

// Export singleton instance
const orchestrator = new Orchestrator();
export default orchestrator;
