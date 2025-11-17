/**
 * Rate Limiting Middleware
 *
 * Protects API from abuse by limiting request rates per IP address.
 *
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
/**
 * Generic Rate Limiter
 *
 * Creates rate limiting middleware with custom configuration.
 */
export declare const createRateLimiter: (config: RateLimitConfig) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Global Rate Limiter
 *
 * Applies to all requests. Generous limit to prevent abuse.
 */
export declare const globalRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * API Rate Limiter
 *
 * Stricter limit for API endpoints.
 */
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Query Rate Limiter
 *
 * Very strict limit for expensive query operations.
 */
export declare const queryRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Authentication Rate Limiter
 *
 * Strict limit for authentication attempts to prevent brute force.
 */
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Strict Rate Limiter
 *
 * Very strict for sensitive operations.
 */
export declare const strictRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * IP Whitelist Middleware
 *
 * Bypass rate limiting for whitelisted IPs (internal services, monitoring).
 */
export declare const ipWhitelist: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate Limit Status Endpoint
 *
 * Returns current rate limit status for client.
 */
export declare const getRateLimitStatus: (req: Request, res: Response) => void;
/**
 * Reset Rate Limits (Admin only)
 *
 * Clears all rate limit entries. Use with caution.
 */
export declare const resetRateLimits: (req: Request, res: Response) => void;
export declare const createSlidingWindowLimiter: (config: RateLimitConfig) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createCostBasedLimiter: (maxCost: number, windowMs: number, getCost: (req: Request) => number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rate-limit.middleware.d.ts.map