/**
 * Unit Tests: EvaluationMetrics
 *
 * Tests for RAG system evaluation metrics.
 *
 * Tech Stack: Jest + TypeScript
 */

import {
  EvaluationMetrics,
  createEvaluationMetrics,
  QueryEvaluation,
} from '../../src/utils/evaluation-metrics';

describe('EvaluationMetrics', () => {
  let metrics: EvaluationMetrics;

  beforeEach(() => {
    metrics = createEvaluationMetrics();
  });

  describe('Constructor', () => {
    it('should create metrics with default pass criteria', () => {
      const m = createEvaluationMetrics();
      expect(m).toBeInstanceOf(EvaluationMetrics);
    });

    it('should create metrics with custom pass criteria', () => {
      const m = createEvaluationMetrics({
        min_precision: 0.8,
        min_recall: 0.8,
        min_f1: 0.8,
        min_mrr: 0.7,
        min_ndcg: 0.75,
      });

      expect(m).toBeInstanceOf(EvaluationMetrics);
    });
  });

  describe('calculatePrecision', () => {
    it('should calculate precision correctly', () => {
      const retrieved = ['doc1', 'doc2', 'doc3'];
      const groundTruth = ['doc1', 'doc3', 'doc4', 'doc5'];

      const precision = metrics.calculatePrecision(retrieved, groundTruth);

      // 2 relevant out of 3 retrieved = 2/3 = 0.6667
      expect(precision).toBeCloseTo(0.6667, 4);
    });

    it('should return 0 for empty retrieved list', () => {
      const precision = metrics.calculatePrecision([], ['doc1', 'doc2']);

      expect(precision).toBe(0);
    });

    it('should return 0 when no items match', () => {
      const precision = metrics.calculatePrecision(
        ['doc1', 'doc2'],
        ['doc3', 'doc4']
      );

      expect(precision).toBe(0);
    });

    it('should return 1.0 for perfect precision', () => {
      const retrieved = ['doc1', 'doc2', 'doc3'];
      const groundTruth = ['doc1', 'doc2', 'doc3', 'doc4'];

      const precision = metrics.calculatePrecision(retrieved, groundTruth);

      expect(precision).toBe(1.0);
    });
  });

  describe('calculateRecall', () => {
    it('should calculate recall correctly', () => {
      const retrieved = ['doc1', 'doc2', 'doc3'];
      const groundTruth = ['doc1', 'doc3', 'doc4', 'doc5'];

      const recall = metrics.calculateRecall(retrieved, groundTruth);

      // 2 relevant retrieved out of 4 total relevant = 2/4 = 0.5
      expect(recall).toBe(0.5);
    });

    it('should return 0 for empty ground truth', () => {
      const recall = metrics.calculateRecall(['doc1', 'doc2'], []);

      expect(recall).toBe(0);
    });

    it('should return 0 when no items match', () => {
      const recall = metrics.calculateRecall(['doc1', 'doc2'], ['doc3', 'doc4']);

      expect(recall).toBe(0);
    });

    it('should return 1.0 for perfect recall', () => {
      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4'];
      const groundTruth = ['doc1', 'doc2'];

      const recall = metrics.calculateRecall(retrieved, groundTruth);

      expect(recall).toBe(1.0);
    });
  });

  describe('calculateF1', () => {
    it('should calculate F1 score correctly', () => {
      const precision = 0.6667;
      const recall = 0.5;

      const f1 = metrics.calculateF1(precision, recall);

      // 2 * (0.6667 * 0.5) / (0.6667 + 0.5) = 0.5714
      expect(f1).toBeCloseTo(0.5714, 4);
    });

    it('should return 0 when precision and recall are both 0', () => {
      const f1 = metrics.calculateF1(0, 0);

      expect(f1).toBe(0);
    });

    it('should return 1.0 for perfect F1', () => {
      const f1 = metrics.calculateF1(1.0, 1.0);

      expect(f1).toBe(1.0);
    });

    it('should handle edge case of precision 0', () => {
      const f1 = metrics.calculateF1(0, 0.5);

      expect(f1).toBe(0);
    });

    it('should handle edge case of recall 0', () => {
      const f1 = metrics.calculateF1(0.5, 0);

      expect(f1).toBe(0);
    });
  });

  describe('calculateMRR', () => {
    it('should calculate MRR correctly', () => {
      const rankings = [1, 2, 3];

      const mrr = metrics.calculateMRR(rankings);

      // (1/1 + 1/2 + 1/3) / 3 = (1 + 0.5 + 0.333) / 3 = 0.611
      expect(mrr).toBeCloseTo(0.6111, 4);
    });

    it('should return 0 for empty rankings', () => {
      const mrr = metrics.calculateMRR([]);

      expect(mrr).toBe(0);
    });

    it('should return 1.0 when first relevant is always at position 1', () => {
      const mrr = metrics.calculateMRR([1, 1, 1, 1]);

      expect(mrr).toBe(1.0);
    });

    it('should handle rankings with 0 (no relevant found)', () => {
      const rankings = [1, 0, 2];

      const mrr = metrics.calculateMRR(rankings);

      // (1/1 + 0 + 1/2) / 3 = 0.5
      expect(mrr).toBe(0.5);
    });

    it('should calculate correctly for various positions', () => {
      const rankings = [1, 5, 10];

      const mrr = metrics.calculateMRR(rankings);

      // (1/1 + 1/5 + 1/10) / 3 = (1 + 0.2 + 0.1) / 3 = 0.433
      expect(mrr).toBeCloseTo(0.4333, 4);
    });
  });

  describe('calculateNDCG', () => {
    it('should return 1.0 for perfect ranking', () => {
      const perfect = [3, 2, 1, 0];
      const ideal = [3, 2, 1, 0];

      const ndcg = metrics.calculateNDCG(perfect, ideal);

      expect(ndcg).toBeCloseTo(1.0, 4);
    });

    it('should return lower score for suboptimal ranking', () => {
      const suboptimal = [1, 0, 3, 2];
      const ideal = [3, 2, 1, 0];

      const ndcg = metrics.calculateNDCG(suboptimal, ideal);

      expect(ndcg).toBeLessThan(1.0);
      expect(ndcg).toBeGreaterThan(0.5);
    });

    it('should return 0 for empty lists', () => {
      const ndcg = metrics.calculateNDCG([], []);

      expect(ndcg).toBe(0);
    });

    it('should return 0 for empty retrieved list', () => {
      const ndcg = metrics.calculateNDCG([], [3, 2, 1]);

      expect(ndcg).toBe(0);
    });

    it('should handle binary relevance (0 or 1)', () => {
      const retrieved = [1, 1, 0, 0];
      const ideal = [1, 1, 0, 0];

      const ndcg = metrics.calculateNDCG(retrieved, ideal);

      expect(ndcg).toBeCloseTo(1.0, 4);
    });
  });

  describe('evaluateQuery', () => {
    it('should evaluate a single query', () => {
      const evaluation = metrics.evaluateQuery(
        'q1',
        'Test query',
        ['doc1', 'doc2', 'doc3'],
        ['doc1', 'doc3', 'doc4'],
        'test'
      );

      expect(evaluation).toBeDefined();
      expect(evaluation.query_id).toBe('q1');
      expect(evaluation.query).toBe('Test query');
      expect(evaluation.category).toBe('test');
      expect(evaluation.metrics).toBeDefined();
      expect(evaluation.passed).toBeDefined();
    });

    it('should calculate all metrics', () => {
      const evaluation = metrics.evaluateQuery(
        'q1',
        'Test query',
        ['doc1', 'doc2'],
        ['doc1', 'doc2']
      );

      expect(evaluation.metrics.precision).toBe(1.0);
      expect(evaluation.metrics.recall).toBe(1.0);
      expect(evaluation.metrics.f1).toBe(1.0);
      expect(evaluation.metrics.mrr).toBeGreaterThan(0);
      expect(evaluation.metrics.ndcg).toBeGreaterThan(0);
    });

    it('should mark as passed when criteria met', () => {
      const m = createEvaluationMetrics({
        min_precision: 0.5,
        min_recall: 0.5,
        min_f1: 0.5,
        min_mrr: 0.5,
        min_ndcg: 0.5,
      });

      const evaluation = m.evaluateQuery(
        'q1',
        'Test',
        ['doc1', 'doc2'],
        ['doc1', 'doc2']
      );

      expect(evaluation.passed).toBe(true);
    });

    it('should mark as failed when criteria not met', () => {
      const m = createEvaluationMetrics({
        min_precision: 0.9,
        min_recall: 0.9,
        min_f1: 0.9,
      });

      const evaluation = m.evaluateQuery(
        'q1',
        'Test',
        ['doc1', 'doc2', 'doc3'],
        ['doc1', 'doc4', 'doc5', 'doc6']
      );

      expect(evaluation.passed).toBe(false);
    });
  });

  describe('generateReport', () => {
    it('should generate report from evaluations', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query 1', ['d1', 'd2'], ['d1', 'd2']),
        metrics.evaluateQuery('q2', 'Query 2', ['d1', 'd3'], ['d1', 'd2']),
      ];

      const report = metrics.generateReport(evaluations);

      expect(report).toBeDefined();
      expect(report.total_queries).toBe(2);
      expect(report.aggregate_metrics).toBeDefined();
      expect(report.per_query_metrics).toHaveLength(2);
      expect(report.summary).toBeDefined();
    });

    it('should calculate aggregate metrics', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query 1', ['d1', 'd2'], ['d1', 'd2']),
        metrics.evaluateQuery('q2', 'Query 2', ['d1'], ['d1', 'd2', 'd3']),
      ];

      const report = metrics.generateReport(evaluations);

      expect(report.aggregate_metrics.avg_precision).toBeGreaterThan(0);
      expect(report.aggregate_metrics.avg_recall).toBeGreaterThan(0);
      expect(report.aggregate_metrics.avg_f1).toBeGreaterThan(0);
      expect(report.aggregate_metrics.avg_mrr).toBeGreaterThan(0);
      expect(report.aggregate_metrics.avg_ndcg).toBeGreaterThan(0);
    });

    it('should calculate pass rate', () => {
      const m = createEvaluationMetrics({ min_f1: 0.8 });

      const evaluations = [
        m.evaluateQuery('q1', 'Q1', ['d1', 'd2'], ['d1', 'd2']), // pass
        m.evaluateQuery('q2', 'Q2', ['d1'], ['d1', 'd2', 'd3']), // fail
      ];

      const report = m.generateReport(evaluations);

      expect(report.summary.passed).toBe(1);
      expect(report.summary.failed).toBe(1);
      expect(report.summary.pass_rate).toBe(0.5);
    });

    it('should handle empty evaluations', () => {
      const report = metrics.generateReport([]);

      expect(report.total_queries).toBe(0);
      expect(report.aggregate_metrics.avg_precision).toBe(0);
      expect(report.summary.passed).toBe(0);
      expect(report.summary.failed).toBe(0);
    });

    it('should group by category', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Q1', ['d1'], ['d1'], 'medications'),
        metrics.evaluateQuery('q2', 'Q2', ['d1'], ['d1'], 'medications'),
        metrics.evaluateQuery('q3', 'Q3', ['d1'], ['d1'], 'labs'),
      ];

      const report = metrics.generateReport(evaluations);

      expect(report.aggregate_metrics.by_category).toBeDefined();
      expect(report.aggregate_metrics.by_category?.medications).toBeDefined();
      expect(report.aggregate_metrics.by_category?.labs).toBeDefined();
      expect(report.aggregate_metrics.by_category?.medications.query_count).toBe(2);
      expect(report.aggregate_metrics.by_category?.labs.query_count).toBe(1);
    });
  });

  describe('exportToJSON', () => {
    it('should export report to JSON', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query 1', ['d1'], ['d1']),
      ];

      const report = metrics.generateReport(evaluations);
      const json = metrics.exportToJSON(report);

      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should support pretty printing', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query 1', ['d1'], ['d1']),
      ];

      const report = metrics.generateReport(evaluations);
      const pretty = metrics.exportToJSON(report, true);
      const compact = metrics.exportToJSON(report, false);

      expect(pretty.length).toBeGreaterThan(compact.length);
      expect(pretty).toContain('\n');
      expect(compact).not.toContain('\n  ');
    });
  });

  describe('exportToCSV', () => {
    it('should export report to CSV', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query 1', ['d1'], ['d1'], 'test'),
        metrics.evaluateQuery('q2', 'Query 2', ['d1', 'd2'], ['d1', 'd3'], 'test'),
      ];

      const report = metrics.generateReport(evaluations);
      const csv = metrics.exportToCSV(report);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('query_id,query,precision,recall');
      expect(csv).toContain('q1');
      expect(csv).toContain('q2');
    });

    it('should include aggregate metrics', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query 1', ['d1'], ['d1']),
      ];

      const report = metrics.generateReport(evaluations);
      const csv = metrics.exportToCSV(report);

      expect(csv).toContain('# Aggregate Metrics');
      expect(csv).toContain('total_queries');
      expect(csv).toContain('avg_precision');
    });

    it('should escape special characters', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Query with "quotes" and, commas', ['d1'], ['d1']),
      ];

      const report = metrics.generateReport(evaluations);
      const csv = metrics.exportToCSV(report);

      expect(csv).toContain('"Query with ""quotes"" and, commas"');
    });
  });

  describe('getSummary', () => {
    it('should generate human-readable summary', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Q1', ['d1', 'd2'], ['d1', 'd2']),
        metrics.evaluateQuery('q2', 'Q2', ['d1'], ['d1', 'd2']),
      ];

      const report = metrics.generateReport(evaluations);
      const summary = metrics.getSummary(report);

      expect(typeof summary).toBe('string');
      expect(summary).toContain('Evaluation Summary');
      expect(summary).toContain('Total Queries');
      expect(summary).toContain('Precision');
      expect(summary).toContain('Recall');
      expect(summary).toContain('F1');
    });

    it('should include category breakdown if available', () => {
      const evaluations = [
        metrics.evaluateQuery('q1', 'Q1', ['d1'], ['d1'], 'medications'),
        metrics.evaluateQuery('q2', 'Q2', ['d1'], ['d1'], 'labs'),
      ];

      const report = metrics.generateReport(evaluations);
      const summary = metrics.getSummary(report);

      expect(summary).toContain('By Category');
      expect(summary).toContain('medications');
      expect(summary).toContain('labs');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all perfect scores', () => {
      const evaluation = metrics.evaluateQuery(
        'perfect',
        'Perfect query',
        ['d1', 'd2', 'd3'],
        ['d1', 'd2', 'd3']
      );

      expect(evaluation.metrics.precision).toBe(1.0);
      expect(evaluation.metrics.recall).toBe(1.0);
      expect(evaluation.metrics.f1).toBe(1.0);
      expect(evaluation.metrics.mrr).toBe(1.0);
      expect(evaluation.metrics.ndcg).toBeCloseTo(1.0, 4);
    });

    it('should handle all zero scores', () => {
      const evaluation = metrics.evaluateQuery(
        'zero',
        'Zero query',
        ['d1', 'd2'],
        ['d3', 'd4']
      );

      expect(evaluation.metrics.precision).toBe(0);
      expect(evaluation.metrics.recall).toBe(0);
      expect(evaluation.metrics.f1).toBe(0);
      expect(evaluation.metrics.mrr).toBe(0);
    });

    it('should handle empty retrieved list', () => {
      const evaluation = metrics.evaluateQuery(
        'empty',
        'Empty query',
        [],
        ['d1', 'd2']
      );

      expect(evaluation.metrics.precision).toBe(0);
      expect(evaluation.metrics.recall).toBe(0);
      expect(evaluation.metrics.f1).toBe(0);
    });

    it('should handle single-item lists', () => {
      const evaluation = metrics.evaluateQuery(
        'single',
        'Single query',
        ['d1'],
        ['d1']
      );

      expect(evaluation.metrics.precision).toBe(1.0);
      expect(evaluation.metrics.recall).toBe(1.0);
      expect(evaluation.metrics.f1).toBe(1.0);
    });
  });
});
