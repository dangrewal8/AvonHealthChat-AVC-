"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.ValidationError = exports.NotFoundError = exports.TimeoutError = exports.RateLimitError = exports.AuthorizationError = exports.AuthenticationError = exports.AppError = exports.ErrorCategory = void 0;
/**
 * Error categories
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["RATE_LIMIT"] = "rate_limit";
    ErrorCategory["TIMEOUT"] = "timeout";
    ErrorCategory["NOT_FOUND"] = "not_found";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["SERVER_ERROR"] = "server_error";
    ErrorCategory["SERVICE_UNAVAILABLE"] = "service_unavailable";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
/**
 * Custom base error class
 */
class AppError extends Error {
    statusCode;
    code;
    category;
    isOperational;
    constructor(message, statusCode, code, category, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.category = category;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Authentication error (401)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTH_FAILED', ErrorCategory.AUTHENTICATION);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization error (403)
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'ACCESS_DENIED', ErrorCategory.AUTHORIZATION);
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Rate limit error (429)
 */
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', ErrorCategory.RATE_LIMIT);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Timeout error (504)
 */
class TimeoutError extends AppError {
    constructor(message = 'Request timeout') {
        super(message, 504, 'REQUEST_TIMEOUT', ErrorCategory.TIMEOUT);
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND', ErrorCategory.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Validation error (400)
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, 'VALIDATION_FAILED', ErrorCategory.VALIDATION);
    }
}
exports.ValidationError = ValidationError;
/**
 * Service unavailable error (503)
 */
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE', ErrorCategory.SERVICE_UNAVAILABLE);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Error Response Handler Class
 *
 * Handles and formats errors for user-friendly display
 */
class ErrorResponseHandler {
    /**
     * User-friendly message mappings
     */
    userFriendlyMessages = {
        [ErrorCategory.AUTHENTICATION]: {
            title: 'Authentication Required',
            message: 'Please sign in to access this feature.',
            suggestion: 'Sign in with your credentials and try again.',
            category: ErrorCategory.AUTHENTICATION,
        },
        [ErrorCategory.AUTHORIZATION]: {
            title: 'Access Denied',
            message: "You don't have permission to access this resource.",
            suggestion: 'Contact your administrator if you need access.',
            category: ErrorCategory.AUTHORIZATION,
        },
        [ErrorCategory.RATE_LIMIT]: {
            title: 'Too Many Requests',
            message: "You've made too many requests. Please slow down.",
            suggestion: 'Wait a few minutes and try again.',
            category: ErrorCategory.RATE_LIMIT,
        },
        [ErrorCategory.TIMEOUT]: {
            title: 'Request Timeout',
            message: 'Your request took too long to complete.',
            suggestion: 'Try again in a moment. If the problem persists, contact support.',
            category: ErrorCategory.TIMEOUT,
        },
        [ErrorCategory.NOT_FOUND]: {
            title: 'Not Found',
            message: 'The requested resource could not be found.',
            suggestion: 'Check the URL and try again.',
            category: ErrorCategory.NOT_FOUND,
        },
        [ErrorCategory.VALIDATION]: {
            title: 'Invalid Input',
            message: 'The information you provided is invalid.',
            suggestion: 'Check your input and try again.',
            category: ErrorCategory.VALIDATION,
        },
        [ErrorCategory.SERVER_ERROR]: {
            title: 'Server Error',
            message: 'Something went wrong on our end.',
            suggestion: 'Please try again later. If the problem persists, contact support.',
            category: ErrorCategory.SERVER_ERROR,
        },
        [ErrorCategory.SERVICE_UNAVAILABLE]: {
            title: 'Service Unavailable',
            message: 'This service is temporarily unavailable.',
            suggestion: 'Please try again in a few minutes.',
            category: ErrorCategory.SERVICE_UNAVAILABLE,
        },
    };
    /**
     * Handle error and create error response
     *
     * @param error - Error object
     * @param context - Error context
     * @returns Error response
     */
    handleError(error, context) {
        // Determine if it's an AppError or generic Error
        const appError = this.isAppError(error) ? error : this.convertToAppError(error);
        // Log error
        this.logError(appError, context);
        // Format for UI
        const userFriendly = this.formatForUI(appError);
        // Build error response
        const response = {
            success: false,
            error: {
                code: appError.code,
                message: appError.message,
                user_message: userFriendly.message,
                details: this.sanitizeDetails(error, context),
            },
            timestamp: new Date().toISOString(),
            query_id: context?.query_id,
        };
        return response;
    }
    /**
     * Format error for UI display
     *
     * @param error - Error object
     * @returns User-friendly error
     */
    formatForUI(error) {
        const appError = this.isAppError(error) ? error : this.convertToAppError(error);
        // Get base user-friendly message for category
        const baseMessage = this.userFriendlyMessages[appError.category];
        return {
            title: baseMessage.title,
            message: baseMessage.message,
            suggestion: baseMessage.suggestion,
            category: appError.category,
        };
    }
    /**
     * Check if error is AppError
     *
     * @param error - Error object
     * @returns True if AppError
     */
    isAppError(error) {
        return error instanceof AppError;
    }
    /**
     * Convert generic Error to AppError
     *
     * @param error - Error object
     * @returns AppError
     */
    convertToAppError(error) {
        // Check for specific error types
        if (error.name === 'ValidationError') {
            return new ValidationError(error.message);
        }
        if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
            return new AuthenticationError(error.message);
        }
        if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
            return new AuthorizationError(error.message);
        }
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            return new TimeoutError(error.message);
        }
        if (error.name === 'NotFoundError' || error.message.includes('not found')) {
            return new NotFoundError(error.message);
        }
        // Default to server error
        return new AppError(error.message || 'An unexpected error occurred', 500, 'INTERNAL_ERROR', ErrorCategory.SERVER_ERROR, false // Not operational
        );
    }
    /**
     * Sanitize error details for response
     *
     * @param error - Error object
     * @param context - Error context
     * @returns Sanitized details
     */
    sanitizeDetails(error, context) {
        const details = {};
        // Only include non-sensitive context in production
        const isProduction = process.env.NODE_ENV === 'production';
        if (!isProduction) {
            // Development: Include more details
            details.message = error.message;
            details.stack = error.stack;
            details.context = context;
        }
        else {
            // Production: Minimal details
            if (this.isAppError(error) && error.isOperational) {
                // Only include details for operational errors
                details.category = error.category;
            }
        }
        return Object.keys(details).length > 0 ? details : undefined;
    }
    /**
     * Log error for monitoring
     *
     * @param error - AppError object
     * @param context - Error context
     */
    logError(error, context) {
        const logData = {
            timestamp: new Date().toISOString(),
            code: error.code,
            message: error.message,
            category: error.category,
            statusCode: error.statusCode,
            isOperational: error.isOperational,
            context,
            stack: error.stack,
        };
        // Log to console (in production, send to monitoring service)
        if (error.statusCode >= 500) {
            console.error('[ERROR]', JSON.stringify(logData, null, 2));
        }
        else if (error.statusCode >= 400) {
            console.warn('[WARN]', JSON.stringify(logData, null, 2));
        }
        else {
            console.info('[INFO]', JSON.stringify(logData, null, 2));
        }
        // In production, send to monitoring service (e.g., Sentry, DataDog)
        // this.sendToMonitoring(logData);
    }
    /**
     * Get HTTP status code from error
     *
     * @param error - Error object
     * @returns HTTP status code
     */
    getStatusCode(error) {
        if (this.isAppError(error)) {
            return error.statusCode;
        }
        // Default to 500 for unknown errors
        return 500;
    }
    /**
     * Express error middleware
     *
     * @param err - Error object
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    expressMiddleware() {
        return (err, req, res, _next) => {
            // Build error context from request
            const context = {
                request_path: req.path,
                request_method: req.method,
                ip_address: req.ip,
                user_id: req.user?.id,
                query_id: req.query_id,
            };
            // Handle error
            const errorResponse = this.handleError(err, context);
            // Send response
            const statusCode = this.getStatusCode(err);
            res.status(statusCode).json(errorResponse);
        };
    }
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
    createErrorResponse(code, message, userMessage, _statusCode, context) {
        return {
            success: false,
            error: {
                code,
                message,
                user_message: userMessage,
            },
            timestamp: new Date().toISOString(),
            query_id: context?.query_id,
        };
    }
    /**
     * Check if error is operational (expected)
     *
     * @param error - Error object
     * @returns True if operational
     */
    isOperationalError(error) {
        if (this.isAppError(error)) {
            return error.isOperational;
        }
        return false;
    }
    /**
     * Get error statistics
     *
     * @returns Error statistics
     */
    getStatistics() {
        // In production, this would query monitoring service
        return {
            total_errors: 0,
            errors_by_category: {},
            errors_by_code: {},
            recent_errors: [],
        };
    }
    /**
     * Explain error handler
     *
     * @returns Explanation string
     */
    explain() {
        return `Error Response Handler Process:

1. Error Categorization
   - Authentication (401): Sign-in required
   - Authorization (403): Access denied
   - Rate Limit (429): Too many requests
   - Timeout (504): Request took too long
   - Not Found (404): Resource not found
   - Validation (400): Invalid input
   - Server Error (500): Internal error
   - Service Unavailable (503): Service down

2. Error Handling
   - Detect error type (AppError or generic Error)
   - Convert to AppError if needed
   - Log error for monitoring
   - Format for UI display
   - Build error response

3. User-Friendly Messages
   - Convert technical errors to simple explanations
   - Include recovery suggestions
   - Filter sensitive details in production
   - Provide actionable next steps

4. Error Logging
   - Log level based on status code:
     - 5xx: ERROR (critical)
     - 4xx: WARN (client error)
     - Other: INFO
   - Include context (query_id, user_id, path)
   - Send to monitoring in production

5. Express Middleware
   - Automatic error handling for Express apps
   - Extract context from request
   - Send formatted error response

Environment: ${process.env.NODE_ENV || 'development'}
Detail Level: ${process.env.NODE_ENV === 'production' ? 'Minimal (Production)' : 'Full (Development)'}`;
    }
}
// Export singleton instance
const errorResponseHandler = new ErrorResponseHandler();
exports.default = errorResponseHandler;
//# sourceMappingURL=error-response-handler.service.js.map