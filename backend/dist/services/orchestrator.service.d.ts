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
/**
 * Query options
 */
export interface QueryOptions {
    timeout?: number;
    enableAuditLogging?: boolean;
    sessionId?: string;
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
export type PipelineStage = 'query_understanding' | 'retrieval' | 'generation' | 'confidence_scoring' | 'provenance_formatting' | 'response_building' | 'audit_logging' | 'complete';
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
declare class Orchestrator {
    /**
     * Default timeout (6 seconds per spec)
     */
    private readonly DEFAULT_TIMEOUT;
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
    processQuery(query: string, patientId: string, options?: QueryOptions): Promise<UIResponse>;
    /**
     * Execute pipeline stages
     *
     * @param context - Pipeline context
     * @param metrics - Pipeline metrics
     * @param options - Query options
     * @returns UI response
     */
    private executePipeline;
    /**
     * Stage 1: Query Understanding
     *
     * Parse query using QUA agent
     *
     * @param query - User query
     * @param patientId - Patient ID
     * @returns Structured query
     */
    private queryUnderstanding;
    /**
     * Stage 2: Retrieval
     *
     * Retrieve relevant chunks
     *
     * @param structuredQuery - Structured query from QUA
     * @returns Retrieval results
     */
    private retrieval;
    /**
     * Stage 3: Generation
     *
     * Generate answer using LLM
     *
     * @param retrieval - Retrieval results
     * @param structuredQuery - Structured query
     * @returns Generated answer
     */
    private generation;
    /**
     * Stage 4: Confidence Scoring
     *
     * Calculate confidence score
     *
     * @param retrieval - Retrieval results
     * @param answer - Generated answer
     * @returns Confidence score
     */
    private confidenceScoring;
    /**
     * Stage 5: Provenance Formatting
     *
     * Format provenance for UI
     *
     * @param answer - Generated answer
     * @returns Formatted provenance
     */
    private provenanceFormatting;
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
    private responseBuilding;
    /**
     * Stage 7: Audit Logging
     *
     * Log query and response for audit
     *
     * @param context - Pipeline context
     * @param response - UI response
     * @param metrics - Pipeline metrics
     */
    private auditLogging;
    /**
     * Handle pipeline error
     *
     * @param error - Error object
     * @param context - Pipeline context
     * @param metrics - Pipeline metrics
     * @returns Error response
     */
    private handleError;
    /**
     * Handle timeout
     *
     * Returns partial results if available
     *
     * @param context - Pipeline context
     * @param metrics - Pipeline metrics
     * @returns Partial or error response
     */
    private handleTimeout;
    /**
     * Get pipeline metrics
     *
     * @param queryId - Query ID
     * @returns Pipeline metrics
     */
    getMetrics(_queryId: string): PipelineMetrics | null;
    /**
     * Explain orchestrator
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const orchestrator: Orchestrator;
export default orchestrator;
//# sourceMappingURL=orchestrator.service.d.ts.map