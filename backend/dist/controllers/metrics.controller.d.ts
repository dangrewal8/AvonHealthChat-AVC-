/**
 * Metrics Controller
 * Provides performance and usage metrics for monitoring
 */
import { Request, Response } from 'express';
import { MetricsResponse } from '../types/api.types';
declare class MetricsController {
    /**
     * GET /api/metrics
     * Returns current performance and usage metrics
     */
    get(_req: Request, res: Response<MetricsResponse>): void;
    /**
     * Middleware to track request metrics
     */
    trackRequest(req: Request, res: Response, next: Function): void;
    /**
     * Record query processing time
     */
    recordQueryTime(time: number): void;
    /**
     * Record retrieval time
     */
    recordRetrievalTime(time: number): void;
    /**
     * Record generation time
     */
    recordGenerationTime(time: number): void;
}
export declare const metricsController: MetricsController;
export default metricsController;
//# sourceMappingURL=metrics.controller.d.ts.map