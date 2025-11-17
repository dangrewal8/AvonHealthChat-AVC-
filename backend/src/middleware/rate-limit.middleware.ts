/**
 * Rate Limiting Middleware
 *
 * Protects API from abuse by limiting request rates per IP address.
 *
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Rate limit store
 * In production, use Redis for distributed rate limiting
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
}

/**
 * Get client identifier (IP address)
 */
const getClientId = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return (
    forwardedIp?.split(',')[0] ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Clean up expired entries from store
 */
const cleanupStore = (): void => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * Generic Rate Limiter
 *
 * Creates rate limiting middleware with custom configuration.
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}:${req.path}`;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count += 1;

    // Set rate limit headers
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      res.status(429).json({
        error: 'Too Many Requests',
        message:
          config.message ||
          `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        status: 429,
        retryAfter,
      });
      return;
    }

    next();
  };
};

/**
 * Global Rate Limiter
 *
 * Applies to all requests. Generous limit to prevent abuse.
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
  message: 'Too many requests from this IP. Please try again later.',
});

/**
 * API Rate Limiter
 *
 * Stricter limit for API endpoints.
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'API rate limit exceeded. Please try again later.',
});

/**
 * Query Rate Limiter
 *
 * Very strict limit for expensive query operations.
 */
export const queryRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10, // 10 queries per minute
  message:
    'Query rate limit exceeded. This operation is expensive. Please wait before trying again.',
});

/**
 * Authentication Rate Limiter
 *
 * Strict limit for authentication attempts to prevent brute force.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message:
    'Too many authentication attempts. Please try again in 15 minutes.',
});

/**
 * Strict Rate Limiter
 *
 * Very strict for sensitive operations.
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute
  message: 'Rate limit exceeded for this operation.',
});

/**
 * IP Whitelist Middleware
 *
 * Bypass rate limiting for whitelisted IPs (internal services, monitoring).
 */
export const ipWhitelist = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = getClientId(req);
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];

  if (whitelist.includes(clientId)) {
    // Skip rate limiting for whitelisted IPs
    return next();
  }

  next();
};

/**
 * Rate Limit Status Endpoint
 *
 * Returns current rate limit status for client.
 */
export const getRateLimitStatus = (req: Request, res: Response): void => {
  const clientId = getClientId(req);
  const now = Date.now();

  const status: Record<string, any> = {
    clientId,
    limits: {},
  };

  // Check all active limits for this client
  for (const [key, value] of rateLimitStore.entries()) {
    if (key.startsWith(clientId)) {
      const path = key.split(':')[1];
      const remaining = Math.max(0, value.count);
      const resetTime = Math.ceil((value.resetTime - now) / 1000);

      status.limits[path] = {
        requests: value.count,
        resetIn: resetTime > 0 ? resetTime : 0,
      };
    }
  }

  res.json(status);
};

/**
 * Reset Rate Limits (Admin only)
 *
 * Clears all rate limit entries. Use with caution.
 */
export const resetRateLimits = (req: Request, res: Response): void => {
  const clientId = req.query.clientId as string;

  if (clientId) {
    // Reset limits for specific client
    for (const key of rateLimitStore.keys()) {
      if (key.startsWith(clientId)) {
        rateLimitStore.delete(key);
      }
    }
    res.json({ message: `Rate limits reset for ${clientId}` });
  } else {
    // Reset all limits
    rateLimitStore.clear();
    res.json({ message: 'All rate limits reset' });
  }
};

/**
 * Sliding Window Rate Limiter
 *
 * More accurate than fixed window, prevents burst at window boundaries.
 */
interface SlidingWindowEntry {
  timestamps: number[];
}

const slidingWindowStore = new Map<string, SlidingWindowEntry>();

export const createSlidingWindowLimiter = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}:${req.path}`;

    // Get or create entry
    let entry = slidingWindowStore.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      slidingWindowStore.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    // Add current timestamp
    entry.timestamps.push(now);

    // Calculate remaining requests
    const remaining = Math.max(0, config.maxRequests - entry.timestamps.length);

    // Set headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);

    // Check if limit exceeded
    if (entry.timestamps.length > config.maxRequests) {
      const oldestTimestamp = entry.timestamps[0];
      const retryAfter = Math.ceil(
        (oldestTimestamp + config.windowMs - now) / 1000
      );

      res.setHeader('Retry-After', retryAfter);

      res.status(429).json({
        error: 'Too Many Requests',
        message:
          config.message ||
          `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        status: 429,
        retryAfter,
      });
      return;
    }

    next();
  };
};

/**
 * Cost-based Rate Limiter
 *
 * Different operations have different costs.
 */
interface CostBasedEntry {
  cost: number;
  resetTime: number;
}

const costBasedStore = new Map<string, CostBasedEntry>();

export const createCostBasedLimiter = (
  maxCost: number,
  windowMs: number,
  getCost: (req: Request) => number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = clientId;
    const cost = getCost(req);

    // Get or create entry
    let entry = costBasedStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        cost: 0,
        resetTime: now + windowMs,
      };
      costBasedStore.set(key, entry);
    }

    // Add cost
    entry.cost += cost;

    // Calculate remaining
    const remaining = Math.max(0, maxCost - entry.cost);

    // Set headers
    res.setHeader('X-RateLimit-Cost', cost);
    res.setHeader('X-RateLimit-Remaining', remaining);

    // Check if limit exceeded
    if (entry.cost > maxCost) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      res.status(429).json({
        error: 'Too Many Requests',
        message: `Cost-based rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        status: 429,
        retryAfter,
      });
      return;
    }

    next();
  };
};
