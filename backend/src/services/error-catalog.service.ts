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
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Patient & Data Access
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  ARTIFACT_NOT_FOUND = 'ARTIFACT_NOT_FOUND',
  NO_RESULTS_FOUND = 'NO_RESULTS_FOUND',

  // Query & Processing
  INVALID_QUERY = 'INVALID_QUERY',
  QUERY_TOO_BROAD = 'QUERY_TOO_BROAD',
  QUERY_TOO_SPECIFIC = 'QUERY_TOO_SPECIFIC',
  EMPTY_QUERY = 'EMPTY_QUERY',

  // Retrieval
  RETRIEVAL_FAILED = 'RETRIEVAL_FAILED',
  VECTOR_DB_ERROR = 'VECTOR_DB_ERROR',
  LOW_RELEVANCE = 'LOW_RELEVANCE',

  // Answer Generation
  GENERATION_FAILED = 'GENERATION_FAILED',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  LLM_ERROR = 'LLM_ERROR',
  LLM_QUOTA_EXCEEDED = 'LLM_QUOTA_EXCEEDED',

  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CITATION_VALIDATION_FAILED = 'CITATION_VALIDATION_FAILED',
  CONFIDENCE_TOO_LOW = 'CONFIDENCE_TOO_LOW',

  // Rate Limiting & Performance
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',

  // Server & Service
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Error message template
 */
export interface ErrorTemplate {
  code: ErrorCode; // Error code
  httpStatus: number; // HTTP status code
  technicalMessage: string; // Technical error message (for logs)
  userMessage: string; // User-friendly message
  recoverySuggestion: string; // Recovery suggestion
  category?: string; // Error category (optional)
}

/**
 * Comprehensive error templates catalog
 */
const ERROR_TEMPLATES: Record<ErrorCode, ErrorTemplate> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_FAILED]: {
    code: ErrorCode.AUTH_FAILED,
    httpStatus: 401,
    technicalMessage: 'OAuth authentication failed',
    userMessage: 'Unable to access medical records at this time.',
    recoverySuggestion:
      'Please try again in a few moments. If the issue persists, contact support.',
    category: 'authentication',
  },

  [ErrorCode.TOKEN_EXPIRED]: {
    code: ErrorCode.TOKEN_EXPIRED,
    httpStatus: 401,
    technicalMessage: 'Authentication token expired',
    userMessage: 'Your session has expired.',
    recoverySuggestion: 'Please sign in again to continue.',
    category: 'authentication',
  },

  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    code: ErrorCode.INSUFFICIENT_PERMISSIONS,
    httpStatus: 403,
    technicalMessage: 'User lacks required permissions',
    userMessage: "You don't have permission to access this information.",
    recoverySuggestion: 'Contact your administrator if you need access.',
    category: 'authorization',
  },

  // Patient & Data Access
  [ErrorCode.PATIENT_NOT_FOUND]: {
    code: ErrorCode.PATIENT_NOT_FOUND,
    httpStatus: 404,
    technicalMessage: 'Patient ID not found in database',
    userMessage: 'No records found for this patient.',
    recoverySuggestion: 'Please verify the patient ID and try again.',
    category: 'not_found',
  },

  [ErrorCode.ARTIFACT_NOT_FOUND]: {
    code: ErrorCode.ARTIFACT_NOT_FOUND,
    httpStatus: 404,
    technicalMessage: 'Artifact ID not found',
    userMessage: 'The requested document could not be found.',
    recoverySuggestion: 'Check the document ID and try again.',
    category: 'not_found',
  },

  [ErrorCode.NO_RESULTS_FOUND]: {
    code: ErrorCode.NO_RESULTS_FOUND,
    httpStatus: 200, // Not an error, but no results
    technicalMessage: 'Query returned zero results',
    userMessage: 'No matching records found for your query.',
    recoverySuggestion: 'Try rephrasing your question or broadening the search criteria.',
    category: 'no_results',
  },

  // Query & Processing
  [ErrorCode.INVALID_QUERY]: {
    code: ErrorCode.INVALID_QUERY,
    httpStatus: 400,
    technicalMessage: 'Query validation failed',
    userMessage: 'Unable to process your query.',
    recoverySuggestion: 'Please rephrase your question and try again.',
    category: 'validation',
  },

  [ErrorCode.QUERY_TOO_BROAD]: {
    code: ErrorCode.QUERY_TOO_BROAD,
    httpStatus: 400,
    technicalMessage: 'Query is too broad to process effectively',
    userMessage: 'Your query is too general.',
    recoverySuggestion: 'Try being more specific about what information you need.',
    category: 'validation',
  },

  [ErrorCode.QUERY_TOO_SPECIFIC]: {
    code: ErrorCode.QUERY_TOO_SPECIFIC,
    httpStatus: 400,
    technicalMessage: 'Query is too specific, no matching results',
    userMessage: 'No exact matches found for your specific query.',
    recoverySuggestion: 'Try broadening your search or using different keywords.',
    category: 'validation',
  },

  [ErrorCode.EMPTY_QUERY]: {
    code: ErrorCode.EMPTY_QUERY,
    httpStatus: 400,
    technicalMessage: 'Query text is empty or missing',
    userMessage: 'Please enter a question.',
    recoverySuggestion: 'Type your question and try again.',
    category: 'validation',
  },

  // Retrieval
  [ErrorCode.RETRIEVAL_FAILED]: {
    code: ErrorCode.RETRIEVAL_FAILED,
    httpStatus: 500,
    technicalMessage: 'Failed to retrieve relevant documents',
    userMessage: 'Unable to search medical records at this time.',
    recoverySuggestion: 'Please try again in a moment.',
    category: 'retrieval',
  },

  [ErrorCode.VECTOR_DB_ERROR]: {
    code: ErrorCode.VECTOR_DB_ERROR,
    httpStatus: 500,
    technicalMessage: 'Vector database connection error',
    userMessage: 'Search service is temporarily unavailable.',
    recoverySuggestion: 'Please try again in a few minutes.',
    category: 'retrieval',
  },

  [ErrorCode.LOW_RELEVANCE]: {
    code: ErrorCode.LOW_RELEVANCE,
    httpStatus: 200,
    technicalMessage: 'Retrieved documents have low relevance scores',
    userMessage: 'Found limited relevant information for your query.',
    recoverySuggestion: 'Try rephrasing your question or providing more context.',
    category: 'retrieval',
  },

  // Answer Generation
  [ErrorCode.GENERATION_FAILED]: {
    code: ErrorCode.GENERATION_FAILED,
    httpStatus: 500,
    technicalMessage: 'Answer generation failed',
    userMessage: 'Unable to generate a response at this time.',
    recoverySuggestion: 'Please try again. If the issue continues, contact support.',
    category: 'generation',
  },

  [ErrorCode.EXTRACTION_FAILED]: {
    code: ErrorCode.EXTRACTION_FAILED,
    httpStatus: 500,
    technicalMessage: 'LLM extraction returned invalid response',
    userMessage: 'Unable to analyze the records at this time.',
    recoverySuggestion: 'Please try again. If the issue continues, contact support.',
    category: 'generation',
  },

  [ErrorCode.LLM_ERROR]: {
    code: ErrorCode.LLM_ERROR,
    httpStatus: 500,
    technicalMessage: 'LLM API error',
    userMessage: 'AI service is experiencing issues.',
    recoverySuggestion: 'Please try again in a few moments.',
    category: 'generation',
  },

  [ErrorCode.LLM_QUOTA_EXCEEDED]: {
    code: ErrorCode.LLM_QUOTA_EXCEEDED,
    httpStatus: 429,
    technicalMessage: 'LLM API quota exceeded',
    userMessage: 'Service capacity reached.',
    recoverySuggestion: 'Please try again later or contact support.',
    category: 'rate_limit',
  },

  // Validation
  [ErrorCode.VALIDATION_FAILED]: {
    code: ErrorCode.VALIDATION_FAILED,
    httpStatus: 400,
    technicalMessage: 'Input validation failed',
    userMessage: 'The information provided is invalid.',
    recoverySuggestion: 'Please check your input and try again.',
    category: 'validation',
  },

  [ErrorCode.CITATION_VALIDATION_FAILED]: {
    code: ErrorCode.CITATION_VALIDATION_FAILED,
    httpStatus: 500,
    technicalMessage: 'Citation validation failed',
    userMessage: 'Unable to verify source citations.',
    recoverySuggestion: 'Please try again or contact support if the issue persists.',
    category: 'validation',
  },

  [ErrorCode.CONFIDENCE_TOO_LOW]: {
    code: ErrorCode.CONFIDENCE_TOO_LOW,
    httpStatus: 200,
    technicalMessage: 'Confidence score below threshold',
    userMessage: 'Unable to provide a confident answer.',
    recoverySuggestion:
      'Try asking a more specific question or consult a healthcare professional.',
    category: 'confidence',
  },

  // Rate Limiting & Performance
  [ErrorCode.RATE_LIMIT]: {
    code: ErrorCode.RATE_LIMIT,
    httpStatus: 429,
    technicalMessage: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment.',
    recoverySuggestion: 'Try again in 60 seconds.',
    category: 'rate_limit',
  },

  [ErrorCode.TIMEOUT]: {
    code: ErrorCode.TIMEOUT,
    httpStatus: 504,
    technicalMessage: 'Request exceeded timeout limit',
    userMessage: 'Your query is taking longer than expected.',
    recoverySuggestion: 'Please try again or simplify your query.',
    category: 'timeout',
  },

  [ErrorCode.REQUEST_TOO_LARGE]: {
    code: ErrorCode.REQUEST_TOO_LARGE,
    httpStatus: 413,
    technicalMessage: 'Request payload too large',
    userMessage: 'Your request is too large to process.',
    recoverySuggestion: 'Try breaking your question into smaller parts.',
    category: 'validation',
  },

  // Server & Service
  [ErrorCode.SERVER_ERROR]: {
    code: ErrorCode.SERVER_ERROR,
    httpStatus: 500,
    technicalMessage: 'Internal server error',
    userMessage: 'Something went wrong on our end.',
    recoverySuggestion: 'Please try again later. Our team has been notified.',
    category: 'server_error',
  },

  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    httpStatus: 503,
    technicalMessage: 'Service temporarily unavailable',
    userMessage: 'The service is temporarily unavailable.',
    recoverySuggestion: 'Please try again in a few minutes.',
    category: 'service_unavailable',
  },

  [ErrorCode.DATABASE_ERROR]: {
    code: ErrorCode.DATABASE_ERROR,
    httpStatus: 500,
    technicalMessage: 'Database connection error',
    userMessage: 'Unable to access the database.',
    recoverySuggestion: 'Please try again. If the issue persists, contact support.',
    category: 'server_error',
  },

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    code: ErrorCode.EXTERNAL_SERVICE_ERROR,
    httpStatus: 502,
    technicalMessage: 'External service error',
    userMessage: 'A required service is currently unavailable.',
    recoverySuggestion: 'Please try again in a few moments.',
    category: 'server_error',
  },
};

/**
 * Error Catalog Class
 *
 * Centralized catalog of error messages
 */
class ErrorCatalog {
  /**
   * Get error template by code
   *
   * @param code - Error code
   * @returns Error template
   */
  getTemplate(code: ErrorCode): ErrorTemplate {
    const template = ERROR_TEMPLATES[code];

    if (!template) {
      // Fallback to generic server error if code not found
      return ERROR_TEMPLATES[ErrorCode.SERVER_ERROR];
    }

    return template;
  }

  /**
   * Format error response from error code
   *
   * @param code - Error code
   * @param context - Optional context (e.g., patient_id, query_id)
   * @returns Error response
   */
  formatError(code: ErrorCode, context?: any): ErrorResponse {
    const template = this.getTemplate(code);

    return {
      success: false,
      error: {
        code: template.code,
        message: template.technicalMessage,
        user_message: template.userMessage,
        details: context
          ? {
              ...context,
              recovery_suggestion: template.recoverySuggestion,
            }
          : {
              recovery_suggestion: template.recoverySuggestion,
            },
      },
      timestamp: new Date().toISOString(),
      query_id: context?.query_id,
    };
  }

  /**
   * Get all error codes
   *
   * @returns Array of error codes
   */
  getAllErrorCodes(): ErrorCode[] {
    return Object.values(ErrorCode);
  }

  /**
   * Get error codes by category
   *
   * @param category - Error category
   * @returns Array of error codes in category
   */
  getErrorCodesByCategory(category: string): ErrorCode[] {
    return this.getAllErrorCodes().filter(code => {
      const template = this.getTemplate(code);
      return template.category === category;
    });
  }

  /**
   * Get error codes by HTTP status
   *
   * @param httpStatus - HTTP status code
   * @returns Array of error codes with that status
   */
  getErrorCodesByStatus(httpStatus: number): ErrorCode[] {
    return this.getAllErrorCodes().filter(code => {
      const template = this.getTemplate(code);
      return template.httpStatus === httpStatus;
    });
  }

  /**
   * Check if error code exists
   *
   * @param code - Error code to check
   * @returns True if exists
   */
  hasErrorCode(code: string): code is ErrorCode {
    return Object.values(ErrorCode).includes(code as ErrorCode);
  }

  /**
   * Get recovery suggestion for error code
   *
   * @param code - Error code
   * @returns Recovery suggestion
   */
  getRecoverySuggestion(code: ErrorCode): string {
    const template = this.getTemplate(code);
    return template.recoverySuggestion;
  }

  /**
   * Get user message for error code
   *
   * @param code - Error code
   * @returns User-friendly message
   */
  getUserMessage(code: ErrorCode): string {
    const template = this.getTemplate(code);
    return template.userMessage;
  }

  /**
   * Get HTTP status for error code
   *
   * @param code - Error code
   * @returns HTTP status code
   */
  getHTTPStatus(code: ErrorCode): number {
    const template = this.getTemplate(code);
    return template.httpStatus;
  }

  /**
   * Get error statistics
   *
   * @returns Error statistics
   */
  getStatistics() {
    const codes = this.getAllErrorCodes();
    const byCategory: Record<string, number> = {};
    const byStatus: Record<number, number> = {};

    codes.forEach(code => {
      const template = this.getTemplate(code);

      // Count by category
      if (template.category) {
        byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      }

      // Count by status
      byStatus[template.httpStatus] = (byStatus[template.httpStatus] || 0) + 1;
    });

    return {
      total_error_codes: codes.length,
      by_category: byCategory,
      by_status: byStatus,
    };
  }

  /**
   * Explain error catalog
   *
   * @returns Explanation string
   */
  explain(): string {
    const stats = this.getStatistics();

    return `Error Message Catalog:

Total Error Codes: ${stats.total_error_codes}

By Category:
${Object.entries(stats.by_category)
  .map(([category, count]) => `  - ${category}: ${count} errors`)
  .join('\n')}

By HTTP Status:
${Object.entries(stats.by_status)
  .map(([status, count]) => `  - ${status}: ${count} errors`)
  .join('\n')}

Each error template includes:
- Error code (unique identifier)
- HTTP status code
- Technical message (for logging)
- User-friendly message
- Recovery suggestion
- Category (optional)

Usage:
  const template = errorCatalog.getTemplate(ErrorCode.PATIENT_NOT_FOUND);
  const errorResponse = errorCatalog.formatError(ErrorCode.TIMEOUT, { query_id: '123' });`;
  }
}

// Export singleton instance
const errorCatalog = new ErrorCatalog();
export default errorCatalog;
