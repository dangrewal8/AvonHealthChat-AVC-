"use strict";
/**
 * Retry Manager Usage Examples
 *
 * Demonstrates:
 * - Basic retry with exponential backoff
 * - Retryable error detection
 * - Circuit breaker states
 * - Fallback strategies
 * - Integration with async functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicRetry = exampleBasicRetry;
exports.exampleExponentialBackoff = exampleExponentialBackoff;
exports.exampleRetryableErrors = exampleRetryableErrors;
exports.exampleCustomOptions = exampleCustomOptions;
exports.exampleCircuitBreakerClosed = exampleCircuitBreakerClosed;
exports.exampleCircuitBreakerOpen = exampleCircuitBreakerOpen;
exports.exampleFallbackRetrievalOnly = exampleFallbackRetrievalOnly;
exports.exampleFallbackKeywordSearch = exampleFallbackKeywordSearch;
exports.exampleFallbackSuggestRefinement = exampleFallbackSuggestRefinement;
exports.exampleWithFallback = exampleWithFallback;
exports.exampleRetryWithTimeout = exampleRetryWithTimeout;
exports.exampleNonRetryableError = exampleNonRetryableError;
exports.exampleAsyncIntegration = exampleAsyncIntegration;
exports.exampleRealWorldLLM = exampleRealWorldLLM;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const retry_manager_service_1 = __importDefault(require("../services/retry-manager.service"));
/**
 * Example 1: Basic retry
 */
async function exampleBasicRetry() {
    console.log('Example 1: Basic Retry');
    console.log('-'.repeat(80));
    let attemptCount = 0;
    try {
        const result = await retry_manager_service_1.default.retry(async () => {
            attemptCount++;
            console.log(`  Attempt ${attemptCount}...`);
            if (attemptCount < 3) {
                throw new Error('ETIMEDOUT');
            }
            return 'Success!';
        });
        console.log('\n  Result:', result.result);
        console.log('  Total attempts:', result.attempts);
        console.log('  Total time:', result.totalTimeMs, 'ms');
        console.log('  Errors encountered:', result.errors.length);
        console.log('\n  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
}
/**
 * Example 2: Exponential backoff
 */
async function exampleExponentialBackoff() {
    console.log('Example 2: Exponential Backoff');
    console.log('-'.repeat(80));
    const delays = [];
    for (let i = 0; i < 5; i++) {
        const delay = retry_manager_service_1.default.getBackoffDelay(i);
        delays.push(delay);
    }
    console.log('  Backoff delays:\n');
    console.log('    Attempt 1:', delays[0], 'ms');
    console.log('    Attempt 2:', delays[1], 'ms');
    console.log('    Attempt 3:', delays[2], 'ms');
    console.log('    Attempt 4:', delays[3], 'ms');
    console.log('    Attempt 5:', delays[4], 'ms');
    console.log('\n  Formula: backoffMs * (multiplier ^ (attempt - 1))');
    console.log('  Default: 1000ms * (2 ^ (attempt - 1))');
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Retryable errors
 */
async function exampleRetryableErrors() {
    console.log('Example 3: Retryable Errors');
    console.log('-'.repeat(80));
    const errors = [
        new Error('ECONNRESET'),
        new Error('ETIMEDOUT'),
        new Error('ENOTFOUND'),
        new Error('rate_limit exceeded'),
        new Error('Invalid input'),
        new Error('Not found'),
    ];
    console.log('  Testing error retryability:\n');
    errors.forEach(error => {
        const shouldRetry = retry_manager_service_1.default.shouldRetry(error);
        console.log(`    ${error.message}: ${shouldRetry ? 'RETRY' : 'FAIL'}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 4: Custom retry options
 */
async function exampleCustomOptions() {
    console.log('Example 4: Custom Retry Options');
    console.log('-'.repeat(80));
    let attemptCount = 0;
    try {
        const result = await retry_manager_service_1.default.retry(async () => {
            attemptCount++;
            console.log(`  Attempt ${attemptCount}...`);
            if (attemptCount < 5) {
                throw new Error('CUSTOM_ERROR');
            }
            return 'Success!';
        }, {
            maxAttempts: 5,
            backoffMs: 500,
            backoffMultiplier: 1.5,
            retryableErrors: ['CUSTOM_ERROR'],
        });
        console.log('\n  Result:', result.result);
        console.log('  Total attempts:', result.attempts);
        console.log('\n  ✅ Success (custom options)\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
}
/**
 * Example 5: Circuit breaker - closed state
 */
async function exampleCircuitBreakerClosed() {
    console.log('Example 5: Circuit Breaker - Closed State');
    console.log('-'.repeat(80));
    // Reset circuit breaker
    retry_manager_service_1.default.resetCircuitBreaker();
    console.log('  Initial state:', retry_manager_service_1.default.getCircuitState());
    // Successful execution
    try {
        await retry_manager_service_1.default.retry(async () => {
            return 'Success!';
        });
        console.log('  After success:', retry_manager_service_1.default.getCircuitState());
        console.log('\n  ✅ Success (circuit closed)\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
}
/**
 * Example 6: Circuit breaker - open state
 */
async function exampleCircuitBreakerOpen() {
    console.log('Example 6: Circuit Breaker - Open State');
    console.log('-'.repeat(80));
    // Reset circuit breaker
    retry_manager_service_1.default.resetCircuitBreaker();
    console.log('  Initial state:', retry_manager_service_1.default.getCircuitState());
    // Trigger 5 failures to open circuit
    console.log('\n  Triggering 5 failures...\n');
    for (let i = 0; i < 5; i++) {
        try {
            await retry_manager_service_1.default.retry(async () => {
                throw new Error('Service unavailable');
            }, { maxAttempts: 1 });
        }
        catch (error) {
            console.log(`    Failure ${i + 1}/5`);
        }
    }
    console.log('\n  Circuit state:', retry_manager_service_1.default.getCircuitState());
    // Try to execute - should fail immediately
    try {
        await retry_manager_service_1.default.retry(async () => {
            return 'Success!';
        });
    }
    catch (error) {
        const err = error;
        console.log('  Circuit opened - request blocked:', err.message);
    }
    console.log('\n  ✅ Success (circuit opened)\n');
}
/**
 * Example 7: Fallback - retrieval only
 */
async function exampleFallbackRetrievalOnly() {
    console.log('Example 7: Fallback - Retrieval Only');
    console.log('-'.repeat(80));
    const retrievalResults = {
        candidates: [
            {
                chunk_id: 'chunk_001',
                chunk_text: 'Patient prescribed ibuprofen 400 mg q6h PRN.',
                score: 0.92,
                artifact_id: 'note_123',
            },
            {
                chunk_id: 'chunk_002',
                chunk_text: 'Continue current medications.',
                score: 0.87,
                artifact_id: 'note_124',
            },
        ],
    };
    const fallbackResponse = retry_manager_service_1.default.fallbackRetrievalOnly(retrievalResults);
    console.log('  Fallback response:\n');
    console.log('    Short answer:', fallbackResponse.shortAnswer);
    console.log('    Strategy:', fallbackResponse.metadata.strategy);
    console.log('    Reason:', fallbackResponse.metadata.reason);
    console.log('\n  ✅ Success (fallback to retrieval)\n');
}
/**
 * Example 8: Fallback - keyword search
 */
async function exampleFallbackKeywordSearch() {
    console.log('Example 8: Fallback - Keyword Search');
    console.log('-'.repeat(80));
    const query = 'What medications is the patient taking?';
    const fallbackResults = retry_manager_service_1.default.fallbackKeywordSearch(query);
    console.log('  Query:', query);
    console.log('\n  Fallback results:\n');
    console.log('    Candidates:', fallbackResults.candidates.length);
    console.log('    First result:', fallbackResults.candidates[0].chunk_text);
    console.log('    Strategy:', fallbackResults.metadata.strategy);
    console.log('\n  ✅ Success (fallback to keyword search)\n');
}
/**
 * Example 9: Fallback - suggest refinement
 */
async function exampleFallbackSuggestRefinement() {
    console.log('Example 9: Fallback - Suggest Refinement');
    console.log('-'.repeat(80));
    const query = 'xyz123 test query';
    const fallbackResponse = retry_manager_service_1.default.fallbackSuggestRefinement(query);
    console.log('  Query:', query);
    console.log('\n  Fallback response:\n');
    console.log('    Short answer:', fallbackResponse.shortAnswer);
    console.log('    Suggestions:');
    console.log('      ' + fallbackResponse.detailedSummary.split('\n').join('\n      '));
    console.log('\n    Strategy:', fallbackResponse.metadata.strategy);
    console.log('\n  ✅ Success (suggest refinement)\n');
}
/**
 * Example 10: With fallback function
 */
async function exampleWithFallback() {
    console.log('Example 10: With Fallback Function');
    console.log('-'.repeat(80));
    const primaryFn = async () => {
        throw new Error('Primary service unavailable');
    };
    const fallbackFn = async () => {
        return 'Fallback result';
    };
    const result = await retry_manager_service_1.default.withFallback(primaryFn, fallbackFn, 'RETURN_CACHED');
    console.log('  Result:', result.result);
    console.log('  Strategy:', result.strategy);
    console.log('  Reason:', result.reason);
    console.log('\n  ✅ Success (fallback executed)\n');
}
/**
 * Example 11: Retry with timeout
 */
async function exampleRetryWithTimeout() {
    console.log('Example 11: Retry with Timeout');
    console.log('-'.repeat(80));
    let attemptCount = 0;
    try {
        const result = await retry_manager_service_1.default.retry(async () => {
            attemptCount++;
            console.log(`  Attempt ${attemptCount}...`);
            // Simulate timeout on first 2 attempts
            if (attemptCount < 3) {
                throw new Error('timeout: Request took too long');
            }
            return 'Success!';
        });
        console.log('\n  Result:', result.result);
        console.log('  Total attempts:', result.attempts);
        console.log('\n  ✅ Success (timeout recovered)\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
}
/**
 * Example 12: Non-retryable error
 */
async function exampleNonRetryableError() {
    console.log('Example 12: Non-Retryable Error');
    console.log('-'.repeat(80));
    let attemptCount = 0;
    try {
        await retry_manager_service_1.default.retry(async () => {
            attemptCount++;
            console.log(`  Attempt ${attemptCount}...`);
            // Non-retryable error
            throw new Error('Invalid input');
        });
    }
    catch (error) {
        const err = error;
        console.log('\n  Failed immediately (non-retryable error)');
        console.log('  Error:', err.message);
        console.log('  Attempts:', attemptCount);
    }
    console.log('\n  ✅ Success (non-retryable detected)\n');
}
/**
 * Example 13: Integration with async operations
 */
async function exampleAsyncIntegration() {
    console.log('Example 13: Integration with Async Operations');
    console.log('-'.repeat(80));
    // Simulate async operation that fails occasionally
    const unreliableAsyncOp = async () => {
        const random = Math.random();
        if (random < 0.7) {
            throw new Error('ETIMEDOUT');
        }
        return { data: 'Success!', timestamp: new Date().toISOString() };
    };
    try {
        const result = await retry_manager_service_1.default.retry(unreliableAsyncOp);
        console.log('  Result:', result.result.data);
        console.log('  Attempts:', result.attempts);
        console.log('  Time:', result.totalTimeMs, 'ms');
        console.log('\n  ✅ Success (async operation completed)\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
}
/**
 * Example 14: Real-world scenario - LLM generation
 */
async function exampleRealWorldLLM() {
    console.log('Example 14: Real-World Scenario - LLM Generation');
    console.log('-'.repeat(80));
    let attemptCount = 0;
    const generateWithLLM = async () => {
        attemptCount++;
        console.log(`  LLM attempt ${attemptCount}...`);
        // Simulate LLM timeout on first attempt
        if (attemptCount === 1) {
            throw new Error('rate_limit: Too many requests');
        }
        return {
            shortAnswer: 'The patient is taking ibuprofen 400 mg q6h PRN.',
            confidence: 0.9,
        };
    };
    try {
        const result = await retry_manager_service_1.default.retry(generateWithLLM, {
            maxAttempts: 3,
            backoffMs: 2000,
        });
        console.log('\n  LLM response:');
        console.log('    Answer:', result.result.shortAnswer);
        console.log('    Confidence:', result.result.confidence);
        console.log('    Attempts:', result.attempts);
        console.log('    Time:', result.totalTimeMs, 'ms');
        console.log('\n  ✅ Success (LLM generation with retry)\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
}
/**
 * Example 15: Explain retry manager
 */
function exampleExplain() {
    console.log('Example 15: Explain Retry Manager');
    console.log('-'.repeat(80));
    const explanation = retry_manager_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('RETRY MANAGER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await exampleBasicRetry();
        await exampleExponentialBackoff();
        await exampleRetryableErrors();
        await exampleCustomOptions();
        await exampleCircuitBreakerClosed();
        await exampleCircuitBreakerOpen();
        await exampleFallbackRetrievalOnly();
        await exampleFallbackKeywordSearch();
        await exampleFallbackSuggestRefinement();
        await exampleWithFallback();
        await exampleRetryWithTimeout();
        await exampleNonRetryableError();
        await exampleAsyncIntegration();
        await exampleRealWorldLLM();
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
//# sourceMappingURL=retry-manager.example.js.map