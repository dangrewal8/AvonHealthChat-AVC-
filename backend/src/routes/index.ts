/**
 * Consolidated API Routes
 * Main router that combines all API endpoints
 */

import express, { Router } from 'express';
import emrRoutes from './emr.routes';
import authRoutes from './auth.routes';
import enhancedQueryRoutes from './enhanced-query.routes';
import { createEvaluationRoutes } from './evaluation.routes';
import { createHealthRouter } from './health.routes';
import queryController from '../controllers/query.controller';
import indexingController from '../controllers/indexing.controller';
import metricsController from '../controllers/metrics.controller';
import {
  validateQueryRequest,
  validateRecentQueriesRequest,
  validatePatientIdParam,
  validateIndexRequest,
} from '../middleware/validation.middleware';

/**
 * Create and configure the main application router
 */
export const createRouter = (): Router => {
  const router = express.Router();

  // ========================================================================
  // Query Endpoints
  // ========================================================================

  /**
   * POST /api/query
   * Process a natural language query against patient EMR data
   */
  router.post('/api/query', validateQueryRequest, queryController.search.bind(queryController));

  /**
   * POST /api/query/stream
   * Process query with Server-Sent Events for real-time progress updates
   * Streams 3 stages: query_understanding, retrieval, generation
   */
  router.post('/api/query/stream', validateQueryRequest, queryController.searchStream.bind(queryController));

  /**
   * GET /api/queries/recent
   * Get recent queries for a patient
   */
  router.get(
    '/api/queries/recent',
    validateRecentQueriesRequest,
    queryController.getRecent.bind(queryController)
  );

  // ========================================================================
  // Enhanced Query Endpoints (Phase 7 Integration)
  // ========================================================================

  /**
   * Enhanced query routes with multi-hop retrieval and reasoning:
   * - POST /api/query/enhanced - Enhanced RAG query with enrichment
   * - GET /api/query/enrichment/config - Get enrichment configuration
   * - POST /api/query/enrichment/test - A/B test standard vs. enhanced
   */
  router.use('/api/query', enhancedQueryRoutes);

  // ========================================================================
  // Human Evaluation Endpoints
  // ========================================================================

  /**
   * All evaluation routes:
   * - POST /api/evaluations - Submit new evaluation
   * - GET /api/evaluations - Get evaluations with filtering
   * - GET /api/evaluations/statistics - Get evaluation statistics
   * - GET /api/evaluations/report - Generate evaluation report
   * - GET /api/evaluations/export/csv - Export to CSV
   * - GET /api/evaluations/export/json - Export to JSON
   * - GET /api/evaluations/:id - Get single evaluation by ID
   */
  router.use('/api/evaluations', createEvaluationRoutes());

  // ========================================================================
  // EMR Data Endpoints (existing)
  // ========================================================================

  /**
   * All EMR data routes:
   * - GET /api/emr/care_plans
   * - GET /api/emr/medications
   * - GET /api/emr/notes
   * - GET /api/emr/all
   * - DELETE /api/emr/cache
   * - DELETE /api/emr/cache/:patientId
   * - GET /api/emr/cache/stats
   */
  router.use('/api/emr', emrRoutes);

  // ========================================================================
  // Authentication Endpoints (existing)
  // ========================================================================

  /**
   * All auth routes:
   * - GET /api/auth/status
   * - POST /api/auth/refresh
   * - GET /api/auth/test
   */
  router.use('/api/auth', authRoutes);

  // ========================================================================
  // Indexing Endpoints
  // ========================================================================

  /**
   * POST /api/index/patient/:patientId
   * Index all EMR data for a patient
   */
  router.post(
    '/api/index/patient/:patientId',
    validatePatientIdParam,
    validateIndexRequest,
    indexingController.indexPatient.bind(indexingController)
  );

  /**
   * DELETE /api/index/patient/:patientId
   * Clear all indexed data for a patient
   */
  router.delete(
    '/api/index/patient/:patientId',
    validatePatientIdParam,
    indexingController.clearPatient.bind(indexingController)
  );

  // ========================================================================
  // Health & Monitoring Endpoints
  // ========================================================================

  /**
   * All health check routes:
   * - GET /health - Comprehensive health check
   * - GET /health/live - Liveness probe (is app running?)
   * - GET /health/ready - Readiness probe (can app handle requests?)
   * - GET /health/metrics - Application and system metrics
   * - GET /health/system - System metrics only
   */
  router.use(createHealthRouter());

  /**
   * GET /api/metrics
   * Performance and usage metrics (legacy endpoint)
   */
  router.get('/api/metrics', metricsController.get.bind(metricsController));

  return router;
};

export default createRouter;
