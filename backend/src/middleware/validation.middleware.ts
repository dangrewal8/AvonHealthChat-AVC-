/**
 * Request Validation Middleware
 * Validates incoming requests before processing
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/api.types';

/**
 * Validate POST /api/query request
 */
export const validateQueryRequest = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const { query, patient_id, options } = req.body;

  // Validate query string
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'query field is required and must be a string',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (query.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'query cannot be empty',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (query.length > 500) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'query must be 500 characters or less',
      details: { query_length: query.length, max_length: 500 },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate patient_id
  if (!patient_id || typeof patient_id !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'patient_id is required and must be a string',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate options if provided
  if (options) {
    if (options.detail_level !== undefined) {
      const level = options.detail_level;
      if (typeof level !== 'number' || level < 1 || level > 5) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'detail_level must be a number between 1 and 5',
          details: { provided: level },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    if (options.max_results !== undefined) {
      const max = options.max_results;
      if (typeof max !== 'number' || max < 1 || max > 100) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'max_results must be a number between 1 and 100',
          details: { provided: max },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
  }

  next();
};

/**
 * Validate patient_id query parameter
 */
export const validatePatientId = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const { patient_id } = req.query;

  if (!patient_id || typeof patient_id !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'patient_id query parameter is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (patient_id.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'patient_id cannot be empty',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Validate patient_id path parameter
 */
export const validatePatientIdParam = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const { patientId } = req.params;

  if (!patientId || typeof patientId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'patientId path parameter is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (patientId.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'patientId cannot be empty',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Validate GET /api/queries/recent request
 */
export const validateRecentQueriesRequest = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const { patient_id, limit } = req.query;

  // Validate patient_id
  if (!patient_id || typeof patient_id !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'patient_id query parameter is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate limit if provided
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'limit must be a number between 1 and 100',
        details: { provided: limit },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  next();
};

/**
 * Validate POST /api/index/patient/:patientId request body
 */
export const validateIndexRequest = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const { force_reindex } = req.body;

  if (force_reindex !== undefined && typeof force_reindex !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'force_reindex must be a boolean',
      details: { provided: force_reindex },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Generic error handler middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  // Check for timeout errors
  if (err.message.includes('timeout')) {
    res.status(504).json({
      success: false,
      error: 'Gateway Timeout',
      message: 'Request took longer than 6 seconds to process',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check for authentication errors
  if (err.message.includes('auth') || err.message.includes('token')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check for not found errors
  if (err.message.includes('not found')) {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check for rate limit errors
  if (err.message.includes('rate limit')) {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please retry after a delay.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString(),
  });
};
