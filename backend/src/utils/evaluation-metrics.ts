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
export class EvaluationMetrics {
  private passCriteria: PassCriteria;

  constructor(passCriteria: PassCriteria = {}) {
    this.passCriteria = {
      min_precision: passCriteria.min_precision ?? 0.7,
      min_recall: passCriteria.min_recall ?? 0.7,
      min_f1: passCriteria.min_f1 ?? 0.7,
      min_mrr: passCriteria.min_mrr ?? 0.5,
      min_ndcg: passCriteria.min_ndcg ?? 0.6,
    };
  }

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
  calculateRecall(retrieved: string[], groundTruth: string[]): number {
    if (groundTruth.length === 0) return 0;

    const relevantRetrieved = retrieved.filter((id) => groundTruth.includes(id));
    return relevantRetrieved.length / groundTruth.length;
  }

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
  calculatePrecision(retrieved: string[], groundTruth: string[]): number {
    if (retrieved.length === 0) return 0;

    const relevantRetrieved = retrieved.filter((id) => groundTruth.includes(id));
    return relevantRetrieved.length / retrieved.length;
  }

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
  calculateF1(precision: number, recall: number): number {
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
  }

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
  calculateMRR(rankings: number[]): number {
    if (rankings.length === 0) return 0;

    const reciprocalRanks = rankings.map((rank) => (rank > 0 ? 1 / rank : 0));
    const sum = reciprocalRanks.reduce((acc, val) => acc + val, 0);

    return sum / rankings.length;
  }

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
  calculateNDCG(retrieved: number[], ideal: number[]): number {
    if (retrieved.length === 0 || ideal.length === 0) return 0;

    const dcg = this.calculateDCG(retrieved);
    const idcg = this.calculateDCG(ideal);

    if (idcg === 0) return 0;

    return dcg / idcg;
  }

  /**
   * Calculate Discounted Cumulative Gain (DCG)
   *
   * DCG = sum(relevance_i / log2(i + 1))
   * Used internally by NDCG
   *
   * @param relevances - Array of relevance scores
   * @returns DCG score
   */
  private calculateDCG(relevances: number[]): number {
    return relevances.reduce((sum, rel, index) => {
      const position = index + 1;
      const discount = Math.log2(position + 1);
      return sum + rel / discount;
    }, 0);
  }

  /**
   * Find rank of first relevant item
   *
   * @param retrieved - Retrieved item IDs
   * @param groundTruth - Ground truth relevant item IDs
   * @returns Rank of first relevant item (1-indexed), or 0 if none found
   */
  private findFirstRelevantRank(retrieved: string[], groundTruth: string[]): number {
    for (let i = 0; i < retrieved.length; i++) {
      if (groundTruth.includes(retrieved[i])) {
        return i + 1; // 1-indexed
      }
    }
    return 0; // No relevant item found
  }

  /**
   * Calculate relevance scores for NDCG
   *
   * @param retrieved - Retrieved item IDs
   * @param groundTruth - Ground truth relevant item IDs with scores
   * @returns Array of relevance scores
   */
  private calculateRelevanceScores(
    retrieved: string[],
    groundTruth: Map<string, number>
  ): number[] {
    return retrieved.map((id) => groundTruth.get(id) ?? 0);
  }

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
  evaluateQuery(
    queryId: string,
    query: string,
    retrieved: string[],
    groundTruth: string[],
    category?: string
  ): QueryEvaluation {
    // Calculate basic metrics
    const precision = this.calculatePrecision(retrieved, groundTruth);
    const recall = this.calculateRecall(retrieved, groundTruth);
    const f1 = this.calculateF1(precision, recall);

    // Calculate MRR
    const firstRelevantRank = this.findFirstRelevantRank(retrieved, groundTruth);
    const mrr = firstRelevantRank > 0 ? 1 / firstRelevantRank : 0;

    // Calculate NDCG (binary relevance: 1 if relevant, 0 if not)
    const retrievedScores = retrieved.map((id) => (groundTruth.includes(id) ? 1 : 0));
    const idealScores = Array(Math.min(retrieved.length, groundTruth.length)).fill(1);
    const ndcg = this.calculateNDCG(retrievedScores, idealScores);

    // Check pass criteria
    const passed = this.checkPassCriteria({
      precision,
      recall,
      f1,
      mrr,
      ndcg,
    });

    return {
      query_id: queryId,
      query,
      retrieved_ids: retrieved,
      ground_truth_ids: groundTruth,
      metrics: {
        precision,
        recall,
        f1,
        mrr,
        ndcg,
      },
      passed,
      category,
    };
  }

  /**
   * Check if metrics meet pass criteria
   */
  private checkPassCriteria(metrics: {
    precision: number;
    recall: number;
    f1: number;
    mrr: number;
    ndcg: number;
  }): boolean {
    const checks = [
      metrics.precision >= (this.passCriteria.min_precision ?? 0),
      metrics.recall >= (this.passCriteria.min_recall ?? 0),
      metrics.f1 >= (this.passCriteria.min_f1 ?? 0),
      metrics.mrr >= (this.passCriteria.min_mrr ?? 0),
      metrics.ndcg >= (this.passCriteria.min_ndcg ?? 0),
    ];

    return checks.every((check) => check);
  }

  /**
   * Generate evaluation report from multiple queries
   *
   * @param evaluations - Array of query evaluations
   * @returns Comprehensive evaluation report
   */
  generateReport(evaluations: QueryEvaluation[]): EvaluationReport {
    if (evaluations.length === 0) {
      return {
        generated_at: new Date().toISOString(),
        total_queries: 0,
        aggregate_metrics: {
          total_queries: 0,
          avg_precision: 0,
          avg_recall: 0,
          avg_f1: 0,
          avg_mrr: 0,
          avg_ndcg: 0,
          pass_rate: 0,
        },
        per_query_metrics: [],
        pass_criteria: this.passCriteria,
        summary: {
          passed: 0,
          failed: 0,
          pass_rate: 0,
        },
      };
    }

    // Calculate aggregate metrics
    const totalQueries = evaluations.length;
    const passedQueries = evaluations.filter((e) => e.passed).length;

    const avgPrecision =
      evaluations.reduce((sum, e) => sum + e.metrics.precision, 0) / totalQueries;
    const avgRecall =
      evaluations.reduce((sum, e) => sum + e.metrics.recall, 0) / totalQueries;
    const avgF1 = evaluations.reduce((sum, e) => sum + e.metrics.f1, 0) / totalQueries;
    const avgMRR = evaluations.reduce((sum, e) => sum + e.metrics.mrr, 0) / totalQueries;
    const avgNDCG = evaluations.reduce((sum, e) => sum + e.metrics.ndcg, 0) / totalQueries;

    const passRate = passedQueries / totalQueries;

    // Calculate by-category metrics
    const byCategory = this.calculateCategoryMetrics(evaluations);

    return {
      generated_at: new Date().toISOString(),
      total_queries: totalQueries,
      aggregate_metrics: {
        total_queries: totalQueries,
        avg_precision: avgPrecision,
        avg_recall: avgRecall,
        avg_f1: avgF1,
        avg_mrr: avgMRR,
        avg_ndcg: avgNDCG,
        pass_rate: passRate,
        by_category: byCategory,
      },
      per_query_metrics: evaluations,
      pass_criteria: this.passCriteria,
      summary: {
        passed: passedQueries,
        failed: totalQueries - passedQueries,
        pass_rate: passRate,
      },
    };
  }

  /**
   * Calculate metrics by category
   */
  private calculateCategoryMetrics(
    evaluations: QueryEvaluation[]
  ): Record<string, CategoryMetrics> {
    const categories: Record<string, QueryEvaluation[]> = {};

    // Group by category
    evaluations.forEach((eval) => {
      const category = eval.category ?? 'uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(eval);
    });

    // Calculate metrics for each category
    const result: Record<string, CategoryMetrics> = {};

    Object.entries(categories).forEach(([category, evals]) => {
      const queryCount = evals.length;
      const passed = evals.filter((e) => e.passed).length;

      result[category] = {
        query_count: queryCount,
        avg_precision: evals.reduce((sum, e) => sum + e.metrics.precision, 0) / queryCount,
        avg_recall: evals.reduce((sum, e) => sum + e.metrics.recall, 0) / queryCount,
        avg_f1: evals.reduce((sum, e) => sum + e.metrics.f1, 0) / queryCount,
        pass_rate: passed / queryCount,
      };
    });

    return result;
  }

  /**
   * Export report to JSON
   *
   * @param report - Evaluation report
   * @param pretty - Pretty-print JSON (default: true)
   * @returns JSON string
   */
  exportToJSON(report: EvaluationReport, pretty: boolean = true): string {
    return pretty ? JSON.stringify(report, null, 2) : JSON.stringify(report);
  }

  /**
   * Export report to CSV
   *
   * @param report - Evaluation report
   * @returns CSV string
   */
  exportToCSV(report: EvaluationReport): string {
    const lines: string[] = [];

    // Header
    lines.push(
      'query_id,query,precision,recall,f1,mrr,ndcg,passed,category'
    );

    // Per-query data
    report.per_query_metrics.forEach((eval) => {
      const row = [
        this.escapeCSV(eval.query_id),
        this.escapeCSV(eval.query),
        eval.metrics.precision.toFixed(4),
        eval.metrics.recall.toFixed(4),
        eval.metrics.f1.toFixed(4),
        eval.metrics.mrr.toFixed(4),
        eval.metrics.ndcg.toFixed(4),
        eval.passed ? 'true' : 'false',
        this.escapeCSV(eval.category ?? ''),
      ];
      lines.push(row.join(','));
    });

    // Aggregate summary
    lines.push('');
    lines.push('# Aggregate Metrics');
    lines.push('metric,value');
    lines.push(`total_queries,${report.total_queries}`);
    lines.push(`avg_precision,${report.aggregate_metrics.avg_precision.toFixed(4)}`);
    lines.push(`avg_recall,${report.aggregate_metrics.avg_recall.toFixed(4)}`);
    lines.push(`avg_f1,${report.aggregate_metrics.avg_f1.toFixed(4)}`);
    lines.push(`avg_mrr,${report.aggregate_metrics.avg_mrr.toFixed(4)}`);
    lines.push(`avg_ndcg,${report.aggregate_metrics.avg_ndcg.toFixed(4)}`);
    lines.push(`pass_rate,${report.aggregate_metrics.pass_rate.toFixed(4)}`);

    return lines.join('\n');
  }

  /**
   * Escape CSV field
   */
  private escapeCSV(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Get summary statistics
   */
  getSummary(report: EvaluationReport): string {
    const lines: string[] = [];

    lines.push('=== Evaluation Summary ===');
    lines.push('');
    lines.push(`Generated: ${report.generated_at}`);
    lines.push(`Total Queries: ${report.total_queries}`);
    lines.push('');
    lines.push('Aggregate Metrics:');
    lines.push(`  Precision: ${(report.aggregate_metrics.avg_precision * 100).toFixed(2)}%`);
    lines.push(`  Recall:    ${(report.aggregate_metrics.avg_recall * 100).toFixed(2)}%`);
    lines.push(`  F1:        ${(report.aggregate_metrics.avg_f1 * 100).toFixed(2)}%`);
    lines.push(`  MRR:       ${(report.aggregate_metrics.avg_mrr * 100).toFixed(2)}%`);
    lines.push(`  NDCG:      ${(report.aggregate_metrics.avg_ndcg * 100).toFixed(2)}%`);
    lines.push('');
    lines.push('Pass/Fail:');
    lines.push(`  Passed: ${report.summary.passed} (${(report.summary.pass_rate * 100).toFixed(2)}%)`);
    lines.push(`  Failed: ${report.summary.failed}`);

    if (report.aggregate_metrics.by_category) {
      lines.push('');
      lines.push('By Category:');
      Object.entries(report.aggregate_metrics.by_category).forEach(([category, metrics]) => {
        lines.push(`  ${category}:`);
        lines.push(`    Queries: ${metrics.query_count}`);
        lines.push(`    F1:      ${(metrics.avg_f1 * 100).toFixed(2)}%`);
        lines.push(`    Pass:    ${(metrics.pass_rate * 100).toFixed(2)}%`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Create evaluation metrics instance
 */
export function createEvaluationMetrics(passCriteria?: PassCriteria): EvaluationMetrics {
  return new EvaluationMetrics(passCriteria);
}

export default EvaluationMetrics;
