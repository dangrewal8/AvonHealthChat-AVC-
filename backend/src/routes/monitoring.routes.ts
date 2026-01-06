/**
 * Monitoring Routes
 * Safe addition - new endpoints for hallucination tracking
 * Doesn't modify existing functionality
 */

import { Router, Request, Response } from 'express';
import { answerValidator } from '../services/answer-validator.service';

const router = Router();

/**
 * GET /monitoring/hallucinations
 * Get hallucination metrics
 */
router.get('/hallucinations', (_req: Request, res: Response): void => {
  try {
    const metrics = answerValidator.getMetrics();
    const rate = answerValidator.getHallucinationRate();

    res.json({
      status: 'ok',
      metrics: {
        ...metrics,
        hallucination_rate: `${rate.toFixed(2)}%`,
        threshold_warning: rate > 5 ? 'HIGH HALLUCINATION RATE - INVESTIGATE' : 'Normal'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve hallucination metrics',
      message: error.message
    });
  }
});

/**
 * GET /monitoring/health/detailed
 * Enhanced health check with hallucination metrics
 */
router.get('/health/detailed', async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = answerValidator.getMetrics();
    const rate = answerValidator.getHallucinationRate();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'avon-health-rag-backend',
      anti_hallucination: {
        total_hallucinations_detected: metrics.total,
        corrected: metrics.byCorrected.corrected,
        not_corrected: metrics.byCorrected.notCorrected,
        hallucination_rate: `${rate.toFixed(2)}%`,
        status: rate > 5 ? 'WARNING' : 'HEALTHY',
        by_data_type: metrics.byDataType
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

export default router;
