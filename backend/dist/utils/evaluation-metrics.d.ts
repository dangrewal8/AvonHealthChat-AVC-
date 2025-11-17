/**
 * Evaluation Metrics System
 *
 * Implements evaluation metrics for RAG system quality assessment.
 * Includes precision, recall, F1, MRR, NDCG, and comprehensive reporting.
 *
 */
/**
 * Query evaluation result
 */
export interface QueryEvaluation {
    query_id: string;
    query: string;
    retrieved_ids: string[];
    ground_truth_ids: string[];
    metrics: {
        precision: number;
        recall: number;
        f1: number;
        mrr: number;
        ndcg: number;
    };
    passed: boolean;
    category?: string;
}
/**
 * Aggregate evaluation metrics
 */
export interface AggregateMetrics {
    total_queries: number;
    avg_precision: number;
    avg_recall: number;
    avg_f1: number;
    avg_mrr: number;
    avg_ndcg: number;
    pass_rate: number;
    by_category?: Record<string, CategoryMetrics>;
}
/**
 * Category-specific metrics
 */
export interface CategoryMetrics {
    query_count: number;
    avg_precision: number;
    avg_recall: number;
    avg_f1: number;
    pass_rate: number;
}
/**
 * Evaluation report
 */
export interface EvaluationReport {
    generated_at: string;
    total_queries: number;
    aggregate_metrics: AggregateMetrics;
    per_query_metrics: QueryEvaluation[];
    pass_criteria: PassCriteria;
    summary: {
        passed: number;
        failed: number;
        pass_rate: number;
    };
}
/**
 * Pass/fail criteria
 */
export interface PassCriteria {
    min_precision?: number;
    min_recall?: number;
    min_f1?: number;
    min_mrr?: number;
    min_ndcg?: number;
}
/**
 * EvaluationMetrics Class
 *
 * Provides comprehensive evaluation metrics for RAG system quality.
 */
export declare class EvaluationMetrics {
    private passCriteria;
    constructor(passCriteria?: PassCriteria);
    /**
     * Calculate Recall
     *
     * Recall = relevant retrieved / total relevant
     * Measures how many of the relevant items were retrieved
     *
     * @param retrieved - List of retrieved item IDs
     * @param groundTruth - List of ground truth relevant item IDs
     * @returns Recall score (0-1)
     */
    calculateRecall(retrieved: string[], groundTruth: string[]): number;
    /**
     * Calculate Precision
     *
     * Precision = relevant retrieved / total retrieved
     * Measures how many of the retrieved items are relevant
     *
     * @param retrieved - List of retrieved item IDs
     * @param groundTruth - List of ground truth relevant item IDs
     * @returns Precision score (0-1)
     */
    calculatePrecision(retrieved: string[], groundTruth: string[]): number;
    /**
     * Calculate F1 Score
     *
     * F1 = 2 * (precision * recall) / (precision + recall)
     * Harmonic mean of precision and recall
     *
     * @param precision - Precision score
     * @param recall - Recall score
     * @returns F1 score (0-1)
     */
    calculateF1(precision: number, recall: number): number;
    /**
     * Calculate Mean Reciprocal Rank (MRR)
     *
     * MRR = average of (1 / rank of first relevant item)
     * Measures how early the first relevant item appears
     *
     * @param rankings - Array of ranks where first relevant item appears (1-indexed)
     * @returns MRR score (0-1)
     *
     * @example
     * // First relevant item at position 1, 2, 3
     * calculateMRR([1, 2, 3])  // (1/1 + 1/2 + 1/3) / 3 = 0.611
     */
    calculateMRR(rankings: number[]): number;
    /**
     * Calculate Normalized Discounted Cumulative Gain (NDCG)
     *
     * NDCG measures ranking quality with position-based discount
     * Higher-ranked relevant items contribute more to the score
     *
     * @param retrieved - Relevance scores of retrieved items (in order)
     * @param ideal - Relevance scores in ideal order (best to worst)
     * @returns NDCG score (0-1)
     *
     * @example
     * // Retrieved: [3, 2, 1, 0], Ideal: [3, 2, 1, 0]
     * calculateNDCG([3, 2, 1, 0], [3, 2, 1, 0])  // 1.0 (perfect)
     *
     * // Retrieved: [1, 0, 3, 2], Ideal: [3, 2, 1, 0]
     * calculateNDCG([1, 0, 3, 2], [3, 2, 1, 0])  // ~0.785 (suboptimal)
     */
    calculateNDCG(retrieved: number[], ideal: number[]): number;
    /**
     * Calculate Discounted Cumulative Gain (DCG)
     *
     * DCG = sum(relevance_i / log2(i + 1))
     * Used internally by NDCG
     *
     * @param relevances - Array of relevance scores
     * @returns DCG score
     */
    private calculateDCG;
    /**
     * Find rank of first relevant item
     *
     * @param retrieved - Retrieved item IDs
     * @param groundTruth - Ground truth relevant item IDs
     * @returns Rank of first relevant item (1-indexed), or 0 if none found
     */
    private findFirstRelevantRank;
    /**
     * Calculate relevance scores for NDCG
     *
     * @param retrieved - Retrieved item IDs
     * @param groundTruth - Ground truth relevant item IDs with scores
     * @returns Array of relevance scores
     */
    private calculateRelevanceScores;
    /**
     * Evaluate a single query
     *
     * @param queryId - Query ID
     * @param query - Query text
     * @param retrieved - Retrieved item IDs
     * @param groundTruth - Ground truth relevant item IDs
     * @param category - Optional query category
     * @returns Query evaluation result
     */
    evaluateQuery(queryId: string, query: string, retrieved: string[], groundTruth: string[], category?: string): QueryEvaluation;
    /**
     * Check if metrics meet pass criteria
     */
    private checkPassCriteria;
    /**
     * Generate evaluation report from multiple queries
     *
     * @param evaluations - Array of query evaluations
     * @returns Comprehensive evaluation report
     */
    generateReport(evaluations: QueryEvaluation[]): EvaluationReport;
    /**
     * Calculate metrics by category
     */
    private calculateCategoryMetrics;
    /**
     * Export report to JSON
     *
     * @param report - Evaluation report
     * @param pretty - Pretty-print JSON (default: true)
     * @returns JSON string
     */
    exportToJSON(report: EvaluationReport, pretty?: boolean): string;
    /**
     * Export report to CSV
     *
     * @param report - Evaluation report
     * @returns CSV string
     */
    exportToCSV(report: EvaluationReport): string;
    /**
     * Escape CSV field
     */
    private escapeCSV;
    /**
     * Get summary statistics
     */
    getSummary(report: EvaluationReport): string;
}
/**
 * Create evaluation metrics instance
 */
export declare function createEvaluationMetrics(passCriteria?: PassCriteria): EvaluationMetrics;
export default EvaluationMetrics;
//# sourceMappingURL=evaluation-metrics.d.ts.map