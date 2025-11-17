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
/**
 * Retry options
 */
export interface RetryOptions {
    maxAttempts?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
}
/**
 * Retry result
 */
export interface RetryResult<T> {
    result: T;
    attempts: number;
    totalTimeMs: number;
    errors: Error[];
}
/**
 * Circuit breaker state
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}
/**
 * Fallback strategy
 */
export type FallbackStrategy = 'RETURN_RETRIEVAL_ONLY' | 'USE_KEYWORD_SEARCH' | 'SUGGEST_REFINEMENT' | 'RETURN_CACHED' | 'RETURN_PARTIAL';
/**
 * Fallback result
 */
export interface FallbackResult<T> {
    result: T;
    strategy: FallbackStrategy;
    reason: string;
}
/**
 * Retry Manager Class
 *
 * Manages retry logic with exponential backoff
 */
declare class RetryManager {
    /**
     * Default retry options
     */
    private readonly DEFAULT_OPTIONS;
    /**
     * Circuit breaker state
     */
    private circuitState;
    /**
     * Circuit breaker failure count
     */
    private failureCount;
    /**
     * Circuit breaker success count (in HALF_OPEN state)
     */
    private successCount;
    /**
     * Circuit breaker open timestamp
     */
    private circuitOpenedAt;
    /**
     * Circuit breaker options
     */
    private readonly circuitBreakerOptions;
    /**
     * Retry a function with exponential backoff
     *
     * @param fn - Function to retry
     * @param options - Retry options
     * @returns Promise with result
     */
    retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
    /**
     * Should retry error
     *
     * @param error - Error object
     * @param options - Retry options
     * @returns True if should retry
     */
    shouldRetry(error: Error, options?: RetryOptions): boolean;
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
    getBackoffDelay(attempt: number, options?: RetryOptions): number;
    /**
     * Sleep for milliseconds
     *
     * @param ms - Milliseconds
     * @returns Promise
     */
    private sleep;
    /**
     * Handle successful execution
     *
     * Updates circuit breaker state
     */
    private handleSuccess;
    /**
     * Handle failed execution
     *
     * Updates circuit breaker state
     */
    private handleFailure;
    /**
     * Get circuit breaker state
     *
     * @returns Circuit state
     */
    getCircuitState(): CircuitState;
    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker(): void;
    /**
     * Execute with fallback
     *
     * @param fn - Primary function
     * @param fallbackFn - Fallback function
     * @param strategy - Fallback strategy
     * @returns Result or fallback result
     */
    withFallback<T>(fn: () => Promise<T>, fallbackFn: () => Promise<T>, strategy: FallbackStrategy): Promise<FallbackResult<T>>;
    /**
     * Fallback: LLM timeout → Return retrieval results only
     *
     * @param retrievalResults - Retrieval results
     * @returns Fallback response
     */
    fallbackRetrievalOnly(retrievalResults: any): any;
    /**
     * Fallback: Vector search failed → Use keyword search
     *
     * @param query - User query
     * @returns Fallback retrieval strategy
     */
    fallbackKeywordSearch(query: string): any;
    /**
     * Fallback: No results → Suggest query refinement
     *
     * @param query - User query
     * @returns Refinement suggestions
     */
    fallbackSuggestRefinement(query: string): any;
    /**
     * Explain retry manager
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const retryManager: RetryManager;
export default retryManager;
//# sourceMappingURL=retry-manager.service.d.ts.map