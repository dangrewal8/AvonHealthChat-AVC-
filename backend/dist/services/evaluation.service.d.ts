/**
 * Evaluation Service
 *
 * Service for managing human evaluations of RAG pipeline responses.
 * Handles storage, retrieval, aggregation, and reporting.
 *
 */
import { HumanEvaluation, SubmitEvaluationRequest, SubmitEvaluationResponse, GetEvaluationsQuery, GetEvaluationsResponse, EvaluationStatistics, EvaluationReport } from '../types/evaluation.types';
/**
 * EvaluationService Class
 *
 * Manages human evaluations with in-memory storage.
 * In production, this would use a persistent database.
 */
export declare class EvaluationService {
    /**
     * In-memory storage for evaluations
     * In production, replace with database storage
     */
    private evaluations;
    /**
     * Submit a new evaluation
     */
    submitEvaluation(request: SubmitEvaluationRequest): SubmitEvaluationResponse;
    /**
     * Get evaluations with optional filtering
     */
    getEvaluations(query?: GetEvaluationsQuery): GetEvaluationsResponse;
    /**
     * Get a single evaluation by ID
     */
    getEvaluationById(evaluationId: string): HumanEvaluation | null;
    /**
     * Calculate statistics from all evaluations
     */
    calculateStatistics(): EvaluationStatistics;
    /**
     * Generate comprehensive evaluation report
     */
    generateReport(): EvaluationReport;
    /**
     * Export evaluations to CSV format
     */
    exportToCSV(): string;
    /**
     * Export evaluations to JSON format
     */
    exportToJSON(pretty?: boolean): string;
    /**
     * Clear all evaluations (for testing purposes)
     */
    clearEvaluations(): void;
    /**
     * Get total number of evaluations
     */
    getTotalCount(): number;
    /**
     * Calculate statistics for a single criterion
     */
    private calculateCriterionStats;
    /**
     * Calculate average rating across all criteria
     */
    private calculateAverageRating;
    /**
     * Get empty statistics object
     */
    private getEmptyStatistics;
    /**
     * Get empty criterion statistics object
     */
    private getEmptyCriterionStats;
}
/**
 * Singleton instance of EvaluationService
 */
export declare const evaluationService: EvaluationService;
//# sourceMappingURL=evaluation.service.d.ts.map