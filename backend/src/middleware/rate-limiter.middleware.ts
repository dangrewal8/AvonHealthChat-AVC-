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
  windowMs: number; // Time window in milliseconds
  max: number;      // Max requests per window
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
class RateLimiter {
  /**
   * Request timestamps per key (user, endpoint, global)
   */
  private requests: Map<string, number[]> = new Map();

  /**
   * Default configurations
   */
  private readonly DEFAULT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
    user: {
      windowMs: 60 * 1000,  // 60 seconds
      max: 60,              // 60 requests/minute
    },
    endpoint: {
      windowMs: 1000,       // 1 second
      max: 10,              // 10 requests/second
    },
    global: {
      windowMs: 60 * 1000,  // 60 seconds
      max: 1000,            // 1000 requests/minute
    },
  };

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
  checkLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requests outside window (sliding window)
    const validRequests = requests.filter(
      time => now - time < config.windowMs
    );

    // Calculate remaining quota
    const remaining = Math.max(0, config.max - validRequests.length);

    // Calculate reset time (when oldest request expires)
    const resetTime = validRequests.length > 0
      ? validRequests[0] + config.windowMs
      : now + config.windowMs;

    // Check if limit exceeded
    if (validRequests.length >= config.max) {
      // Calculate retry after (when next slot opens)
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1, // -1 for current request
      resetTime,
    };
  }

  /**
   * Record request
   *
   * @param key - Rate limit key
   * @param config - Rate limit configuration
   */
  recordRequest(key: string, config: RateLimitConfig): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requests outside window
    const validRequests = requests.filter(
      time => now - time < config.windowMs
    );

    // Add current request
    validRequests.push(now);

    // Store updated requests
    this.requests.set(key, validRequests);
  }

  /**
   * Get remaining quota
   *
   * @param key - Rate limit key
   * @param config - Rate limit configuration
   * @returns Remaining requests
   */
  getRemainingQuota(key: string, config: RateLimitConfig): number {
    const result = this.checkLimit(key, config);
    return result.remaining;
  }

  /**
   * Clean up expired requests
   *
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, requests] of this.requests.entries()) {
      // Find max window from all configs
      const maxWindow = Math.max(
        this.DEFAULT_CONFIGS.user.windowMs,
        this.DEFAULT_CONFIGS.endpoint.windowMs,
        this.DEFAULT_CONFIGS.global.windowMs
      );

      // Remove requests older than max window
      const validRequests = requests.filter(
        time => now - time < maxWindow
      );

      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  /**
   * Get request count
   *
   * @returns Total number of tracked keys
   */
  getRequestCount(): number {
    return this.requests.size;
  }

  /**
   * Reset rate limiter
   *
   * Clears all tracked requests
   */
  reset(): void {
    this.requests.clear();
  }

  /**
   * Create Express middleware for rate limiting
   *
   * @param type - Rate limit type (user, endpoint, or global)
   * @param customConfig - Optional custom configuration
   * @returns Express middleware
   */
  middleware(
    type: RateLimitType = 'user',
    customConfig?: Partial<RateLimitConfig>
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Get configuration
      const config = {
        ...this.DEFAULT_CONFIGS[type],
        ...customConfig,
      };

      // Get rate limit key
      const key = this.getRateLimitKey(req, type);

      // Check limit
      const result = this.checkLimit(key, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.allowed) {
        // Rate limit exceeded
        res.setHeader('Retry-After', result.retryAfter!.toString());

        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
          limit: config.max,
          window: `${config.windowMs / 1000} seconds`,
        });
        return;
      }

      // Record request
      this.recordRequest(key, config);

      // Continue to next middleware
      next();
    };
  }

  /**
   * Get rate limit key
   *
   * @param req - Express request
   * @param type - Rate limit type
   * @returns Rate limit key
   */
  private getRateLimitKey(req: Request, type: RateLimitType): string {
    switch (type) {
      case 'user':
        // Use user ID from auth or IP address
        const userId = (req as any).user?.id || req.ip || 'anonymous';
        return `user:${userId}`;

      case 'endpoint':
        // Use endpoint path
        return `endpoint:${req.method}:${req.path}`;

      case 'global':
        // Global key
        return 'global';

      default:
        return 'unknown';
    }
  }

  /**
   * Combined rate limiting middleware
   *
   * Applies multiple rate limits (user, endpoint, global)
   *
   * @returns Express middleware
   */
  combinedMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Check global limit
      const globalResult = this.checkLimit('global', this.DEFAULT_CONFIGS.global);
      if (!globalResult.allowed) {
        res.setHeader('X-RateLimit-Limit', this.DEFAULT_CONFIGS.global.max.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(globalResult.resetTime).toISOString());
        res.setHeader('Retry-After', globalResult.retryAfter!.toString());

        res.status(429).json({
          error: 'Global rate limit exceeded',
          message: `Global rate limit exceeded. Please try again in ${globalResult.retryAfter} seconds.`,
          retryAfter: globalResult.retryAfter,
        });
        return;
      }

      // Check user limit
      const userId = (req as any).user?.id || req.ip || 'anonymous';
      const userKey = `user:${userId}`;
      const userResult = this.checkLimit(userKey, this.DEFAULT_CONFIGS.user);

      if (!userResult.allowed) {
        res.setHeader('X-RateLimit-Limit', this.DEFAULT_CONFIGS.user.max.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(userResult.resetTime).toISOString());
        res.setHeader('Retry-After', userResult.retryAfter!.toString());

        res.status(429).json({
          error: 'User rate limit exceeded',
          message: `Too many requests. Please try again in ${userResult.retryAfter} seconds.`,
          retryAfter: userResult.retryAfter,
        });
        return;
      }

      // Check endpoint limit
      const endpointKey = `endpoint:${req.method}:${req.path}`;
      const endpointResult = this.checkLimit(endpointKey, this.DEFAULT_CONFIGS.endpoint);

      if (!endpointResult.allowed) {
        res.setHeader('X-RateLimit-Limit', this.DEFAULT_CONFIGS.endpoint.max.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(endpointResult.resetTime).toISOString());
        res.setHeader('Retry-After', endpointResult.retryAfter!.toString());

        res.status(429).json({
          error: 'Endpoint rate limit exceeded',
          message: `Too many requests to this endpoint. Please try again in ${endpointResult.retryAfter} seconds.`,
          retryAfter: endpointResult.retryAfter,
        });
        return;
      }

      // Record requests
      this.recordRequest('global', this.DEFAULT_CONFIGS.global);
      this.recordRequest(userKey, this.DEFAULT_CONFIGS.user);
      this.recordRequest(endpointKey, this.DEFAULT_CONFIGS.endpoint);

      // Set headers for successful request
      res.setHeader('X-RateLimit-Limit', this.DEFAULT_CONFIGS.user.max.toString());
      res.setHeader('X-RateLimit-Remaining', userResult.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(userResult.resetTime).toISOString());

      // Continue to next middleware
      next();
    };
  }

  /**
   * Explain rate limiter
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Rate Limiter:

Sliding Window Algorithm:
1. Get current timestamp
2. Get all requests for key
3. Filter requests outside window
4. Check if count < max
5. Record new request

Rate Limits:
- Per user: 60 requests/minute
- Per endpoint: 10 requests/second
- Global: 1000 requests/minute

Features:
- Sliding window (precise)
- Express middleware
- Rate limit headers
- Cleanup for memory efficiency

Usage:
  app.use(rateLimiter.middleware('user'));
  app.use(rateLimiter.combinedMiddleware());

Tech Stack: Node.js + Express + TypeScript ONLY
NO external rate limiting libraries`;
  }
}

// Export singleton instance
const rateLimiter = new RateLimiter();
export default rateLimiter;
