/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Basic health check
 * GET /health
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'avon-health-rag-backend',
  });
});

/**
 * Detailed health check
 * GET /health/detailed
 */
router.get('/health/detailed', async (_req: Request, res: Response): Promise<void> => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'avon-health-rag-backend',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  res.status(200).json(health);
});

export default router;
