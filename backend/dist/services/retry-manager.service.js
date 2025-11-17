"use strict";
/**
 * Retry Manager Service
 *
 * Implement retry and fallback logic for resilient pipeline execution.
 *
 * Features:
 * - Exponential backoff retry
 * - Retryable error detection
 * - Fallback strategies
 * - Circuit breaker integration
 * - Performance monitoring
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Retry Manager Class
 *
 * Manages retry logic with exponential backoff
 */
class RetryManager {
    /**
     * Default retry options
     */
    DEFAULT_OPTIONS = {
        maxAttempts: 3,
        backoffMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'rate_limit', 'timeout'],
    };
    /**
     * Circuit breaker state
     */
    circuitState = 'CLOSED';
    /**
     * Circuit breaker failure count
     */
    failureCount = 0;
    /**
     * Circuit breaker success count (in HALF_OPEN state)
     */
    successCount = 0;
    /**
     * Circuit breaker open timestamp
     */
    circuitOpenedAt = null;
    /**
     * Circuit breaker options
     */
    circuitBreakerOptions = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000, // 1 minute
    };
    /**
     * Retry a function with exponential backoff
     *
     * @param fn - Function to retry
     * @param options - Retry options
     * @returns Promise with result
     */
    async retry(fn, options = {}) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const errors = [];
        const startTime = Date.now();
        // Check circuit breaker
        if (this.circuitState === 'OPEN') {
            const timeOpen = Date.now() - (this.circuitOpenedAt || 0);
            if (timeOpen < this.circuitBreakerOptions.timeout) {
                throw new Error('CIRCUIT_OPEN: Service temporarily unavailable');
            }
            else {
                // Try to close circuit
                this.circuitState = 'HALF_OPEN';
                this.successCount = 0;
            }
        }
        for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
            try {
                // Wait for backoff delay (except first attempt)
                if (attempt > 1) {
                    const delay = this.getBackoffDelay(attempt - 1, opts);
                    await this.sleep(delay);
                }
                // Execute function
                const result = await fn();
                // Success - update circuit breaker
                this.handleSuccess();
                return {
                    result,
                    attempts: attempt,
                    totalTimeMs: Date.now() - startTime,
                    errors,
                };
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push(err);
                // Check if should retry
                const shouldRetry = this.shouldRetry(err, opts);
                if (!shouldRetry || attempt === opts.maxAttempts) {
                    // Final failure - update circuit breaker
                    this.handleFailure();
                    throw new Error(`Failed after ${attempt} attempts: ${err.message}`);
                }
                // Log retry attempt
                console.log(`[RETRY] Attempt ${attempt}/${opts.maxAttempts} failed: ${err.message}`);
            }
        }
        // Should never reach here
        throw new Error('Retry logic error');
    }
    /**
     * Should retry error
     *
     * @param error - Error object
     * @param options - Retry options
     * @returns True if should retry
     */
    shouldRetry(error, options) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        // Check error message or code
        const errorMessage = error.message.toLowerCase();
        const errorCode = error.code;
        for (const retryableError of opts.retryableErrors) {
            const retryableLower = retryableError.toLowerCase();
            if (errorMessage.includes(retryableLower) ||
                errorCode === retryableError) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get backoff delay for attempt
     *
     * Exponential backoff:
     * - Attempt 1: 0ms
     * - Attempt 2: 1000ms
     * - Attempt 3: 2000ms
     * - Attempt 4: 4000ms
     *
     * @param attempt - Attempt number (0-indexed)
     * @param options - Retry options
     * @returns Delay in milliseconds
     */
    getBackoffDelay(attempt, options) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        if (attempt === 0) {
            return 0;
        }
        return opts.backoffMs * Math.pow(opts.backoffMultiplier, attempt - 1);
    }
    /**
     * Sleep for milliseconds
     *
     * @param ms - Milliseconds
     * @returns Promise
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Handle successful execution
     *
     * Updates circuit breaker state
     */
    handleSuccess() {
        if (this.circuitState === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.circuitBreakerOptions.successThreshold) {
                // Close circuit
                this.circuitState = 'CLOSED';
                this.failureCount = 0;
                this.successCount = 0;
                console.log('[CIRCUIT_BREAKER] Circuit closed');
            }
        }
        else if (this.circuitState === 'CLOSED') {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }
    /**
     * Handle failed execution
     *
     * Updates circuit breaker state
     */
    handleFailure() {
        if (this.circuitState === 'HALF_OPEN') {
            // Open circuit again
            this.circuitState = 'OPEN';
            this.circuitOpenedAt = Date.now();
            this.successCount = 0;
            console.log('[CIRCUIT_BREAKER] Circuit opened (from half-open)');
        }
        else if (this.circuitState === 'CLOSED') {
            this.failureCount++;
            if (this.failureCount >= this.circuitBreakerOptions.failureThreshold) {
                // Open circuit
                this.circuitState = 'OPEN';
                this.circuitOpenedAt = Date.now();
                console.log(`[CIRCUIT_BREAKER] Circuit opened (${this.failureCount} failures)`);
            }
        }
    }
    /**
     * Get circuit breaker state
     *
     * @returns Circuit state
     */
    getCircuitState() {
        return this.circuitState;
    }
    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker() {
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.circuitOpenedAt = null;
        console.log('[CIRCUIT_BREAKER] Circuit reset');
    }
    /**
     * Execute with fallback
     *
     * @param fn - Primary function
     * @param fallbackFn - Fallback function
     * @param strategy - Fallback strategy
     * @returns Result or fallback result
     */
    async withFallback(fn, fallbackFn, strategy) {
        try {
            const result = await fn();
            return {
                result,
                strategy: strategy,
                reason: 'Primary succeeded',
            };
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.log(`[FALLBACK] Primary failed: ${err.message}, using ${strategy}`);
            const result = await fallbackFn();
            return {
                result,
                strategy,
                reason: err.message,
            };
        }
    }
    /**
     * Fallback: LLM timeout → Return retrieval results only
     *
     * @param retrievalResults - Retrieval results
     * @returns Fallback response
     */
    fallbackRetrievalOnly(retrievalResults) {
        return {
            queryId: 'fallback',
            success: false,
            shortAnswer: 'Query is taking longer than expected. Showing retrieved documents.',
            detailedSummary: retrievalResults.candidates
                .slice(0, 3)
                .map((c, i) => `${i + 1}. ${c.chunk_text} (Score: ${c.score.toFixed(2)})`)
                .join('\n\n'),
            metadata: {
                fallback: true,
                strategy: 'RETURN_RETRIEVAL_ONLY',
                reason: 'LLM timeout',
            },
        };
    }
    /**
     * Fallback: Vector search failed → Use keyword search
     *
     * @param query - User query
     * @returns Fallback retrieval strategy
     */
    fallbackKeywordSearch(query) {
        // Simulate keyword search
        return {
            candidates: [
                {
                    chunk_id: 'keyword_001',
                    chunk_text: `Keyword search result for: ${query}`,
                    score: 0.5,
                    artifact_id: 'fallback_001',
                },
            ],
            totalCandidates: 1,
            metadata: {
                fallback: true,
                strategy: 'USE_KEYWORD_SEARCH',
                reason: 'Vector search failed',
            },
        };
    }
    /**
     * Fallback: No results → Suggest query refinement
     *
     * @param query - User query
     * @returns Refinement suggestions
     */
    fallbackSuggestRefinement(query) {
        return {
            queryId: 'fallback',
            success: false,
            shortAnswer: 'No results found. Please try refining your query.',
            detailedSummary: `Suggestions:
- Try more specific terms
- Check spelling
- Use medical terminology
- Ask about a specific time period

Original query: "${query}"`,
            metadata: {
                fallback: true,
                strategy: 'SUGGEST_REFINEMENT',
                reason: 'No results found',
            },
        };
    }
    /**
     * Explain retry manager
     *
     * @returns Explanation string
     */
    explain() {
        return `Retry Manager:

Features:
- Exponential backoff retry
- Retryable error detection
- Circuit breaker integration
- Fallback strategies

Exponential Backoff:
  Attempt 1: 0ms
  Attempt 2: 1000ms
  Attempt 3: 2000ms
  Attempt 4: 4000ms

Retryable Errors:
- ECONNRESET (connection reset)
- ETIMEDOUT (timeout)
- ENOTFOUND (not found)
- rate_limit (rate limiting)
- timeout (generic timeout)

Circuit Breaker:
- Failure threshold: 5
- Success threshold: 2 (to close)
- Timeout: 60 seconds

Fallback Strategies:
1. RETURN_RETRIEVAL_ONLY - LLM timeout
2. USE_KEYWORD_SEARCH - Vector search failed
3. SUGGEST_REFINEMENT - No results
4. RETURN_CACHED - Cache hit
5. RETURN_PARTIAL - Partial results

Usage:
  const result = await retryManager.retry(async () => {
    return await someAsyncFunction();
  });

Tech Stack: Node.js + TypeScript ONLY`;
    }
}
// Export singleton instance
const retryManager = new RetryManager();
exports.default = retryManager;
//# sourceMappingURL=retry-manager.service.js.map