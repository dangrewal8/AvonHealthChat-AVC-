"use strict";
/**
 * Evaluation Routes
 *
 * API endpoints for human evaluation operations.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvaluationRoutes = createEvaluationRoutes;
const express_1 = require("express");
const evaluation_controller_1 = require("../controllers/evaluation.controller");
/**
 * Create evaluation routes
 */
function createEvaluationRoutes() {
    const router = (0, express_1.Router)();
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
    router.post('/', (req, res) => evaluation_controller_1.evaluationController.submitEvaluation(req, res));
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
    router.get('/', (req, res) => evaluation_controller_1.evaluationController.getEvaluations(req, res));
    /**
     * Get evaluation statistics
     *
     * GET /api/evaluations/statistics
     */
    router.get('/statistics', (req, res) => evaluation_controller_1.evaluationController.getStatistics(req, res));
    /**
     * Generate evaluation report
     *
     * GET /api/evaluations/report
     */
    router.get('/report', (req, res) => evaluation_controller_1.evaluationController.generateReport(req, res));
    /**
     * Export evaluations to CSV
     *
     * GET /api/evaluations/export/csv
     */
    router.get('/export/csv', (req, res) => evaluation_controller_1.evaluationController.exportCSV(req, res));
    /**
     * Export evaluations to JSON
     *
     * GET /api/evaluations/export/json
     *
     * Query parameters:
     * - pretty?: boolean (default: true)
     */
    router.get('/export/json', (req, res) => evaluation_controller_1.evaluationController.exportJSON(req, res));
    /**
     * Get a single evaluation by ID
     *
     * GET /api/evaluations/:id
     */
    router.get('/:id', (req, res) => evaluation_controller_1.evaluationController.getEvaluationById(req, res));
    return router;
}
//# sourceMappingURL=evaluation.routes.js.map