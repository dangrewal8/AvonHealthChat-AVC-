/**
 * Query Validation Middleware
 * Protects against prompt injection and malicious queries
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Validate query for security issues
 */
export function validateQuery(req: Request, res: Response, next: NextFunction): void {
  const { query, patient_id } = req.body;

  // Check required fields
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      error: 'Query is required and must be a string',
    });
    return;
  }

  if (!patient_id || typeof patient_id !== 'string') {
    res.status(400).json({
      error: 'patient_id is required and must be a string',
    });
    return;
  }

  // Length check
  if (query.length > 1000) {
    res.status(400).json({
      error: 'Query too long (max 1000 characters)',
      received: query.length,
    });
    return;
  }

  if (query.length < 3) {
    res.status(400).json({
      error: 'Query too short (min 3 characters)',
    });
    return;
  }

  // Prompt injection detection
  const dangerousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /disregard\s+(all\s+)?previous\s+instructions?/i,
    /system\s*:\s*/i,
    /you\s+are\s+now/i,
    /new\s+instructions?:/i,
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // HTML event handlers
    /eval\s*\(/i,
    /function\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      console.warn(`⚠️  Potential prompt injection detected: ${query.substring(0, 100)}`);
      res.status(400).json({
        error: 'Invalid query: potential security issue detected',
        hint: 'Please rephrase your medical question naturally',
      });
      return;
    }
  }

  // Patient ID format validation (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(patient_id)) {
    res.status(400).json({
      error: 'Invalid patient_id format',
      hint: 'patient_id should contain only alphanumeric characters, hyphens, and underscores',
    });
    return;
  }

  next();
}

/**
 * Sanitize query (remove potentially harmful characters)
 */
export function sanitizeQuery(query: string): string {
  // Remove control characters
  let sanitized = query.replace(/[\x00-\x1F\x7F]/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}
