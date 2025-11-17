/**
 * Enhanced Query Routes (Phase 7 Integration)
 *
 * Routes for enrichment-enabled RAG queries
 */

import { Router } from 'express';
import enhancedQueryController from '../controllers/enhanced-query.controller';

const router = Router();

/**
 * POST /api/query/enhanced
 * Enhanced RAG query with multi-hop retrieval and reasoning prompts
 */
router.post('/enhanced', (req, res) => enhancedQueryController.search(req, res));

/**
 * GET /api/query/enrichment/config
 * Get current enrichment configuration
 */
router.get('/enrichment/config', (req, res) => enhancedQueryController.getConfig(req, res));

/**
 * POST /api/query/enrichment/test
 * A/B test: Compare standard vs. enhanced retrieval
 */
router.post('/enrichment/test', (req, res) => enhancedQueryController.testEnrichment(req, res));

export default router;
