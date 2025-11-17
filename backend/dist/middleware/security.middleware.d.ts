/**
 * Security Middleware
 *
 * Comprehensive security middleware for Express application including
 * helmet for security headers and CORS configuration.
 *
 */
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
/**
 * Helmet Security Headers Configuration
 *
 * Configures various security headers to protect against common vulnerabilities.
 */
export declare const helmetConfig: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing to allow frontend access.
 */
export declare const corsConfig: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * HTTPS Enforcement Middleware
 *
 * Redirects HTTP requests to HTTPS in production.
 */
export declare const httpsEnforcement: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security Headers Middleware
 *
 * Adds additional custom security headers.
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request Logging Middleware (for security monitoring)
 *
 * Logs all incoming requests for security auditing.
 */
export declare const securityLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Suspicious Activity Detection
 *
 * Detects and blocks potentially malicious requests.
 */
export declare const suspiciousActivityDetection: (req: Request, res: Response, next: NextFunction) => void | Response;
/**
 * Request ID Middleware
 *
 * Adds unique request ID for tracking and debugging.
 */
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.middleware.d.ts.map