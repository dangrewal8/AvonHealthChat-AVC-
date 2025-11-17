/**
 * Security Middleware
 *
 * Comprehensive security middleware for Express application including
 * helmet for security headers and CORS configuration.
 *
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Helmet Security Headers Configuration
 *
 * Configures various security headers to protect against common vulnerabilities.
 */
export const helmetConfig = helmet({
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
export const corsConfig = cors({
  // Allowed origins
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://localhost',
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
export const httpsEnforcement = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

/**
 * Security Headers Middleware
 *
 * Adds additional custom security headers.
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options (additional layer)
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict-Transport-Security (if not using helmet)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
};

/**
 * Request Logging Middleware (for security monitoring)
 *
 * Logs all incoming requests for security auditing.
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(
    `[SECURITY] ${timestamp} - ${method} ${url} from ${ip}`
  );

  next();
};

/**
 * Suspicious Activity Detection
 *
 * Detects and blocks potentially malicious requests.
 */
export const suspiciousActivityDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
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

  const checkString = (str: string): boolean => {
    return suspiciousPatterns.some((pattern) => pattern.test(str));
  };

  // Check URL
  if (checkString(req.url)) {
    console.error(`[SECURITY] Suspicious URL detected: ${req.url} from ${req.ip}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Check query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string' && checkString(req.query[key] as string)) {
      console.error(
        `[SECURITY] Suspicious query parameter detected: ${key}=${req.query[key]} from ${req.ip}`
      );
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

/**
 * Request ID Middleware
 *
 * Adds unique request ID for tracking and debugging.
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
};
