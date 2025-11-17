"use strict";
/**
 * Error Response Handler Usage Examples
 *
 * Demonstrates:
 * - Handling different error types
 * - User-friendly error messages
 * - Error categorization
 * - Error logging
 * - Express middleware integration
 * - Custom error creation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleAuthenticationError = exampleAuthenticationError;
exports.exampleAuthorizationError = exampleAuthorizationError;
exports.exampleRateLimitError = exampleRateLimitError;
exports.exampleTimeoutError = exampleTimeoutError;
exports.exampleNotFoundError = exampleNotFoundError;
exports.exampleValidationError = exampleValidationError;
exports.exampleServiceUnavailableError = exampleServiceUnavailableError;
exports.exampleGenericError = exampleGenericError;
exports.exampleFormatForUI = exampleFormatForUI;
exports.exampleGetStatusCode = exampleGetStatusCode;
exports.exampleCustomAppError = exampleCustomAppError;
exports.exampleIsOperationalError = exampleIsOperationalError;
exports.exampleCreateErrorResponse = exampleCreateErrorResponse;
exports.exampleTryCatchHandling = exampleTryCatchHandling;
exports.exampleExpressMiddleware = exampleExpressMiddleware;
exports.exampleErrorCategories = exampleErrorCategories;
exports.exampleEnvironmentModes = exampleEnvironmentModes;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const error_response_handler_service_1 = __importStar(require("../services/error-response-handler.service"));
/**
 * Example 1: Handle authentication error
 */
function exampleAuthenticationError() {
    console.log('Example 1: Handle Authentication Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.AuthenticationError('Invalid token');
    const context = {
        query_id: 'query_123',
        user_id: 'user_456',
        request_path: '/api/query',
        request_method: 'POST',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Authentication Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 2: Handle authorization error
 */
function exampleAuthorizationError() {
    console.log('Example 2: Handle Authorization Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.AuthorizationError('Insufficient permissions');
    const context = {
        query_id: 'query_124',
        user_id: 'user_789',
        patient_id: 'patient_456',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Authorization Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Handle rate limit error
 */
function exampleRateLimitError() {
    console.log('Example 3: Handle Rate Limit Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.RateLimitError('Rate limit of 100 requests/minute exceeded');
    const context = {
        user_id: 'user_456',
        ip_address: '192.168.1.100',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Rate Limit Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 4: Handle timeout error
 */
function exampleTimeoutError() {
    console.log('Example 4: Handle Timeout Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.TimeoutError('Vector database query timed out after 30s');
    const context = {
        query_id: 'query_125',
        patient_id: 'patient_456',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Timeout Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 5: Handle not found error
 */
function exampleNotFoundError() {
    console.log('Example 5: Handle Not Found Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.NotFoundError('Patient record not found');
    const context = {
        patient_id: 'patient_999',
        request_path: '/api/patients/patient_999',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Not Found Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 6: Handle validation error
 */
function exampleValidationError() {
    console.log('Example 6: Handle Validation Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.ValidationError('Query text is required');
    const context = {
        query_id: 'query_126',
        user_id: 'user_456',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Validation Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 7: Handle service unavailable error
 */
function exampleServiceUnavailableError() {
    console.log('Example 7: Handle Service Unavailable Error');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.ServiceUnavailableError('OpenAI API is currently unavailable');
    const context = {
        query_id: 'query_127',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Service Unavailable Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 8: Handle generic error
 */
function exampleGenericError() {
    console.log('Example 8: Handle Generic Error');
    console.log('-'.repeat(80));
    const error = new Error('Unexpected error occurred');
    const context = {
        query_id: 'query_128',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Generic Error Response (converted to AppError):\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 9: Format error for UI
 */
function exampleFormatForUI() {
    console.log('Example 9: Format Error for UI');
    console.log('-'.repeat(80));
    const errors = [
        new error_response_handler_service_1.AuthenticationError(),
        new error_response_handler_service_1.AuthorizationError(),
        new error_response_handler_service_1.RateLimitError(),
        new error_response_handler_service_1.TimeoutError(),
        new error_response_handler_service_1.NotFoundError(),
        new error_response_handler_service_1.ValidationError(),
    ];
    console.log('  User-friendly error messages:\n');
    errors.forEach(error => {
        const formatted = error_response_handler_service_1.default.formatForUI(error);
        console.log(`    ${formatted.title}:`);
        console.log(`      Message: ${formatted.message}`);
        console.log(`      Suggestion: ${formatted.suggestion}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Get HTTP status code
 */
function exampleGetStatusCode() {
    console.log('Example 10: Get HTTP Status Code');
    console.log('-'.repeat(80));
    const errors = [
        { error: new error_response_handler_service_1.AuthenticationError(), expected: 401 },
        { error: new error_response_handler_service_1.AuthorizationError(), expected: 403 },
        { error: new error_response_handler_service_1.ValidationError(), expected: 400 },
        { error: new error_response_handler_service_1.NotFoundError(), expected: 404 },
        { error: new error_response_handler_service_1.RateLimitError(), expected: 429 },
        { error: new error_response_handler_service_1.TimeoutError(), expected: 504 },
        { error: new error_response_handler_service_1.ServiceUnavailableError(), expected: 503 },
    ];
    console.log('  HTTP Status Codes:\n');
    errors.forEach(({ error, expected }) => {
        const statusCode = error_response_handler_service_1.default.getStatusCode(error);
        console.log(`    ${error.constructor.name}: ${statusCode} (expected: ${expected})`);
    });
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Create custom AppError
 */
function exampleCustomAppError() {
    console.log('Example 11: Create Custom AppError');
    console.log('-'.repeat(80));
    const error = new error_response_handler_service_1.AppError('Database connection failed', 500, 'DB_CONNECTION_FAILED', error_response_handler_service_1.ErrorCategory.SERVER_ERROR, false // Not operational
    );
    const context = {
        query_id: 'query_129',
    };
    const response = error_response_handler_service_1.default.handleError(error, context);
    console.log('  Custom AppError Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 12: Check operational error
 */
function exampleIsOperationalError() {
    console.log('Example 12: Check Operational Error');
    console.log('-'.repeat(80));
    const operationalError = new error_response_handler_service_1.ValidationError('Invalid input');
    const nonOperationalError = new error_response_handler_service_1.AppError('Fatal system error', 500, 'FATAL_ERROR', error_response_handler_service_1.ErrorCategory.SERVER_ERROR, false);
    console.log('  Operational Error Check:\n');
    console.log(`    ValidationError is operational: ${error_response_handler_service_1.default.isOperationalError(operationalError)}`);
    console.log(`    Fatal error is operational: ${error_response_handler_service_1.default.isOperationalError(nonOperationalError)}`);
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 13: Create error response directly
 */
function exampleCreateErrorResponse() {
    console.log('Example 13: Create Error Response Directly');
    console.log('-'.repeat(80));
    const response = error_response_handler_service_1.default.createErrorResponse('CUSTOM_ERROR', 'A custom error occurred', 'Something went wrong. Please try again.', 500, { query_id: 'query_130' });
    console.log('  Direct Error Response:\n');
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 14: Error handling in try-catch
 */
function exampleTryCatchHandling() {
    console.log('Example 14: Error Handling in Try-Catch');
    console.log('-'.repeat(80));
    console.log('  Simulating error scenarios:\n');
    // Scenario 1: Expected error
    try {
        throw new error_response_handler_service_1.ValidationError('Missing required field: patient_id');
    }
    catch (error) {
        const response = error_response_handler_service_1.default.handleError(error, {
            query_id: 'query_131',
        });
        console.log('    Scenario 1: Validation error handled');
        console.log(`    User message: "${response.error.user_message}"`);
    }
    console.log('');
    // Scenario 2: Unexpected error
    try {
        throw new Error('Unexpected database error');
    }
    catch (error) {
        const response = error_response_handler_service_1.default.handleError(error, {
            query_id: 'query_132',
        });
        console.log('    Scenario 2: Generic error converted to AppError');
        console.log(`    User message: "${response.error.user_message}"`);
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 15: Express middleware usage
 */
function exampleExpressMiddleware() {
    console.log('Example 15: Express Middleware Usage');
    console.log('-'.repeat(80));
    console.log('  Express middleware setup:\n');
    console.log('    const errorMiddleware = errorResponseHandler.expressMiddleware();');
    console.log('    app.use(errorMiddleware);\n');
    console.log('  Example route with error handling:\n');
    console.log('    app.get("/api/query", async (req, res, next) => {');
    console.log('      try {');
    console.log('        // Process query');
    console.log('        const result = await processQuery(req.body);');
    console.log('        res.json(result);');
    console.log('      } catch (error) {');
    console.log('        next(error); // Passes to error middleware');
    console.log('      }');
    console.log('    });\n');
    console.log('  Error middleware will:');
    console.log('    - Extract context from request');
    console.log('    - Handle and format error');
    console.log('    - Send appropriate HTTP status code');
    console.log('    - Return user-friendly error response\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 16: Error categories
 */
function exampleErrorCategories() {
    console.log('Example 16: Error Categories');
    console.log('-'.repeat(80));
    console.log('  Available error categories:\n');
    Object.values(error_response_handler_service_1.ErrorCategory).forEach(category => {
        console.log(`    - ${category}`);
    });
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 17: Production vs Development mode
 */
function exampleEnvironmentModes() {
    console.log('Example 17: Production vs Development Mode');
    console.log('-'.repeat(80));
    const error = new Error('Database connection failed');
    error.stack = 'Error: Database connection failed\n    at somewhere...';
    console.log('  Current environment:', process.env.NODE_ENV || 'development');
    console.log('');
    const response = error_response_handler_service_1.default.handleError(error, {
        query_id: 'query_133',
    });
    console.log('  Error response details level:\n');
    if (response.error.details) {
        console.log('    Details included (development mode)');
        console.log(JSON.stringify(response.error.details, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
    }
    else {
        console.log('    Minimal details (production mode)');
    }
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 18: Explain error handler
 */
function exampleExplain() {
    console.log('Example 18: Explain Error Handler');
    console.log('-'.repeat(80));
    const explanation = error_response_handler_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('ERROR RESPONSE HANDLER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleAuthenticationError();
        exampleAuthorizationError();
        exampleRateLimitError();
        exampleTimeoutError();
        exampleNotFoundError();
        exampleValidationError();
        exampleServiceUnavailableError();
        exampleGenericError();
        exampleFormatForUI();
        exampleGetStatusCode();
        exampleCustomAppError();
        exampleIsOperationalError();
        exampleCreateErrorResponse();
        exampleTryCatchHandling();
        exampleExpressMiddleware();
        exampleErrorCategories();
        exampleEnvironmentModes();
        exampleExplain();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=error-response-handler.example.js.map