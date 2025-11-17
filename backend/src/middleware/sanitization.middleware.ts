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
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/['"]/g, '') // Remove quotes to prevent SQL injection
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Recursively sanitize object
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Generic Input Sanitization Middleware
 *
 * Sanitizes common attack patterns from all requests.
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Content Type Validation
 *
 * Ensures requests have correct Content-Type header.
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip for GET, DELETE, HEAD, OPTIONS
  if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const contentType = req.headers['content-type'];

  if (!contentType || !contentType.includes('application/json')) {
    res.status(415).json({
      error: 'Unsupported Media Type',
      message: 'Content-Type must be application/json',
      status: 415,
    });
    return;
  }

  next();
};

/**
 * Request Size Validation
 *
 * Validates request payload is not too large.
 * Note: This is a secondary check, primary limit is in express.json({ limit })
 */
export const validateRequestSize = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = req.headers['content-length'];

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (size > maxSize) {
      res.status(413).json({
        error: 'Payload Too Large',
        message: 'Maximum request size is 10MB',
        status: 413,
      });
      return;
    }
  }

  next();
};
