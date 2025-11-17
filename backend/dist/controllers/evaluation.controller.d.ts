/**
 * Evaluation Controller
 *
 * HTTP request handlers for human evaluation endpoints.
 *
 */
import { Request, Response } from 'express';
/**
 * EvaluationController Class
 *
 * Handles HTTP requests for evaluation operations.
 */
export declare class EvaluationController {
    /**
     * Submit a new evaluation
     *
     * POST /api/evaluations
     */
    submitEvaluation(req: Request, res: Response): void;
    /**
     * Get evaluations with optional filtering
     *
     * GET /api/evaluations
     */
    getEvaluations(req: Request, res: Response): void;
    /**
     * Get a single evaluation by ID
     *
     * GET /api/evaluations/:id
     */
    getEvaluationById(req: Request, res: Response): void;
    /**
     * Get evaluation statistics
     *
     * GET /api/evaluations/statistics
     */
    getStatistics(req: Request, res: Response): void;
    /**
     * Generate evaluation report
     *
     * GET /api/evaluations/report
     */
    generateReport(req: Request, res: Response): void;
    /**
     * Export evaluations to CSV
     *
     * GET /api/evaluations/export/csv
     */
    exportCSV(req: Request, res: Response): void;
    /**
     * Export evaluations to JSON
     *
     * GET /api/evaluations/export/json
     */
    exportJSON(req: Request, res: Response): void;
    /**
     * Helper method to validate rating score
     */
    private isValidRating;
}
/**
 * Singleton instance of EvaluationController
 */
export declare const evaluationController: EvaluationController;
//# sourceMappingURL=evaluation.controller.d.ts.map