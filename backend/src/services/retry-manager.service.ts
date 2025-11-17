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
  maxAttempts?: number;        // default 3
  backoffMs?: number;          // default 1000
  backoffMultiplier?: number;  // default 2 (exponential)
  retryableErrors?: string[];  // default ['ECONNRESET', 'ETIMEDOUT', 'rate_limit']
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
  failureThreshold: number;    // default 5
  successThreshold: number;    // default 2
  timeout: number;             // default 60000 (1 minute)
}

/**
 * Fallback strategy
 */
export type FallbackStrategy =
  | 'RETURN_RETRIEVAL_ONLY'
  | 'USE_KEYWORD_SEARCH'
  | 'SUGGEST_REFINEMENT'
  | 'RETURN_CACHED'
  | 'RETURN_PARTIAL';

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
class RetryManager {
  /**
   * Default retry options
   */
  private readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'rate_limit', 'timeout'],
  };

  /**
   * Circuit breaker state
   */
  private circuitState: CircuitState = 'CLOSED';

  /**
   * Circuit breaker failure count
   */
  private failureCount = 0;

  /**
   * Circuit breaker success count (in HALF_OPEN state)
   */
  private successCount = 0;

  /**
   * Circuit breaker open timestamp
   */
  private circuitOpenedAt: number | null = null;

  /**
   * Circuit breaker options
   */
  private readonly circuitBreakerOptions: CircuitBreakerOptions = {
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
  async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const errors: Error[] = [];
    const startTime = Date.now();

    // Check circuit breaker
    if (this.circuitState === 'OPEN') {
      const timeOpen = Date.now() - (this.circuitOpenedAt || 0);
      if (timeOpen < this.circuitBreakerOptions.timeout) {
        throw new Error('CIRCUIT_OPEN: Service temporarily unavailable');
      } else {
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
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);

        // Check if should retry
        const shouldRetry = this.shouldRetry(err, opts);

        if (!shouldRetry || attempt === opts.maxAttempts) {
          // Final failure - update circuit breaker
          this.handleFailure();

          throw new Error(
            `Failed after ${attempt} attempts: ${err.message}`
          );
        }

        // Log retry attempt
        console.log(
          `[RETRY] Attempt ${attempt}/${opts.maxAttempts} failed: ${err.message}`
        );
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
  shouldRetry(error: Error, options?: RetryOptions): boolean {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Check error message or code
    const errorMessage = error.message.toLowerCase();
    const errorCode = (error as any).code;

    for (const retryableError of opts.retryableErrors) {
      const retryableLower = retryableError.toLowerCase();
      if (
        errorMessage.includes(retryableLower) ||
        errorCode === retryableError
      ) {
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
  getBackoffDelay(attempt: number, options?: RetryOptions): number {
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
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle successful execution
   *
   * Updates circuit breaker state
   */
  private handleSuccess(): void {
    if (this.circuitState === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.circuitBreakerOptions.successThreshold) {
        // Close circuit
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        console.log('[CIRCUIT_BREAKER] Circuit closed');
      }
    } else if (this.circuitState === 'CLOSED') {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   *
   * Updates circuit breaker state
   */
  private handleFailure(): void {
    if (this.circuitState === 'HALF_OPEN') {
      // Open circuit again
      this.circuitState = 'OPEN';
      this.circuitOpenedAt = Date.now();
      this.successCount = 0;
      console.log('[CIRCUIT_BREAKER] Circuit opened (from half-open)');
    } else if (this.circuitState === 'CLOSED') {
      this.failureCount++;

      if (this.failureCount >= this.circuitBreakerOptions.failureThreshold) {
        // Open circuit
        this.circuitState = 'OPEN';
        this.circuitOpenedAt = Date.now();
        console.log(
          `[CIRCUIT_BREAKER] Circuit opened (${this.failureCount} failures)`
        );
      }
    }
  }

  /**
   * Get circuit breaker state
   *
   * @returns Circuit state
   */
  getCircuitState(): CircuitState {
    return this.circuitState;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
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
  async withFallback<T>(
    fn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    strategy: FallbackStrategy
  ): Promise<FallbackResult<T>> {
    try {
      const result = await fn();
      return {
        result,
        strategy: strategy,
        reason: 'Primary succeeded',
      };
    } catch (error) {
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
  fallbackRetrievalOnly(retrievalResults: any): any {
    return {
      queryId: 'fallback',
      success: false,
      shortAnswer:
        'Query is taking longer than expected. Showing retrieved documents.',
      detailedSummary: retrievalResults.candidates
        .slice(0, 3)
        .map(
          (c: any, i: number) =>
            `${i + 1}. ${c.chunk_text} (Score: ${c.score.toFixed(2)})`
        )
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
  fallbackKeywordSearch(query: string): any {
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
  fallbackSuggestRefinement(query: string): any {
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
  explain(): string {
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
export default retryManager;
