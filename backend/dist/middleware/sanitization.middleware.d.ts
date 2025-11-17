/**
 * Input Sanitization Middleware
 *
 * Sanitizes user inputs to prevent injection attacks.
 *
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Sanitize string by removing potentially harmful characters
 */
export declare const sanitizeString: (str: string) => string;
/**
 * Recursively sanitize object
 */
export declare const sanitizeObject: (obj: any) => any;
/**
 * Generic Input Sanitization Middleware
 *
 * Sanitizes common attack patterns from all requests.
 */
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Content Type Validation
 *
 * Ensures requests have correct Content-Type header.
 */
export declare const validateContentType: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request Size Validation
 *
 * Validates request payload is not too large.
 * Note: This is a secondary check, primary limit is in express.json({ limit })
 */
export declare const validateRequestSize: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=sanitization.middleware.d.ts.map