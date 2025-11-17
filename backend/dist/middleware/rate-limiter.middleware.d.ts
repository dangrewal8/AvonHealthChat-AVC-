/**
 * Rate Limiter Middleware
 *
 * Implement rate limiting for API endpoints using sliding window algorithm.
 *
 * Features:
 * - Per-user rate limiting (60 requests/minute)
 * - Per-endpoint rate limiting (10 requests/second)
 * - Global rate limiting (1000 requests/minute)
 * - Express middleware integration
 * - Rate limit headers in response
 *
 * NO external rate limiting libraries
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    windowMs: number;
    max: number;
}
/**
 * Rate limit result
 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}
/**
 * Rate limit type
 */
export type RateLimitType = 'user' | 'endpoint' | 'global';
/**
 * Rate Limiter Class
 *
 * Implements sliding window rate limiting
 */
declare class RateLimiter {
    /**
     * Request timestamps per key (user, endpoint, global)
     */
    private requests;
    /**
     * Default configurations
     */
    private readonly DEFAULT_CONFIGS;
    /**
     * Check if request is within rate limit
     *
     * Sliding window algorithm:
     * 1. Get current timestamp
     * 2. Get all requests for this key
     * 3. Filter out requests outside the time window
     * 4. Check if count is below max
     * 5. Return result
     *
     * @param key - Rate limit key (userId, endpoint, or 'global')
     * @param config - Rate limit configuration
     * @returns Rate limit result
     */
    checkLimit(key: string, config: RateLimitConfig): RateLimitResult;
    /**
     * Record request
     *
     * @param key - Rate limit key
     * @param config - Rate limit configuration
     */
    recordRequest(key: string, config: RateLimitConfig): void;
    /**
     * Get remaining quota
     *
     * @param key - Rate limit key
     * @param config - Rate limit configuration
     * @returns Remaining requests
     */
    getRemainingQuota(key: string, config: RateLimitConfig): number;
    /**
     * Clean up expired requests
     *
     * Should be called periodically to prevent memory leaks
     */
    cleanup(): void;
    /**
     * Get request count
     *
     * @returns Total number of tracked keys
     */
    getRequestCount(): number;
    /**
     * Reset rate limiter
     *
     * Clears all tracked requests
     */
    reset(): void;
    /**
     * Create Express middleware for rate limiting
     *
     * @param type - Rate limit type (user, endpoint, or global)
     * @param customConfig - Optional custom configuration
     * @returns Express middleware
     */
    middleware(type?: RateLimitType, customConfig?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Get rate limit key
     *
     * @param req - Express request
     * @param type - Rate limit type
     * @returns Rate limit key
     */
    private getRateLimitKey;
    /**
     * Combined rate limiting middleware
     *
     * Applies multiple rate limits (user, endpoint, global)
     *
     * @returns Express middleware
     */
    combinedMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Explain rate limiter
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const rateLimiter: RateLimiter;
export default rateLimiter;
//# sourceMappingURL=rate-limiter.middleware.d.ts.map