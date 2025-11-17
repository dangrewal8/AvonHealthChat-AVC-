"use strict";
/**
 * Security Middleware
 *
 * Comprehensive security middleware for Express application including
 * helmet for security headers and CORS configuration.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = exports.suspiciousActivityDetection = exports.securityLogger = exports.securityHeaders = exports.httpsEnforcement = exports.corsConfig = exports.helmetConfig = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
/**
 * Helmet Security Headers Configuration
 *
 * Configures various security headers to protect against common vulnerabilities.
 */
exports.helmetConfig = (0, helmet_1.default)({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://demo-api.avonhealth.com', 'http://localhost:11434'],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    // HTTP Strict Transport Security (HSTS)
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },
    // X-Frame-Options
    frameguard: {
        action: 'deny',
    },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection
    xssFilter: true,
    // Referrer-Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // DNS Prefetch Control
    dnsPrefetchControl: {
        allow: false,
    },
    // Download Options (IE8+)
    ieNoOpen: true,
});
/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing to allow frontend access.
 */
exports.corsConfig = (0, cors_1.default)({
    // Allowed origins
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost',
        ];
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    // Allow credentials (cookies, authorization headers)
    credentials: true,
    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Allowed headers
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],
    // Expose headers to client
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    // Preflight request cache time (24 hours)
    maxAge: 86400,
    // Success status for preflight requests
    optionsSuccessStatus: 204,
});
/**
 * HTTPS Enforcement Middleware
 *
 * Redirects HTTP requests to HTTPS in production.
 */
const httpsEnforcement = (req, res, next) => {
    // Skip in development
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    // Check if request is secure
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }
    // Redirect to HTTPS
    res.redirect(301, `https://${req.headers.host}${req.url}`);
};
exports.httpsEnforcement = httpsEnforcement;
/**
 * Security Headers Middleware
 *
 * Adds additional custom security headers.
 */
const securityHeaders = (req, res, next) => {
    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // X-Frame-Options (additional layer)
    res.setHeader('X-Frame-Options', 'DENY');
    // X-XSS-Protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Strict-Transport-Security (if not using helmet)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * Request Logging Middleware (for security monitoring)
 *
 * Logs all incoming requests for security auditing.
 */
const securityLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[SECURITY] ${timestamp} - ${method} ${url} from ${ip}`);
    next();
};
exports.securityLogger = securityLogger;
/**
 * Suspicious Activity Detection
 *
 * Detects and blocks potentially malicious requests.
 */
const suspiciousActivityDetection = (req, res, next) => {
    const suspiciousPatterns = [
        // SQL Injection patterns
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /(\bOR\b|\bAND\b).*?=.*?/i,
        /UNION.*?SELECT/i,
        /DROP.*?TABLE/i,
        // XSS patterns
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /onerror\s*=/gi,
        /onload\s*=/gi,
        // Path traversal
        /\.\.\//g,
        /\.\.\\/g,
    ];
    const checkString = (str) => {
        return suspiciousPatterns.some((pattern) => pattern.test(str));
    };
    // Check URL
    if (checkString(req.url)) {
        console.error(`[SECURITY] Suspicious URL detected: ${req.url} from ${req.ip}`);
        return res.status(403).json({ error: 'Forbidden' });
    }
    // Check query parameters
    for (const key in req.query) {
        if (typeof req.query[key] === 'string' && checkString(req.query[key])) {
            console.error(`[SECURITY] Suspicious query parameter detected: ${key}=${req.query[key]} from ${req.ip}`);
            return res.status(403).json({ error: 'Forbidden' });
        }
    }
    // Check body
    if (req.body && typeof req.body === 'object') {
        const bodyStr = JSON.stringify(req.body);
        if (checkString(bodyStr)) {
            console.error(`[SECURITY] Suspicious request body detected from ${req.ip}`);
            return res.status(403).json({ error: 'Forbidden' });
        }
    }
    next();
};
exports.suspiciousActivityDetection = suspiciousActivityDetection;
/**
 * Request ID Middleware
 *
 * Adds unique request ID for tracking and debugging.
 */
const requestId = (req, res, next) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = id;
    res.setHeader('X-Request-ID', id);
    next();
};
exports.requestId = requestId;
//# sourceMappingURL=security.middleware.js.map