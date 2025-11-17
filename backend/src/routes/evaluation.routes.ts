/**
 * Evaluation Routes
 *
 * API endpoints for human evaluation operations.
 *
 */

import { Router } from 'express';
import { evaluationController } from '../controllers/evaluation.controller';

/**
 * Create evaluation routes
 */
export function createEvaluationRoutes(): Router {
  const router = Router();

  /**
   * Submit a new evaluation
   *
   * POST /api/evaluations
   *
   * Request body:
   * {
   *   query_id: string,
   *   query_text: string,
   *   response: UIResponse,
   *   ratings: {
   *     accuracy: 1 | 2 | 3 | 4 | 5,
   *     completeness: 1 | 2 | 3 | 4 | 5,
   *     citation_quality: 1 | 2 | 3 | 4 | 5,
   *     relevance: 1 | 2 | 3 | 4 | 5
   *   },
   *   issues?: string[],
   *   notes?: string,
   *   evaluator: string
   * }
   */
  router.post('/', (req, res) => evaluationController.submitEvaluation(req, res));

  /**
   * Get evaluations with optional filtering
   *
   * GET /api/evaluations
   *
   * Query parameters:
   * - query_id?: string
   * - evaluator?: string
   * - min_rating?: number
   * - max_rating?: number
   * - start_date?: string (ISO 8601)
   * - end_date?: string (ISO 8601)
   * - limit?: number
   * - offset?: number
   */
  router.get('/', (req, res) => evaluationController.getEvaluations(req, res));

  /**
   * Get evaluation statistics
   *
   * GET /api/evaluations/statistics
   */
  router.get('/statistics', (req, res) =>
    evaluationController.getStatistics(req, res)
  );

  /**
   * Generate evaluation report
   *
   * GET /api/evaluations/report
   */
  router.get('/report', (req, res) =>
    evaluationController.generateReport(req, res)
  );

  /**
   * Export evaluations to CSV
   *
   * GET /api/evaluations/export/csv
   */
  router.get('/export/csv', (req, res) =>
    evaluationController.exportCSV(req, res)
  );

  /**
   * Export evaluations to JSON
   *
   * GET /api/evaluations/export/json
   *
   * Query parameters:
   * - pretty?: boolean (default: true)
   */
  router.get('/export/json', (req, res) =>
    evaluationController.exportJSON(req, res)
  );

  /**
   * Get a single evaluation by ID
   *
   * GET /api/evaluations/:id
   */
  router.get('/:id', (req, res) =>
    evaluationController.getEvaluationById(req, res)
  );

  return router;
}
