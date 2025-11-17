/**
 * Health Check Controller
 * Provides health and status information for the service
 */
import { Request, Response } from 'express';
import { HealthCheckResponse } from '../types/api.types';
declare class HealthController {
    /**
     * GET /health
     * Returns health status of the service and its dependencies
     */
    check(_req: Request, res: Response<HealthCheckResponse>): Promise<void>;
    /**
     * Check Avon Health API availability
     */
    private checkAvonAPI;
}
export declare const healthController: HealthController;
export default healthController;
//# sourceMappingURL=health.controller.d.ts.map