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
export declare enum CircuitState {
    CLOSED = "closed",// Normal operation
    OPEN = "open",// Blocking requests (fail-fast)
    HALF_OPEN = "half_open"
}
/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeoutMs: number;
    monitoredServices?: string[];
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
declare class CircuitBreaker {
    /**
     * Current state
     */
    private state;
    /**
     * Failure count
     */
    private failureCount;
    /**
     * Success count
     */
    private successCount;
    /**
     * Total requests
     */
    private totalRequests;
    /**
     * Last failure time
     */
    private lastFailureTime;
    /**
     * Last success time
     */
    private lastSuccessTime;
    /**
     * Time when circuit was opened
     */
    private circuitOpenedAt;
    /**
     * Configuration
     */
    private config;
    /**
     * Default configuration
     */
    private readonly DEFAULT_CONFIG;
    /**
     * Constructor
     *
     * @param config - Circuit breaker configuration
     */
    constructor(config?: Partial<CircuitBreakerConfig>);
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
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Record success
     *
     * Success Logic:
     * - Reset failure count
     * - Close circuit (CLOSED)
     * - Increment success count
     * - Update last success time
     */
    private recordSuccess;
    /**
     * Record failure
     *
     * Failure Logic:
     * - Increment failure count
     * - Update last failure time
     * - If failure count >= threshold → open circuit (OPEN)
     */
    private recordFailure;
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
    private shouldAttemptReset;
    /**
     * Get current state
     *
     * @returns Current circuit state
     */
    getState(): CircuitState;
    /**
     * Get statistics
     *
     * @returns Circuit breaker statistics
     */
    getStats(): CircuitBreakerStats;
    /**
     * Reset circuit breaker
     *
     * Resets all counters and closes circuit
     */
    reset(): void;
    /**
     * Force open circuit
     *
     * Manually opens circuit (for testing or emergency)
     */
    forceOpen(): void;
    /**
     * Force close circuit
     *
     * Manually closes circuit (for testing or recovery)
     */
    forceClose(): void;
    /**
     * Get failure rate
     *
     * @returns Failure rate (0-1)
     */
    getFailureRate(): number;
    /**
     * Get success rate
     *
     * @returns Success rate (0-1)
     */
    getSuccessRate(): number;
    /**
     * Get time until reset attempt
     *
     * @returns Milliseconds until reset attempt, or 0 if not applicable
     */
    getTimeUntilReset(): number;
    /**
     * Explain circuit breaker
     *
     * @returns Explanation string
     */
    explain(): string;
}
/**
 * Circuit Breaker Manager
 *
 * Manages multiple circuit breakers for different services
 */
declare class CircuitBreakerManager {
    /**
     * Circuit breakers per service
     */
    private breakers;
    /**
     * Default configuration
     */
    private readonly DEFAULT_CONFIG;
    /**
     * Get or create circuit breaker for service
     *
     * @param serviceName - Service name (e.g., 'ollama', 'avon_api')
     * @param config - Optional configuration
     * @returns Circuit breaker instance
     */
    getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
    /**
     * Execute function with service-specific circuit breaker
     *
     * @param serviceName - Service name
     * @param fn - Function to execute
     * @param config - Optional configuration
     * @returns Result from function
     */
    execute<T>(serviceName: string, fn: () => Promise<T>, config?: Partial<CircuitBreakerConfig>): Promise<T>;
    /**
     * Get statistics for all services
     *
     * @returns Map of service name to statistics
     */
    getAllStats(): Map<string, CircuitBreakerStats>;
    /**
     * Reset all circuit breakers
     */
    resetAll(): void;
    /**
     * Get number of circuit breakers
     *
     * @returns Number of circuit breakers
     */
    getBreakerCount(): number;
}
declare const circuitBreakerManager: CircuitBreakerManager;
export { CircuitBreaker, circuitBreakerManager };
export default circuitBreakerManager;
//# sourceMappingURL=circuit-breaker.service.d.ts.map