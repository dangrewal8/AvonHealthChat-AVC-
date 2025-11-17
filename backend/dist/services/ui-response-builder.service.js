"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * UI Response Builder Class
 *
 * Assembles complete UI response from pipeline outputs
 */
class UIResponseBuilder {
    /**
     * Pipeline version
     */
    PIPELINE_VERSION = '1.0.0';
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
    build(answer, provenance, confidence, query, metrics) {
        // Build response metadata
        const metadata = this.formatMetadata(query, metrics, answer.model);
        // Build audit info
        const audit = this.buildAuditInfo(query, metrics);
        // Assemble complete response
        const response = {
            query_id: query.query_id,
            short_answer: answer.short_answer,
            detailed_summary: answer.detailed_summary,
            structured_extractions: answer.structured_extractions,
            provenance,
            confidence,
            metadata,
            audit,
        };
        // Validate response before returning
        this.validateResponse(response);
        return response;
    }
    /**
     * Format response metadata
     *
     * @param query - Structured query
     * @param metrics - Query metrics
     * @param modelUsed - Model used for generation
     * @returns Response metadata
     */
    formatMetadata(query, metrics, modelUsed) {
        return {
            patient_id: query.patient_id,
            query_timestamp: metrics.query_timestamp,
            response_timestamp: new Date().toISOString(),
            total_time_ms: metrics.total_time_ms,
            sources_count: 0, // Will be set by caller
            model_used: modelUsed,
        };
    }
    /**
     * Build audit information
     *
     * @param query - Structured query
     * @param metrics - Query metrics
     * @returns Audit information
     */
    buildAuditInfo(query, metrics) {
        const now = new Date().toISOString();
        return {
            query_id: query.query_id,
            components_executed: [
                'query-understanding',
                'intent-classification',
                'metadata-filter',
                'retriever',
                'answer-generation',
                'confidence-scoring',
                'citation-validation',
                'provenance-formatting',
            ],
            pipeline_version: this.PIPELINE_VERSION,
            timestamps: {
                query_received: metrics.query_timestamp,
                retrieval_started: metrics.query_timestamp,
                retrieval_completed: new Date(new Date(metrics.query_timestamp).getTime() + metrics.retrieval_time_ms).toISOString(),
                generation_started: new Date(new Date(metrics.query_timestamp).getTime() + metrics.retrieval_time_ms).toISOString(),
                generation_completed: new Date(new Date(metrics.query_timestamp).getTime() +
                    metrics.retrieval_time_ms +
                    metrics.generation_time_ms).toISOString(),
                response_sent: now,
            },
        };
    }
    /**
     * Validate response before sending
     *
     * @param response - UI response to validate
     * @throws Error if validation fails
     */
    validateResponse(response) {
        const errors = [];
        // Check required fields
        if (!response.query_id) {
            errors.push('Missing query_id');
        }
        if (!response.short_answer) {
            errors.push('Missing short_answer');
        }
        if (!response.detailed_summary) {
            errors.push('Missing detailed_summary');
        }
        if (!response.confidence) {
            errors.push('Missing confidence');
        }
        if (!response.metadata) {
            errors.push('Missing metadata');
        }
        if (!response.audit) {
            errors.push('Missing audit');
        }
        // Check arrays are defined
        if (!Array.isArray(response.structured_extractions)) {
            errors.push('structured_extractions must be an array');
        }
        if (!Array.isArray(response.provenance)) {
            errors.push('provenance must be an array');
        }
        // Check confidence score is valid
        if (response.confidence && typeof response.confidence.score !== 'number') {
            errors.push('confidence.score must be a number');
        }
        if (response.confidence &&
            (response.confidence.score < 0 || response.confidence.score > 1)) {
            errors.push('confidence.score must be between 0 and 1');
        }
        // Check metadata fields
        if (response.metadata) {
            if (!response.metadata.patient_id) {
                errors.push('metadata.patient_id is required');
            }
            if (!response.metadata.query_timestamp) {
                errors.push('metadata.query_timestamp is required');
            }
            if (!response.metadata.response_timestamp) {
                errors.push('metadata.response_timestamp is required');
            }
            if (typeof response.metadata.total_time_ms !== 'number') {
                errors.push('metadata.total_time_ms must be a number');
            }
        }
        if (errors.length > 0) {
            throw new Error(`Response validation failed: ${errors.join(', ')}`);
        }
    }
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
    buildErrorResponse(queryId, errorCode, errorMessage, errorDetails, query) {
        const now = new Date().toISOString();
        return {
            query_id: queryId,
            error: {
                code: errorCode,
                message: errorMessage,
                details: errorDetails,
            },
            metadata: {
                query_timestamp: query ? new Date().toISOString() : now,
                error_timestamp: now,
            },
            audit: {
                query_id: queryId,
                pipeline_version: this.PIPELINE_VERSION,
                timestamps: {
                    query_received: query ? new Date().toISOString() : now,
                    retrieval_started: '',
                    retrieval_completed: '',
                    generation_started: '',
                    generation_completed: '',
                    response_sent: now,
                },
            },
        };
    }
    /**
     * Update sources count in metadata
     *
     * @param response - UI response
     * @param count - Number of sources
     */
    updateSourcesCount(response, count) {
        response.metadata.sources_count = count;
    }
    /**
     * Add user/session info to audit
     *
     * @param response - UI response
     * @param userId - User ID
     * @param sessionId - Session ID
     */
    addUserInfo(response, userId, sessionId) {
        if (userId) {
            response.audit.user_id = userId;
        }
        if (sessionId) {
            response.audit.session_id = sessionId;
        }
    }
    /**
     * Format response as JSON string
     *
     * @param response - UI response
     * @param pretty - Pretty print (default: false)
     * @returns JSON string
     */
    toJSON(response, pretty = false) {
        return pretty ? JSON.stringify(response, null, 2) : JSON.stringify(response);
    }
    /**
     * Get response size in bytes
     *
     * @param response - UI response
     * @returns Size in bytes
     */
    getResponseSize(response) {
        return Buffer.from(this.toJSON(response)).length;
    }
    /**
     * Check if response is too large
     *
     * @param response - UI response
     * @param maxSizeBytes - Max size in bytes (default: 1MB)
     * @returns True if response exceeds max size
     */
    isResponseTooLarge(response, maxSizeBytes = 1048576) {
        return this.getResponseSize(response) > maxSizeBytes;
    }
    /**
     * Truncate response if too large
     *
     * @param response - UI response
     * @param maxSizeBytes - Max size in bytes
     * @returns Truncated response
     */
    truncateResponse(response, maxSizeBytes = 1048576) {
        if (!this.isResponseTooLarge(response, maxSizeBytes)) {
            return response;
        }
        // Create copy
        const truncated = { ...response };
        // Truncate detailed summary if needed
        if (truncated.detailed_summary.length > 500) {
            truncated.detailed_summary = truncated.detailed_summary.substring(0, 500) + '...';
        }
        // Truncate extractions if needed
        if (truncated.structured_extractions.length > 10) {
            truncated.structured_extractions = truncated.structured_extractions.slice(0, 10);
        }
        // Truncate provenance if needed
        if (truncated.provenance.length > 10) {
            truncated.provenance = truncated.provenance.slice(0, 10);
        }
        return truncated;
    }
    /**
     * Get response summary for logging
     *
     * @param response - UI response
     * @returns Summary string
     */
    getResponseSummary(response) {
        return `Query ${response.query_id}: ${response.structured_extractions.length} extractions, ${response.provenance.length} sources, confidence ${response.confidence.label} (${response.confidence.score.toFixed(2)}), ${response.metadata.total_time_ms}ms`;
    }
    /**
     * Explain response builder process
     *
     * @returns Explanation string
     */
    explain() {
        return `UI Response Builder Process:

1. Combine Pipeline Outputs
   - Generated answer (short + detailed)
   - Structured extractions
   - Formatted provenance
   - Confidence score

2. Add Metadata
   - Patient ID
   - Timestamps (query + response)
   - Total processing time
   - Sources count
   - Model used

3. Add Audit Information
   - Query ID
   - Components executed
   - Pipeline version
   - Detailed timestamps

4. Validate Response
   - Check required fields
   - Validate data types
   - Verify confidence score range
   - Ensure arrays are defined

5. Return Complete Response
   - Ready for frontend consumption
   - All information included
   - Validated and safe to send

Pipeline Version: ${this.PIPELINE_VERSION}`;
    }
}
// Export singleton instance
const uiResponseBuilder = new UIResponseBuilder();
exports.default = uiResponseBuilder;
//# sourceMappingURL=ui-response-builder.service.js.map