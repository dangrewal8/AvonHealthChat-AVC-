/**
 * Error Catalog Usage Examples
 *
 * Demonstrates:
 * - Getting error templates
 * - Formatting error responses
 * - Error code lookup
 * - Category filtering
 * - HTTP status mapping
 * - Recovery suggestions
 */

import errorCatalog, { ErrorCode } from '../services/error-catalog.service';

/**
 * Example 1: Get error template
 */
export function exampleGetTemplate() {
  console.log('Example 1: Get Error Template');
  console.log('-'.repeat(80));

  const template = errorCatalog.getTemplate(ErrorCode.PATIENT_NOT_FOUND);

  console.log('  Template for PATIENT_NOT_FOUND:\n');
  console.log(`    Code: ${template.code}`);
  console.log(`    HTTP Status: ${template.httpStatus}`);
  console.log(`    Technical Message: ${template.technicalMessage}`);
  console.log(`    User Message: ${template.userMessage}`);
  console.log(`    Recovery Suggestion: ${template.recoverySuggestion}`);
  console.log(`    Category: ${template.category}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Format error response
 */
export function exampleFormatError() {
  console.log('Example 2: Format Error Response');
  console.log('-'.repeat(80));

  const errorResponse = errorCatalog.formatError(ErrorCode.TIMEOUT, {
    query_id: 'query_123',
    patient_id: 'patient_456',
  });

  console.log('  Formatted error response:\n');
  console.log(JSON.stringify(errorResponse, null, 2).split('\n').map(line => `    ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 3: Get all error codes
 */
export function exampleGetAllErrorCodes() {
  console.log('Example 3: Get All Error Codes');
  console.log('-'.repeat(80));

  const allCodes = errorCatalog.getAllErrorCodes();

  console.log(`  Total error codes: ${allCodes.length}\n`);
  console.log('  Error codes:\n');
  allCodes.forEach(code => {
    console.log(`    - ${code}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Get error codes by category
 */
export function exampleGetByCategory() {
  console.log('Example 4: Get Error Codes by Category');
  console.log('-'.repeat(80));

  const categories = ['authentication', 'validation', 'retrieval', 'generation'];

  console.log('  Error codes by category:\n');
  categories.forEach(category => {
    const codes = errorCatalog.getErrorCodesByCategory(category);
    console.log(`    ${category} (${codes.length} errors):`);
    codes.forEach(code => {
      console.log(`      - ${code}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Get error codes by HTTP status
 */
export function exampleGetByStatus() {
  console.log('Example 5: Get Error Codes by HTTP Status');
  console.log('-'.repeat(80));

  const statuses = [400, 401, 404, 429, 500, 503];

  console.log('  Error codes by HTTP status:\n');
  statuses.forEach(status => {
    const codes = errorCatalog.getErrorCodesByStatus(status);
    console.log(`    ${status} (${codes.length} errors):`);
    codes.forEach(code => {
      console.log(`      - ${code}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Check if error code exists
 */
export function exampleHasErrorCode() {
  console.log('Example 6: Check if Error Code Exists');
  console.log('-'.repeat(80));

  const testCodes = ['PATIENT_NOT_FOUND', 'INVALID_CODE', 'TIMEOUT', 'FAKE_ERROR'];

  console.log('  Checking error codes:\n');
  testCodes.forEach(code => {
    const exists = errorCatalog.hasErrorCode(code);
    console.log(`    ${code}: ${exists ? '✅ Exists' : '❌ Not found'}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Get recovery suggestion
 */
export function exampleGetRecoverySuggestion() {
  console.log('Example 7: Get Recovery Suggestion');
  console.log('-'.repeat(80));

  const errorCodes = [
    ErrorCode.AUTH_FAILED,
    ErrorCode.RATE_LIMIT,
    ErrorCode.NO_RESULTS_FOUND,
    ErrorCode.TIMEOUT,
  ];

  console.log('  Recovery suggestions:\n');
  errorCodes.forEach(code => {
    const suggestion = errorCatalog.getRecoverySuggestion(code);
    console.log(`    ${code}:`);
    console.log(`      ${suggestion}\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Get user message
 */
export function exampleGetUserMessage() {
  console.log('Example 8: Get User Message');
  console.log('-'.repeat(80));

  const errorCodes = [
    ErrorCode.PATIENT_NOT_FOUND,
    ErrorCode.INVALID_QUERY,
    ErrorCode.EXTRACTION_FAILED,
    ErrorCode.SERVICE_UNAVAILABLE,
  ];

  console.log('  User-friendly messages:\n');
  errorCodes.forEach(code => {
    const message = errorCatalog.getUserMessage(code);
    console.log(`    ${code}:`);
    console.log(`      "${message}"\n`);
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Get HTTP status
 */
export function exampleGetHTTPStatus() {
  console.log('Example 9: Get HTTP Status');
  console.log('-'.repeat(80));

  const errorCodes = [
    ErrorCode.AUTH_FAILED,
    ErrorCode.PATIENT_NOT_FOUND,
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.TIMEOUT,
    ErrorCode.SERVER_ERROR,
  ];

  console.log('  HTTP status codes:\n');
  errorCodes.forEach(code => {
    const status = errorCatalog.getHTTPStatus(code);
    console.log(`    ${code}: ${status}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Authentication errors
 */
export function exampleAuthenticationErrors() {
  console.log('Example 10: Authentication Errors');
  console.log('-'.repeat(80));

  const authErrors = [
    ErrorCode.AUTH_FAILED,
    ErrorCode.TOKEN_EXPIRED,
    ErrorCode.INSUFFICIENT_PERMISSIONS,
  ];

  console.log('  Authentication error responses:\n');
  authErrors.forEach(code => {
    const response = errorCatalog.formatError(code, { user_id: 'user_123' });
    console.log(`    ${code}:`);
    console.log(`      User Message: "${response.error.user_message}"`);
    console.log(`      HTTP Status: ${errorCatalog.getHTTPStatus(code)}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Query & retrieval errors
 */
export function exampleQueryErrors() {
  console.log('Example 11: Query & Retrieval Errors');
  console.log('-'.repeat(80));

  const queryErrors = [
    ErrorCode.EMPTY_QUERY,
    ErrorCode.INVALID_QUERY,
    ErrorCode.QUERY_TOO_BROAD,
    ErrorCode.RETRIEVAL_FAILED,
  ];

  console.log('  Query error responses:\n');
  queryErrors.forEach(code => {
    const template = errorCatalog.getTemplate(code);
    console.log(`    ${code}:`);
    console.log(`      User: "${template.userMessage}"`);
    console.log(`      Suggestion: "${template.recoverySuggestion}"`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Generation errors
 */
export function exampleGenerationErrors() {
  console.log('Example 12: Generation Errors');
  console.log('-'.repeat(80));

  const genErrors = [
    ErrorCode.GENERATION_FAILED,
    ErrorCode.EXTRACTION_FAILED,
    ErrorCode.LLM_ERROR,
    ErrorCode.LLM_QUOTA_EXCEEDED,
  ];

  console.log('  Generation error responses:\n');
  genErrors.forEach(code => {
    const response = errorCatalog.formatError(code, { query_id: 'query_123' });
    console.log(`    ${code}:`);
    console.log(`      ${response.error.user_message}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 13: No results scenario
 */
export function exampleNoResults() {
  console.log('Example 13: No Results Scenario');
  console.log('-'.repeat(80));

  const noResultsCodes = [
    ErrorCode.NO_RESULTS_FOUND,
    ErrorCode.LOW_RELEVANCE,
    ErrorCode.CONFIDENCE_TOO_LOW,
  ];

  console.log('  No results scenarios:\n');
  noResultsCodes.forEach(code => {
    const template = errorCatalog.getTemplate(code);
    console.log(`    ${code}:`);
    console.log(`      HTTP Status: ${template.httpStatus} (${template.httpStatus === 200 ? 'Success with no results' : 'Error'})`);
    console.log(`      User Message: "${template.userMessage}"`);
    console.log(`      Suggestion: "${template.recoverySuggestion}"`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 14: Rate limit & timeout
 */
export function exampleRateLimitTimeout() {
  console.log('Example 14: Rate Limit & Timeout');
  console.log('-'.repeat(80));

  const codes = [ErrorCode.RATE_LIMIT, ErrorCode.TIMEOUT];

  console.log('  Rate limit & timeout errors:\n');
  codes.forEach(code => {
    const response = errorCatalog.formatError(code, {
      query_id: 'query_123',
      retry_after: code === ErrorCode.RATE_LIMIT ? 60 : undefined,
    });
    console.log(`    ${code}:`);
    console.log(JSON.stringify(response, null, 2).split('\n').map(line => `      ${line}`).join('\n'));
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 15: Server errors
 */
export function exampleServerErrors() {
  console.log('Example 15: Server Errors');
  console.log('-'.repeat(80));

  const serverErrors = [
    ErrorCode.SERVER_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
  ];

  console.log('  Server error messages:\n');
  serverErrors.forEach(code => {
    const template = errorCatalog.getTemplate(code);
    console.log(`    ${code} (${template.httpStatus}):`);
    console.log(`      Technical: ${template.technicalMessage}`);
    console.log(`      User: ${template.userMessage}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 16: Error statistics
 */
export function exampleGetStatistics() {
  console.log('Example 16: Error Statistics');
  console.log('-'.repeat(80));

  const stats = errorCatalog.getStatistics();

  console.log('  Error catalog statistics:\n');
  console.log(`    Total error codes: ${stats.total_error_codes}\n`);

  console.log('    By category:');
  Object.entries(stats.by_category).forEach(([category, count]) => {
    console.log(`      - ${category}: ${count} errors`);
  });

  console.log('\n    By HTTP status:');
  Object.entries(stats.by_status).forEach(([status, count]) => {
    console.log(`      - ${status}: ${count} errors`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 17: Complete error handling flow
 */
export function exampleCompleteFlow() {
  console.log('Example 17: Complete Error Handling Flow');
  console.log('-'.repeat(80));

  console.log('  Simulating query processing with errors:\n');

  // Step 1: Empty query check
  console.log('    1. Check for empty query...');
  const queryText = '';
  if (!queryText) {
    const error = errorCatalog.formatError(ErrorCode.EMPTY_QUERY, {
      query_id: 'query_123',
    });
    console.log(`       ❌ ${error.error.user_message}`);
    console.log(`       Suggestion: ${error.error.details.recovery_suggestion}\n`);
    return;
  }

  // Step 2: Patient lookup
  console.log('    2. Looking up patient...');
  const patientFound = false;
  if (!patientFound) {
    const error = errorCatalog.formatError(ErrorCode.PATIENT_NOT_FOUND, {
      query_id: 'query_123',
      patient_id: 'patient_456',
    });
    console.log(`       ❌ ${error.error.user_message}`);
    console.log(`       Suggestion: ${error.error.details.recovery_suggestion}\n`);
    return;
  }

  console.log('  (Flow would continue with retrieval, generation, etc.)\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 18: Explain error catalog
 */
export function exampleExplain() {
  console.log('Example 18: Explain Error Catalog');
  console.log('-'.repeat(80));

  const explanation = errorCatalog.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('ERROR CATALOG EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleGetTemplate();
    exampleFormatError();
    exampleGetAllErrorCodes();
    exampleGetByCategory();
    exampleGetByStatus();
    exampleHasErrorCode();
    exampleGetRecoverySuggestion();
    exampleGetUserMessage();
    exampleGetHTTPStatus();
    exampleAuthenticationErrors();
    exampleQueryErrors();
    exampleGenerationErrors();
    exampleNoResults();
    exampleRateLimitTimeout();
    exampleServerErrors();
    exampleGetStatistics();
    exampleCompleteFlow();
    exampleExplain();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
