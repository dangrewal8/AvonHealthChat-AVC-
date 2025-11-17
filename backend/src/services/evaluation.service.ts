/**
 * Evaluation Service
 *
 * Service for managing human evaluations of RAG pipeline responses.
 * Handles storage, retrieval, aggregation, and reporting.
 *
 */

import {
  HumanEvaluation,
  SubmitEvaluationRequest,
  SubmitEvaluationResponse,
  GetEvaluationsQuery,
  GetEvaluationsResponse,
  EvaluationStatistics,
  EvaluationReport,
  CriterionStats,
  RatingScore,
} from '../types/evaluation.types';
import { randomUUID } from 'crypto';

/**
 * EvaluationService Class
 *
 * Manages human evaluations with in-memory storage.
 * In production, this would use a persistent database.
 */
export class EvaluationService {
  /**
   * In-memory storage for evaluations
   * In production, replace with database storage
   */
  private evaluations: HumanEvaluation[] = [];

  /**
   * Submit a new evaluation
   */
  submitEvaluation(request: SubmitEvaluationRequest): SubmitEvaluationResponse {
    const evaluation: HumanEvaluation = {
      evaluation_id: randomUUID(),
      query_id: request.query_id,
      query_text: request.query_text,
      response: request.response,
      ratings: request.ratings,
      issues: request.issues || [],
      notes: request.notes || '',
      evaluator: request.evaluator,
      timestamp: new Date().toISOString(),
    };

    this.evaluations.push(evaluation);

    return {
      evaluation_id: evaluation.evaluation_id!,
      timestamp: evaluation.timestamp,
      message: 'Evaluation submitted successfully',
    };
  }

  /**
   * Get evaluations with optional filtering
   */
  getEvaluations(query: GetEvaluationsQuery = {}): GetEvaluationsResponse {
    let filtered = [...this.evaluations];

    // Filter by query_id
    if (query.query_id) {
      filtered = filtered.filter((e) => e.query_id === query.query_id);
    }

    // Filter by evaluator
    if (query.evaluator) {
      filtered = filtered.filter((e) => e.evaluator === query.evaluator);
    }

    // Filter by minimum rating (any criterion)
    if (query.min_rating !== undefined) {
      filtered = filtered.filter((e) => {
        const avgRating = this.calculateAverageRating(e.ratings);
        return avgRating >= query.min_rating!;
      });
    }

    // Filter by maximum rating (any criterion)
    if (query.max_rating !== undefined) {
      filtered = filtered.filter((e) => {
        const avgRating = this.calculateAverageRating(e.ratings);
        return avgRating <= query.max_rating!;
      });
    }

    // Filter by date range
    if (query.start_date) {
      const startDate = new Date(query.start_date);
      filtered = filtered.filter((e) => new Date(e.timestamp) >= startDate);
    }

    if (query.end_date) {
      const endDate = new Date(query.end_date);
      filtered = filtered.filter((e) => new Date(e.timestamp) <= endDate);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const total_count = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      evaluations: paginated,
      total_count,
      limit,
      offset,
    };
  }

  /**
   * Get a single evaluation by ID
   */
  getEvaluationById(evaluationId: string): HumanEvaluation | null {
    return (
      this.evaluations.find((e) => e.evaluation_id === evaluationId) || null
    );
  }

  /**
   * Calculate statistics from all evaluations
   */
  calculateStatistics(): EvaluationStatistics {
    if (this.evaluations.length === 0) {
      return this.getEmptyStatistics();
    }

    const uniqueEvaluators = new Set(
      this.evaluations.map((e) => e.evaluator)
    ).size;
    const uniqueQueries = new Set(this.evaluations.map((e) => e.query_id)).size;

    // Calculate statistics for each criterion
    const criteria = {
      accuracy: this.calculateCriterionStats('accuracy'),
      completeness: this.calculateCriterionStats('completeness'),
      citation_quality: this.calculateCriterionStats('citation_quality'),
      relevance: this.calculateCriterionStats('relevance'),
    };

    // Calculate overall average
    const overallAverage =
      (criteria.accuracy.mean +
        criteria.completeness.mean +
        criteria.citation_quality.mean +
        criteria.relevance.mean) /
      4;

    // Calculate common issues
    const issueMap = new Map<string, number>();
    this.evaluations.forEach((e) => {
      e.issues.forEach((issue) => {
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
      });
    });

    const totalIssues = Array.from(issueMap.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const commonIssues = Array.from(issueMap.entries())
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: totalIssues > 0 ? (count / totalIssues) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 issues

    // Calculate time range
    const timestamps = this.evaluations.map((e) => new Date(e.timestamp));
    const earliest = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const latest = new Date(Math.max(...timestamps.map((t) => t.getTime())));

    return {
      total_evaluations: this.evaluations.length,
      unique_evaluators: uniqueEvaluators,
      unique_queries: uniqueQueries,
      criteria,
      overall_average: Math.round(overallAverage * 100) / 100,
      common_issues: commonIssues,
      time_range: {
        earliest: earliest.toISOString(),
        latest: latest.toISOString(),
      },
    };
  }

  /**
   * Generate comprehensive evaluation report
   */
  generateReport(): EvaluationReport {
    const statistics = this.calculateStatistics();

    // Calculate average rating per query
    const queryRatings = new Map<
      string,
      { query_text: string; ratings: number[]; count: number }
    >();

    this.evaluations.forEach((e) => {
      const avgRating = this.calculateAverageRating(e.ratings);
      const existing = queryRatings.get(e.query_id);

      if (existing) {
        existing.ratings.push(avgRating);
        existing.count++;
      } else {
        queryRatings.set(e.query_id, {
          query_text: e.query_text,
          ratings: [avgRating],
          count: 1,
        });
      }
    });

    // Calculate average rating per query
    const queryAverages = Array.from(queryRatings.entries()).map(
      ([query_id, data]) => ({
        query_id,
        query_text: data.query_text,
        average_rating:
          Math.round(
            (data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length) *
              100
          ) / 100,
        evaluation_count: data.count,
      })
    );

    // Sort by average rating
    const sortedByRating = [...queryAverages].sort(
      (a, b) => a.average_rating - b.average_rating
    );

    return {
      statistics,
      evaluations: this.evaluations,
      lowest_rated_queries: sortedByRating.slice(0, 10),
      highest_rated_queries: sortedByRating.slice(-10).reverse(),
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Export evaluations to CSV format
   */
  exportToCSV(): string {
    const headers = [
      'Evaluation ID',
      'Query ID',
      'Query Text',
      'Accuracy',
      'Completeness',
      'Citation Quality',
      'Relevance',
      'Average Rating',
      'Issues',
      'Notes',
      'Evaluator',
      'Timestamp',
    ];

    const rows = this.evaluations.map((e) => {
      const avgRating = this.calculateAverageRating(e.ratings);
      return [
        e.evaluation_id || '',
        e.query_id,
        `"${e.query_text.replace(/"/g, '""')}"`, // Escape quotes
        e.ratings.accuracy.toString(),
        e.ratings.completeness.toString(),
        e.ratings.citation_quality.toString(),
        e.ratings.relevance.toString(),
        avgRating.toFixed(2),
        `"${e.issues.join('; ').replace(/"/g, '""')}"`,
        `"${e.notes.replace(/"/g, '""')}"`,
        e.evaluator,
        e.timestamp,
      ];
    });

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  /**
   * Export evaluations to JSON format
   */
  exportToJSON(pretty: boolean = true): string {
    const data = {
      generated_at: new Date().toISOString(),
      total_evaluations: this.evaluations.length,
      evaluations: this.evaluations,
    };

    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Clear all evaluations (for testing purposes)
   */
  clearEvaluations(): void {
    this.evaluations = [];
  }

  /**
   * Get total number of evaluations
   */
  getTotalCount(): number {
    return this.evaluations.length;
  }

  // Private helper methods

  /**
   * Calculate statistics for a single criterion
   */
  private calculateCriterionStats(
    criterion: keyof HumanEvaluation['ratings']
  ): CriterionStats {
    const values = this.evaluations.map((e) => e.ratings[criterion]);

    if (values.length === 0) {
      return this.getEmptyCriterionStats();
    }

    // Calculate mean
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // Calculate mode
    const frequency = new Map<number, number>();
    values.forEach((v) => {
      frequency.set(v, (frequency.get(v) || 0) + 1);
    });
    const mode = Array.from(frequency.entries()).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0];

    // Calculate standard deviation
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    // Calculate distribution
    const distribution = {
      1: values.filter((v) => v === 1).length,
      2: values.filter((v) => v === 2).length,
      3: values.filter((v) => v === 3).length,
      4: values.filter((v) => v === 4).length,
      5: values.filter((v) => v === 5).length,
    };

    return {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      mode,
      stddev: Math.round(stddev * 100) / 100,
      distribution,
    };
  }

  /**
   * Calculate average rating across all criteria
   */
  private calculateAverageRating(
    ratings: HumanEvaluation['ratings']
  ): number {
    return (
      (ratings.accuracy +
        ratings.completeness +
        ratings.citation_quality +
        ratings.relevance) /
      4
    );
  }

  /**
   * Get empty statistics object
   */
  private getEmptyStatistics(): EvaluationStatistics {
    return {
      total_evaluations: 0,
      unique_evaluators: 0,
      unique_queries: 0,
      criteria: {
        accuracy: this.getEmptyCriterionStats(),
        completeness: this.getEmptyCriterionStats(),
        citation_quality: this.getEmptyCriterionStats(),
        relevance: this.getEmptyCriterionStats(),
      },
      overall_average: 0,
      common_issues: [],
      time_range: {
        earliest: new Date().toISOString(),
        latest: new Date().toISOString(),
      },
    };
  }

  /**
   * Get empty criterion statistics object
   */
  private getEmptyCriterionStats(): CriterionStats {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      stddev: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }
}

/**
 * Singleton instance of EvaluationService
 */
export const evaluationService = new EvaluationService();
