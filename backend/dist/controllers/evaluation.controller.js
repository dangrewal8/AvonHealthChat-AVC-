"use strict";
/**
 * Evaluation Controller
 *
 * HTTP request handlers for human evaluation endpoints.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationController = exports.EvaluationController = void 0;
const evaluation_service_1 = require("../services/evaluation.service");
/**
 * EvaluationController Class
 *
 * Handles HTTP requests for evaluation operations.
 */
class EvaluationController {
    /**
     * Submit a new evaluation
     *
     * POST /api/evaluations
     */
    submitEvaluation(req, res) {
        try {
            const request = req.body;
            // Validate required fields
            if (!request.query_id) {
                res.status(400).json({
                    error: 'Missing required field: query_id',
                    status: 400,
                });
                return;
            }
            if (!request.query_text) {
                res.status(400).json({
                    error: 'Missing required field: query_text',
                    status: 400,
                });
                return;
            }
            if (!request.response) {
                res.status(400).json({
                    error: 'Missing required field: response',
                    status: 400,
                });
                return;
            }
            if (!request.ratings) {
                res.status(400).json({
                    error: 'Missing required field: ratings',
                    status: 400,
                });
                return;
            }
            // Validate ratings
            const { accuracy, completeness, citation_quality, relevance } = request.ratings;
            if (!this.isValidRating(accuracy)) {
                res.status(400).json({
                    error: 'Invalid accuracy rating. Must be 1, 2, 3, 4, or 5',
                    status: 400,
                });
                return;
            }
            if (!this.isValidRating(completeness)) {
                res.status(400).json({
                    error: 'Invalid completeness rating. Must be 1, 2, 3, 4, or 5',
                    status: 400,
                });
                return;
            }
            if (!this.isValidRating(citation_quality)) {
                res.status(400).json({
                    error: 'Invalid citation_quality rating. Must be 1, 2, 3, 4, or 5',
                    status: 400,
                });
                return;
            }
            if (!this.isValidRating(relevance)) {
                res.status(400).json({
                    error: 'Invalid relevance rating. Must be 1, 2, 3, 4, or 5',
                    status: 400,
                });
                return;
            }
            if (!request.evaluator) {
                res.status(400).json({
                    error: 'Missing required field: evaluator',
                    status: 400,
                });
                return;
            }
            // Submit evaluation
            const result = evaluation_service_1.evaluationService.submitEvaluation(request);
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Error submitting evaluation:', error);
            res.status(500).json({
                error: 'Failed to submit evaluation',
                status: 500,
            });
        }
    }
    /**
     * Get evaluations with optional filtering
     *
     * GET /api/evaluations
     */
    getEvaluations(req, res) {
        try {
            const query = {
                query_id: req.query.query_id,
                evaluator: req.query.evaluator,
                min_rating: req.query.min_rating
                    ? Number(req.query.min_rating)
                    : undefined,
                max_rating: req.query.max_rating
                    ? Number(req.query.max_rating)
                    : undefined,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
                offset: req.query.offset ? Number(req.query.offset) : undefined,
            };
            const result = evaluation_service_1.evaluationService.getEvaluations(query);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error retrieving evaluations:', error);
            res.status(500).json({
                error: 'Failed to retrieve evaluations',
                status: 500,
            });
        }
    }
    /**
     * Get a single evaluation by ID
     *
     * GET /api/evaluations/:id
     */
    getEvaluationById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'Missing evaluation ID',
                    status: 400,
                });
                return;
            }
            const evaluation = evaluation_service_1.evaluationService.getEvaluationById(id);
            if (!evaluation) {
                res.status(404).json({
                    error: 'Evaluation not found',
                    status: 404,
                });
                return;
            }
            res.status(200).json(evaluation);
        }
        catch (error) {
            console.error('Error retrieving evaluation:', error);
            res.status(500).json({
                error: 'Failed to retrieve evaluation',
                status: 500,
            });
        }
    }
    /**
     * Get evaluation statistics
     *
     * GET /api/evaluations/statistics
     */
    getStatistics(req, res) {
        try {
            const statistics = evaluation_service_1.evaluationService.calculateStatistics();
            res.status(200).json(statistics);
        }
        catch (error) {
            console.error('Error calculating statistics:', error);
            res.status(500).json({
                error: 'Failed to calculate statistics',
                status: 500,
            });
        }
    }
    /**
     * Generate evaluation report
     *
     * GET /api/evaluations/report
     */
    generateReport(req, res) {
        try {
            const report = evaluation_service_1.evaluationService.generateReport();
            res.status(200).json(report);
        }
        catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({
                error: 'Failed to generate report',
                status: 500,
            });
        }
    }
    /**
     * Export evaluations to CSV
     *
     * GET /api/evaluations/export/csv
     */
    exportCSV(req, res) {
        try {
            const csv = evaluation_service_1.evaluationService.exportToCSV();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="evaluations-${new Date().toISOString()}.csv"`);
            res.status(200).send(csv);
        }
        catch (error) {
            console.error('Error exporting to CSV:', error);
            res.status(500).json({
                error: 'Failed to export to CSV',
                status: 500,
            });
        }
    }
    /**
     * Export evaluations to JSON
     *
     * GET /api/evaluations/export/json
     */
    exportJSON(req, res) {
        try {
            const pretty = req.query.pretty === 'true';
            const json = evaluation_service_1.evaluationService.exportToJSON(pretty);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="evaluations-${new Date().toISOString()}.json"`);
            res.status(200).send(json);
        }
        catch (error) {
            console.error('Error exporting to JSON:', error);
            res.status(500).json({
                error: 'Failed to export to JSON',
                status: 500,
            });
        }
    }
    /**
     * Helper method to validate rating score
     */
    isValidRating(rating) {
        return [1, 2, 3, 4, 5].includes(rating);
    }
}
exports.EvaluationController = EvaluationController;
/**
 * Singleton instance of EvaluationController
 */
exports.evaluationController = new EvaluationController();
//# sourceMappingURL=evaluation.controller.js.map