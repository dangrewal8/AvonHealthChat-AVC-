/**
 * Circuit Breaker Service
 *
 * Implement circuit breaker for external service calls (Ollama, Avon Health API).
 *
 * Features:
 * - Three states: CLOSED, OPEN, HALF_OPEN
 * - Failure threshold (default: 5 failures)
 * - Reset timeout (default: 30 seconds)
 * - Fail-fast when circuit is OPEN
 * - Automatic recovery attempt via HALF_OPEN
 * - Per-service circuit breakers
 *
 * NO external circuit breaker libraries
 */

/**
 * Circuit state
 */
export enum CircuitState {
  CLOSED = 'closed',         // Normal operation
  OPEN = 'open',             // Blocking requests (fail-fast)
  HALF_OPEN = 'half_open',   // Testing recovery
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures to open circuit (default: 5)
  resetTimeoutMs: number;        // Time to wait before attempting reset (default: 30000ms)
  monitoredServices?: string[];  // Services to monitor (e.g., ['ollama', 'avon_api'])
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  circuitOpenedAt: number | null;
}

/**
 * Circuit Breaker Class
 *
 * Implements the circuit breaker pattern for fault tolerance
 */
class CircuitBreaker {
  /**
   * Current state
   */
  private state: CircuitState = CircuitState.CLOSED;

  /**
   * Failure count
   */
  private failureCount = 0;

  /**
   * Success count
   */
  private successCount = 0;

  /**
   * Total requests
   */
  private totalRequests = 0;

  /**
   * Last failure time
   */
  private lastFailureTime: number | null = null;

  /**
   * Last success time
   */
  private lastSuccessTime: number | null = null;

  /**
   * Time when circuit was opened
   */
  private circuitOpenedAt: number | null = null;

  /**
   * Configuration
   */
  private config: CircuitBreakerConfig;

  /**
   * Default configuration
   */
  private readonly DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,        // 5 failures
    resetTimeoutMs: 30000,      // 30 seconds
    monitoredServices: [],
  };

  /**
   * Constructor
   *
   * @param config - Circuit breaker configuration
   */
  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      ...this.DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Execute function with circuit breaker
   *
   * Circuit Breaker Logic:
   * 1. If OPEN and timeout not reached → fail fast
   * 2. If OPEN and timeout reached → try HALF_OPEN
   * 3. Execute function
   * 4. On success → record success
   * 5. On failure → record failure
   *
   * @param fn - Async function to execute
   * @returns Result from function
   * @throws Error if circuit is OPEN or function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // If circuit is OPEN
    if (this.state === CircuitState.OPEN) {
      // Check if we should attempt reset
      if (!this.shouldAttemptReset()) {
        // Fail fast - don't execute function
        throw new Error(`Circuit breaker is OPEN. Service unavailable.`);
      }

      // Timeout reached, try HALF_OPEN
      this.state = CircuitState.HALF_OPEN;
      console.log('[CircuitBreaker] Attempting reset (HALF_OPEN)');
    }

    // Execute function
    try {
      const result = await fn();

      // Success
      this.recordSuccess();

      return result;
    } catch (error) {
      // Failure
      this.recordFailure();

      throw error;
    }
  }

  /**
   * Record success
   *
   * Success Logic:
   * - Reset failure count
   * - Close circuit (CLOSED)
   * - Increment success count
   * - Update last success time
   */
  private recordSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.lastSuccessTime = Date.now();

    // Close circuit
    if (this.state !== CircuitState.CLOSED) {
      console.log('[CircuitBreaker] Circuit CLOSED (recovered)');
      this.state = CircuitState.CLOSED;
      this.circuitOpenedAt = null;
    }
  }

  /**
   * Record failure
   *
   * Failure Logic:
   * - Increment failure count
   * - Update last failure time
   * - If failure count >= threshold → open circuit (OPEN)
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Check if we should open circuit
    if (this.failureCount >= this.config.failureThreshold) {
      if (this.state !== CircuitState.OPEN) {
        console.log(`[CircuitBreaker] Circuit OPEN (${this.failureCount} failures)`);
        this.state = CircuitState.OPEN;
        this.circuitOpenedAt = Date.now();
      }
    }
  }

  /**
   * Check if we should attempt reset
   *
   * Reset Logic:
   * - If last failure time is null → no
   * - If time since last failure < resetTimeoutMs → no
   * - Otherwise → yes
   *
   * @returns True if we should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (this.lastFailureTime === null) {
      return false;
    }

    const now = Date.now();
    const timeSinceFailure = now - this.lastFailureTime;

    return timeSinceFailure >= this.config.resetTimeoutMs;
  }

  /**
   * Get current state
   *
   * @returns Current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   *
   * @returns Circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      circuitOpenedAt: this.circuitOpenedAt,
    };
  }

  /**
   * Reset circuit breaker
   *
   * Resets all counters and closes circuit
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.circuitOpenedAt = null;
  }

  /**
   * Force open circuit
   *
   * Manually opens circuit (for testing or emergency)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.circuitOpenedAt = Date.now();
    console.log('[CircuitBreaker] Circuit manually OPENED');
  }

  /**
   * Force close circuit
   *
   * Manually closes circuit (for testing or recovery)
   */
  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.circuitOpenedAt = null;
    console.log('[CircuitBreaker] Circuit manually CLOSED');
  }

  /**
   * Get failure rate
   *
   * @returns Failure rate (0-1)
   */
  getFailureRate(): number {
    if (this.totalRequests === 0) {
      return 0;
    }

    const failedRequests = this.totalRequests - this.successCount;
    return failedRequests / this.totalRequests;
  }

  /**
   * Get success rate
   *
   * @returns Success rate (0-1)
   */
  getSuccessRate(): number {
    if (this.totalRequests === 0) {
      return 0;
    }

    return this.successCount / this.totalRequests;
  }

  /**
   * Get time until reset attempt
   *
   * @returns Milliseconds until reset attempt, or 0 if not applicable
   */
  getTimeUntilReset(): number {
    if (this.state !== CircuitState.OPEN || this.lastFailureTime === null) {
      return 0;
    }

    const now = Date.now();
    const timeSinceFailure = now - this.lastFailureTime;
    const timeRemaining = this.config.resetTimeoutMs - timeSinceFailure;

    return Math.max(0, timeRemaining);
  }

  /**
   * Explain circuit breaker
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Circuit Breaker Pattern:

States:
- CLOSED: Normal operation (requests pass through)
- OPEN: Circuit is open (fail-fast, no requests)
- HALF_OPEN: Testing recovery (allow one request)

State Transitions:
CLOSED → OPEN:
  When failure count >= threshold (${this.config.failureThreshold})

OPEN → HALF_OPEN:
  When reset timeout reached (${this.config.resetTimeoutMs}ms)

HALF_OPEN → CLOSED:
  When request succeeds

HALF_OPEN → OPEN:
  When request fails

Configuration:
- Failure threshold: ${this.config.failureThreshold}
- Reset timeout: ${this.config.resetTimeoutMs}ms

Current Status:
- State: ${this.state}
- Failures: ${this.failureCount}
- Successes: ${this.successCount}
- Total requests: ${this.totalRequests}

Tech Stack: Node.js + TypeScript ONLY
NO external circuit breaker libraries`;
  }
}

/**
 * Circuit Breaker Manager
 *
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerManager {
  /**
   * Circuit breakers per service
   */
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Default configuration
   */
  private readonly DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  };

  /**
   * Get or create circuit breaker for service
   *
   * @param serviceName - Service name (e.g., 'ollama', 'avon_api')
   * @param config - Optional configuration
   * @returns Circuit breaker instance
   */
  getBreaker(
    serviceName: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breakerConfig = {
        ...this.DEFAULT_CONFIG,
        ...config,
      };

      this.breakers.set(serviceName, new CircuitBreaker(breakerConfig));
    }

    return this.breakers.get(serviceName)!;
  }

  /**
   * Execute function with service-specific circuit breaker
   *
   * @param serviceName - Service name
   * @param fn - Function to execute
   * @param config - Optional configuration
   * @returns Result from function
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, config);
    return breaker.execute(fn);
  }

  /**
   * Get statistics for all services
   *
   * @returns Map of service name to statistics
   */
  getAllStats(): Map<string, CircuitBreakerStats> {
    const stats = new Map<string, CircuitBreakerStats>();

    for (const [serviceName, breaker] of this.breakers.entries()) {
      stats.set(serviceName, breaker.getStats());
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get number of circuit breakers
   *
   * @returns Number of circuit breakers
   */
  getBreakerCount(): number {
    return this.breakers.size;
  }
}

// Export singleton instance
const circuitBreakerManager = new CircuitBreakerManager();
export { CircuitBreaker, circuitBreakerManager };
export default circuitBreakerManager;
