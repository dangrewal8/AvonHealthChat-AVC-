"use strict";
/**
 * Input Sanitization Middleware
 *
 * Sanitizes user inputs to prevent injection attacks.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestSize = exports.validateContentType = exports.sanitizeInput = exports.sanitizeObject = exports.sanitizeString = void 0;
/**
 * Sanitize string by removing potentially harmful characters
 */
const sanitizeString = (str) => {
    return str
        .replace(/[<>]/g, '') // Remove < and > to prevent XSS
        .replace(/['"]/g, '') // Remove quotes to prevent SQL injection
        .trim(); // Remove leading/trailing whitespace
};
exports.sanitizeString = sanitizeString;
/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return (0, exports.sanitizeString)(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(exports.sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = (0, exports.sanitizeObject)(obj[key]);
            }
        }
        return sanitized;
    }
    return obj;
};
exports.sanitizeObject = sanitizeObject;
/**
 * Generic Input Sanitization Middleware
 *
 * Sanitizes common attack patterns from all requests.
 */
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = (0, exports.sanitizeObject)(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = (0, exports.sanitizeObject)(req.query);
    }
    // Sanitize params
    if (req.params) {
        req.params = (0, exports.sanitizeObject)(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Content Type Validation
 *
 * Ensures requests have correct Content-Type header.
 */
const validateContentType = (req, res, next) => {
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
exports.validateContentType = validateContentType;
/**
 * Request Size Validation
 *
 * Validates request payload is not too large.
 * Note: This is a secondary check, primary limit is in express.json({ limit })
 */
const validateRequestSize = (req, res, next) => {
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
exports.validateRequestSize = validateRequestSize;
//# sourceMappingURL=sanitization.middleware.js.map