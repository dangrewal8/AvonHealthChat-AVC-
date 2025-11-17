/**
 * Error Response Handler Service
 *
 * Handles errors and formats user-friendly error messages.
 *
 * Features:
 * - Error categorization by HTTP status code
 * - User-friendly error messages
 * - Recovery suggestions
 * - Sensitive detail filtering
 * - Error logging and monitoring
 * - Express middleware support
 *
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Error response for API
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        user_message: string;
        details?: any;
    };
    timestamp: string;
    query_id?: string;
}
/**
 * Error context for additional information
 */
export interface ErrorContext {
    query_id?: string;
    patient_id?: string;
    user_id?: string;
    request_path?: string;
    request_method?: string;
    ip_address?: string;
}
/**
 * User-friendly error representation
 */
export interface UserFriendlyError {
    title: string;
    message: string;
    suggestion: string;
    category: ErrorCategory;
}
/**
 * Error categories
 */
export declare enum ErrorCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    RATE_LIMIT = "rate_limit",
    TIMEOUT = "timeout",
    NOT_FOUND = "not_found",
    VALIDATION = "validation",
    SERVER_ERROR = "server_error",
    SERVICE_UNAVAILABLE = "service_unavailable"
}
/**
 * Custom base error class
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly category: ErrorCategory;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, category: ErrorCategory, isOperational?: boolean);
}
/**
 * Authentication error (401)
 */
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
/**
 * Authorization error (403)
 */
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
/**
 * Rate limit error (429)
 */
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
/**
 * Timeout error (504)
 */
export declare class TimeoutError extends AppError {
    constructor(message?: string);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * Validation error (400)
 */
export declare class ValidationError extends AppError {
    constructor(message?: string);
}
/**
 * Service unavailable error (503)
 */
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
/**
 * Error Response Handler Class
 *
 * Handles and formats errors for user-friendly display
 */
declare class ErrorResponseHandler {
    /**
     * User-friendly message mappings
     */
    private readonly userFriendlyMessages;
    /**
     * Handle error and create error response
     *
     * @param error - Error object
     * @param context - Error context
     * @returns Error response
     */
    handleError(error: Error, context?: ErrorContext): ErrorResponse;
    /**
     * Format error for UI display
     *
     * @param error - Error object
     * @returns User-friendly error
     */
    formatForUI(error: Error): UserFriendlyError;
    /**
     * Check if error is AppError
     *
     * @param error - Error object
     * @returns True if AppError
     */
    private isAppError;
    /**
     * Convert generic Error to AppError
     *
     * @param error - Error object
     * @returns AppError
     */
    private convertToAppError;
    /**
     * Sanitize error details for response
     *
     * @param error - Error object
     * @param context - Error context
     * @returns Sanitized details
     */
    private sanitizeDetails;
    /**
     * Log error for monitoring
     *
     * @param error - AppError object
     * @param context - Error context
     */
    private logError;
    /**
     * Get HTTP status code from error
     *
     * @param error - Error object
     * @returns HTTP status code
     */
    getStatusCode(error: Error): number;
    /**
     * Express error middleware
     *
     * @param err - Error object
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    expressMiddleware(): (err: Error, req: Request, res: Response, _next: NextFunction) => void;
    /**
     * Create error response directly (for specific cases)
     *
     * @param code - Error code
     * @param message - Technical message
     * @param userMessage - User-friendly message
     * @param statusCode - HTTP status code
     * @param context - Error context
     * @returns Error response
     */
    createErrorResponse(code: string, message: string, userMessage: string, _statusCode: number, context?: ErrorContext): ErrorResponse;
    /**
     * Check if error is operational (expected)
     *
     * @param error - Error object
     * @returns True if operational
     */
    isOperationalError(error: Error): boolean;
    /**
     * Get error statistics
     *
     * @returns Error statistics
     */
    getStatistics(): {
        total_errors: number;
        errors_by_category: {};
        errors_by_code: {};
        recent_errors: never[];
    };
    /**
     * Explain error handler
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const errorResponseHandler: ErrorResponseHandler;
export default errorResponseHandler;
//# sourceMappingURL=error-response-handler.service.d.ts.map