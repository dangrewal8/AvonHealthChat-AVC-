/**
 * Error Message Catalog Service
 *
 * Centralized catalog of user-friendly error messages.
 *
 * Features:
 * - Consistent error messages across application
 * - User-friendly explanations
 * - Recovery suggestions for all errors
 * - Technical and user-facing messages
 * - HTTP status code mapping
 *
 */
import { ErrorResponse } from './error-response-handler.service';
/**
 * Error codes for all application errors
 */
export declare enum ErrorCode {
    AUTH_FAILED = "AUTH_FAILED",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    PATIENT_NOT_FOUND = "PATIENT_NOT_FOUND",
    ARTIFACT_NOT_FOUND = "ARTIFACT_NOT_FOUND",
    NO_RESULTS_FOUND = "NO_RESULTS_FOUND",
    INVALID_QUERY = "INVALID_QUERY",
    QUERY_TOO_BROAD = "QUERY_TOO_BROAD",
    QUERY_TOO_SPECIFIC = "QUERY_TOO_SPECIFIC",
    EMPTY_QUERY = "EMPTY_QUERY",
    RETRIEVAL_FAILED = "RETRIEVAL_FAILED",
    VECTOR_DB_ERROR = "VECTOR_DB_ERROR",
    LOW_RELEVANCE = "LOW_RELEVANCE",
    GENERATION_FAILED = "GENERATION_FAILED",
    EXTRACTION_FAILED = "EXTRACTION_FAILED",
    LLM_ERROR = "LLM_ERROR",
    LLM_QUOTA_EXCEEDED = "LLM_QUOTA_EXCEEDED",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    CITATION_VALIDATION_FAILED = "CITATION_VALIDATION_FAILED",
    CONFIDENCE_TOO_LOW = "CONFIDENCE_TOO_LOW",
    RATE_LIMIT = "RATE_LIMIT",
    TIMEOUT = "TIMEOUT",
    REQUEST_TOO_LARGE = "REQUEST_TOO_LARGE",
    SERVER_ERROR = "SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
}
/**
 * Error message template
 */
export interface ErrorTemplate {
    code: ErrorCode;
    httpStatus: number;
    technicalMessage: string;
    userMessage: string;
    recoverySuggestion: string;
    category?: string;
}
/**
 * Error Catalog Class
 *
 * Centralized catalog of error messages
 */
declare class ErrorCatalog {
    /**
     * Get error template by code
     *
     * @param code - Error code
     * @returns Error template
     */
    getTemplate(code: ErrorCode): ErrorTemplate;
    /**
     * Format error response from error code
     *
     * @param code - Error code
     * @param context - Optional context (e.g., patient_id, query_id)
     * @returns Error response
     */
    formatError(code: ErrorCode, context?: any): ErrorResponse;
    /**
     * Get all error codes
     *
     * @returns Array of error codes
     */
    getAllErrorCodes(): ErrorCode[];
    /**
     * Get error codes by category
     *
     * @param category - Error category
     * @returns Array of error codes in category
     */
    getErrorCodesByCategory(category: string): ErrorCode[];
    /**
     * Get error codes by HTTP status
     *
     * @param httpStatus - HTTP status code
     * @returns Array of error codes with that status
     */
    getErrorCodesByStatus(httpStatus: number): ErrorCode[];
    /**
     * Check if error code exists
     *
     * @param code - Error code to check
     * @returns True if exists
     */
    hasErrorCode(code: string): code is ErrorCode;
    /**
     * Get recovery suggestion for error code
     *
     * @param code - Error code
     * @returns Recovery suggestion
     */
    getRecoverySuggestion(code: ErrorCode): string;
    /**
     * Get user message for error code
     *
     * @param code - Error code
     * @returns User-friendly message
     */
    getUserMessage(code: ErrorCode): string;
    /**
     * Get HTTP status for error code
     *
     * @param code - Error code
     * @returns HTTP status code
     */
    getHTTPStatus(code: ErrorCode): number;
    /**
     * Get error statistics
     *
     * @returns Error statistics
     */
    getStatistics(): {
        total_error_codes: number;
        by_category: Record<string, number>;
        by_status: Record<number, number>;
    };
    /**
     * Explain error catalog
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const errorCatalog: ErrorCatalog;
export default errorCatalog;
//# sourceMappingURL=error-catalog.service.d.ts.map