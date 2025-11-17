/**
 * UI Response Builder Service
 *
 * Assembles the final response format for UI consumption.
 *
 * Features:
 * - Combines all pipeline outputs
 * - Adds timestamps and IDs
 * - Formats for frontend consumption
 * - Includes debug/audit information
 * - Response validation
 * - Error response formatting
 *
 */
import { GeneratedAnswer } from './answer-generation-agent.service';
import { FormattedProvenance } from './provenance-formatter.service';
import { ConfidenceScore } from './confidence-scorer.service';
import { StructuredQuery } from './query-understanding-agent.service';
import { Extraction } from './extraction-prompt-builder.service';
/**
 * Query metrics for tracking performance
 */
export interface QueryMetrics {
    query_timestamp: string;
    retrieval_time_ms: number;
    generation_time_ms: number;
    validation_time_ms: number;
    formatting_time_ms: number;
    total_time_ms: number;
}
/**
 * Response metadata
 */
export interface ResponseMetadata {
    patient_id: string;
    query_timestamp: string;
    response_timestamp: string;
    total_time_ms: number;
    sources_count: number;
    model_used: string;
}
/**
 * Audit information for debugging/compliance
 */
export interface AuditInfo {
    query_id: string;
    user_id?: string;
    session_id?: string;
    components_executed: string[];
    pipeline_version: string;
    timestamps: {
        query_received: string;
        retrieval_started: string;
        retrieval_completed: string;
        generation_started: string;
        generation_completed: string;
        response_sent: string;
    };
}
/**
 * Complete UI response (final output)
 */
export interface UIResponse {
    query_id: string;
    short_answer: string;
    detailed_summary: string;
    structured_extractions: Extraction[];
    provenance: FormattedProvenance[];
    confidence: ConfidenceScore;
    metadata: ResponseMetadata;
    audit: AuditInfo;
}
/**
 * Error response
 */
export interface ErrorResponse {
    query_id: string;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    metadata: {
        query_timestamp: string;
        error_timestamp: string;
    };
    audit: Partial<AuditInfo>;
}
/**
 * UI Response Builder Class
 *
 * Assembles complete UI response from pipeline outputs
 */
declare class UIResponseBuilder {
    /**
     * Pipeline version
     */
    private readonly PIPELINE_VERSION;
    /**
     * Build complete UI response
     *
     * @param answer - Generated answer
     * @param provenance - Formatted provenance
     * @param confidence - Confidence score
     * @param query - Original structured query
     * @param metrics - Query metrics
     * @returns Complete UI response
     */
    build(answer: GeneratedAnswer, provenance: FormattedProvenance[], confidence: ConfidenceScore, query: StructuredQuery, metrics: QueryMetrics): UIResponse;
    /**
     * Format response metadata
     *
     * @param query - Structured query
     * @param metrics - Query metrics
     * @param modelUsed - Model used for generation
     * @returns Response metadata
     */
    formatMetadata(query: StructuredQuery, metrics: QueryMetrics, modelUsed: string): ResponseMetadata;
    /**
     * Build audit information
     *
     * @param query - Structured query
     * @param metrics - Query metrics
     * @returns Audit information
     */
    private buildAuditInfo;
    /**
     * Validate response before sending
     *
     * @param response - UI response to validate
     * @throws Error if validation fails
     */
    validateResponse(response: UIResponse): void;
    /**
     * Build error response
     *
     * @param queryId - Query ID
     * @param errorCode - Error code
     * @param errorMessage - Error message
     * @param errorDetails - Additional error details
     * @param query - Original query (optional)
     * @returns Error response
     */
    buildErrorResponse(queryId: string, errorCode: string, errorMessage: string, errorDetails?: any, query?: StructuredQuery): ErrorResponse;
    /**
     * Update sources count in metadata
     *
     * @param response - UI response
     * @param count - Number of sources
     */
    updateSourcesCount(response: UIResponse, count: number): void;
    /**
     * Add user/session info to audit
     *
     * @param response - UI response
     * @param userId - User ID
     * @param sessionId - Session ID
     */
    addUserInfo(response: UIResponse, userId?: string, sessionId?: string): void;
    /**
     * Format response as JSON string
     *
     * @param response - UI response
     * @param pretty - Pretty print (default: false)
     * @returns JSON string
     */
    toJSON(response: UIResponse | ErrorResponse, pretty?: boolean): string;
    /**
     * Get response size in bytes
     *
     * @param response - UI response
     * @returns Size in bytes
     */
    getResponseSize(response: UIResponse | ErrorResponse): number;
    /**
     * Check if response is too large
     *
     * @param response - UI response
     * @param maxSizeBytes - Max size in bytes (default: 1MB)
     * @returns True if response exceeds max size
     */
    isResponseTooLarge(response: UIResponse | ErrorResponse, maxSizeBytes?: number): boolean;
    /**
     * Truncate response if too large
     *
     * @param response - UI response
     * @param maxSizeBytes - Max size in bytes
     * @returns Truncated response
     */
    truncateResponse(response: UIResponse, maxSizeBytes?: number): UIResponse;
    /**
     * Get response summary for logging
     *
     * @param response - UI response
     * @returns Summary string
     */
    getResponseSummary(response: UIResponse): string;
    /**
     * Explain response builder process
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const uiResponseBuilder: UIResponseBuilder;
export default uiResponseBuilder;
//# sourceMappingURL=ui-response-builder.service.d.ts.map