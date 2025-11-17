/**
 * Request Validation Middleware
 * Validates incoming requests before processing
 */
import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/api.types';
/**
 * Validate POST /api/query request
 */
export declare const validateQueryRequest: (req: Request, res: Response<ErrorResponse>, next: NextFunction) => void;
/**
 * Validate patient_id query parameter
 */
export declare const validatePatientId: (req: Request, res: Response<ErrorResponse>, next: NextFunction) => void;
/**
 * Validate patient_id path parameter
 */
export declare const validatePatientIdParam: (req: Request, res: Response<ErrorResponse>, next: NextFunction) => void;
/**
 * Validate GET /api/queries/recent request
 */
export declare const validateRecentQueriesRequest: (req: Request, res: Response<ErrorResponse>, next: NextFunction) => void;
/**
 * Validate POST /api/index/patient/:patientId request body
 */
export declare const validateIndexRequest: (req: Request, res: Response<ErrorResponse>, next: NextFunction) => void;
/**
 * Generic error handler middleware
 */
export declare const errorHandler: (err: Error, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map