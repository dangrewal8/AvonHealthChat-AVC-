/**
 * Golden Dataset Evaluator
 *
 * Functions for evaluating RAG pipeline results against golden dataset ground truth.
 *
 */

import {
  GoldenDataset,
  GoldenDatasetEntry,
  EvaluationResult,
  DatasetEvaluationReport,
  DatasetCategory,
} from '../types/golden-dataset.types';
import { UIResponse } from '../types/query.types';

/**
 * Calculate recall@k
 * What fraction of relevant items were retrieved in top k?
 */
export function calculateRecall(
  retrievedIds: string[],
  relevantIds: string[],
  k: number = 5
): number {
  if (relevantIds.length === 0) {
    return 1.0; // Perfect recall for negative queries
  }

  const topK = retrievedIds.slice(0, k);
  const retrievedRelevant = topK.filter((id) => relevantIds.includes(id));

  return retrievedRelevant.length / relevantIds.length;
}

/**
 * Calculate precision@k
 * What fraction of retrieved items in top k are relevant?
 */
export function calculatePrecision(
  retrievedIds: string[],
  relevantIds: string[],
  k: number = 5
): number {
  const topK = retrievedIds.slice(0, k);

  if (topK.length === 0) {
    return relevantIds.length === 0 ? 1.0 : 0.0;
  }

  const retrievedRelevant = topK.filter((id) => relevantIds.includes(id));

  return retrievedRelevant.length / topK.length;
}

/**
 * Calculate F1 score for extractions
 */
export function calculateExtractionF1(
  actualExtractions: any[],
  expectedExtractions: any[]
): { f1: number; precision: number; recall: number } {
  if (expectedExtractions.length === 0 && actualExtractions.length === 0) {
    return { f1: 1.0, precision: 1.0, recall: 1.0 };
  }

  if (expectedExtractions.length === 0) {
    return { f1: 0.0, precision: 0.0, recall: 1.0 };
  }

  if (actualExtractions.length === 0) {
    return { f1: 0.0, precision: 1.0, recall: 0.0 };
  }

  // Count matches based on extraction type and key fields
  let matches = 0;
  for (const expected of expectedExtractions) {
    const found = actualExtractions.some((actual) =>
      extractionsMatch(actual, expected)
    );
    if (found) matches++;
  }

  const precision = matches / actualExtractions.length;
  const recall = matches / expectedExtractions.length;

  const f1 =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { f1, precision, recall };
}

/**
 * Check if two extractions match
 */
function extractionsMatch(actual: any, expected: any): boolean {
  // Match on type
  if (actual.type !== expected.type) return false;

  // Type-specific matching logic
  switch (expected.type) {
    case 'medication_recommendation':
      return (
        actual.medication?.toLowerCase() ===
          expected.medication?.toLowerCase() &&
        actual.intent === expected.intent
      );

    case 'care_plan':
      return actual.condition?.toLowerCase() === expected.condition?.toLowerCase();

    default:
      // Generic matching on type only
      return true;
  }
}

/**
 * Calculate citation accuracy
 * What fraction of citations point to correct artifacts?
 */
export function calculateCitationAccuracy(
  actualCitations: Array<{ artifact_id: string }>,
  relevantIds: string[]
): number {
  if (actualCitations.length === 0) {
    return relevantIds.length === 0 ? 1.0 : 0.0;
  }

  const correctCitations = actualCitations.filter((citation) =>
    relevantIds.includes(citation.artifact_id)
  );

  return correctCitations.length / actualCitations.length;
}

/**
 * Evaluate a single query result against golden dataset entry
 */
export function evaluateQueryResult(
  entry: GoldenDatasetEntry,
  result: UIResponse,
  retrievedArtifactIds: string[]
): EvaluationResult {
  const startTime = Date.now();

  // Retrieval metrics
  const recall_at_5 = calculateRecall(
    retrievedArtifactIds,
    entry.ground_truth.relevant_artifact_ids,
    5
  );

  const precision_at_5 = calculatePrecision(
    retrievedArtifactIds,
    entry.ground_truth.relevant_artifact_ids,
    5
  );

  const retrievedRelevant = retrievedArtifactIds
    .slice(0, 5)
    .filter((id) => entry.ground_truth.relevant_artifact_ids.includes(id));

  const missedRelevant = entry.ground_truth.relevant_artifact_ids.filter(
    (id) => !retrievedArtifactIds.slice(0, 5).includes(id)
  );

  const falsePositives = retrievedArtifactIds
    .slice(0, 5)
    .filter((id) => !entry.ground_truth.relevant_artifact_ids.includes(id));

  // Extraction metrics
  // Note: In real implementation, extract structured data from result
  const actualExtractions: any[] = []; // Would extract from result
  const { f1, precision, recall } = calculateExtractionF1(
    actualExtractions,
    entry.ground_truth.expected_extractions
  );

  // Citation metrics
  const citationAccuracy = calculateCitationAccuracy(
    result.provenance || [],
    entry.ground_truth.relevant_artifact_ids
  );

  const correctCitations = (result.provenance || []).filter((p) =>
    entry.ground_truth.relevant_artifact_ids.includes(p.artifact_id)
  ).length;

  const incorrectCitations =
    (result.provenance || []).length - correctCitations;

  const missingCitations = Math.max(
    0,
    entry.ground_truth.expected_sources_min - correctCitations
  );

  // Check acceptance criteria
  const failedCriteria: string[] = [];

  if (recall_at_5 < entry.acceptance_criteria.recall_at_5_min) {
    failedCriteria.push(
      `Recall@5: ${recall_at_5.toFixed(2)} < ${entry.acceptance_criteria.recall_at_5_min}`
    );
  }

  if (precision_at_5 < entry.acceptance_criteria.precision_at_5_min) {
    failedCriteria.push(
      `Precision@5: ${precision_at_5.toFixed(2)} < ${entry.acceptance_criteria.precision_at_5_min}`
    );
  }

  if (f1 < entry.acceptance_criteria.extraction_f1_min) {
    failedCriteria.push(
      `Extraction F1: ${f1.toFixed(2)} < ${entry.acceptance_criteria.extraction_f1_min}`
    );
  }

  if (citationAccuracy < entry.acceptance_criteria.citation_accuracy_min) {
    failedCriteria.push(
      `Citation Accuracy: ${citationAccuracy.toFixed(2)} < ${entry.acceptance_criteria.citation_accuracy_min}`
    );
  }

  if (result.confidence < entry.ground_truth.expected_confidence_min) {
    failedCriteria.push(
      `Confidence: ${result.confidence.toFixed(2)} < ${entry.ground_truth.expected_confidence_min}`
    );
  }

  const passes = failedCriteria.length === 0;
  const executionTime = Date.now() - startTime;

  return {
    entry_id: entry.id,
    query: entry.query,
    retrieval: {
      recall_at_5,
      precision_at_5,
      retrieved_relevant: retrievedRelevant,
      missed_relevant: missedRelevant,
      false_positives: falsePositives,
    },
    extraction: {
      f1_score: f1,
      precision,
      recall,
      matched_extractions: Math.round(
        recall * entry.ground_truth.expected_extractions.length
      ),
      expected_extractions: entry.ground_truth.expected_extractions.length,
      actual_extractions: actualExtractions.length,
    },
    citation: {
      accuracy: citationAccuracy,
      correct_citations: correctCitations,
      incorrect_citations: incorrectCitations,
      missing_citations: missingCitations,
    },
    confidence: result.confidence,
    passes,
    failed_criteria: failedCriteria,
    execution_time_ms: executionTime,
  };
}

/**
 * Evaluate entire dataset
 */
export async function evaluateDataset(
  dataset: GoldenDataset,
  queryExecutor: (
    query: string,
    patientId: string
  ) => Promise<{ result: UIResponse; retrievedIds: string[] }>
): Promise<DatasetEvaluationReport> {
  const results: EvaluationResult[] = [];
  let passedCount = 0;

  // Evaluate each entry
  for (const entry of dataset.entries) {
    try {
      const { result, retrievedIds } = await queryExecutor(
        entry.query,
        entry.patient_id
      );

      const evaluation = evaluateQueryResult(entry, result, retrievedIds);
      results.push(evaluation);

      if (evaluation.passes) {
        passedCount++;
      }
    } catch (error) {
      console.error(`Error evaluating entry ${entry.id}:`, error);
      // Add failed result
      results.push({
        entry_id: entry.id,
        query: entry.query,
        retrieval: {
          recall_at_5: 0,
          precision_at_5: 0,
          retrieved_relevant: [],
          missed_relevant: entry.ground_truth.relevant_artifact_ids,
          false_positives: [],
        },
        extraction: {
          f1_score: 0,
          precision: 0,
          recall: 0,
          matched_extractions: 0,
          expected_extractions: entry.ground_truth.expected_extractions.length,
          actual_extractions: 0,
        },
        citation: {
          accuracy: 0,
          correct_citations: 0,
          incorrect_citations: 0,
          missing_citations: entry.ground_truth.expected_sources_min,
        },
        confidence: 0,
        passes: false,
        failed_criteria: ['Execution error'],
        execution_time_ms: 0,
      });
    }
  }

  // Calculate aggregate metrics
  const totalResults = results.length;
  const meanRecall =
    results.reduce((sum, r) => sum + r.retrieval.recall_at_5, 0) /
    totalResults;
  const meanPrecision =
    results.reduce((sum, r) => sum + r.retrieval.precision_at_5, 0) /
    totalResults;
  const meanF1 =
    results.reduce((sum, r) => sum + r.extraction.f1_score, 0) / totalResults;
  const meanCitationAccuracy =
    results.reduce((sum, r) => sum + r.citation.accuracy, 0) / totalResults;
  const meanConfidence =
    results.reduce((sum, r) => sum + r.confidence, 0) / totalResults;
  const meanExecutionTime =
    results.reduce((sum, r) => sum + r.execution_time_ms, 0) / totalResults;

  // Per-category breakdown
  const categoryBreakdown: Record<
    DatasetCategory,
    {
      total: number;
      passed: number;
      failed: number;
      mean_recall: number;
      mean_precision: number;
    }
  > = {
    medication: { total: 0, passed: 0, failed: 0, mean_recall: 0, mean_precision: 0 },
    care_plan: { total: 0, passed: 0, failed: 0, mean_recall: 0, mean_precision: 0 },
    temporal: { total: 0, passed: 0, failed: 0, mean_recall: 0, mean_precision: 0 },
    entity: { total: 0, passed: 0, failed: 0, mean_recall: 0, mean_precision: 0 },
    negative: { total: 0, passed: 0, failed: 0, mean_recall: 0, mean_precision: 0 },
    ambiguous: { total: 0, passed: 0, failed: 0, mean_recall: 0, mean_precision: 0 },
  };

  dataset.entries.forEach((entry, index) => {
    const result = results[index];
    const stats = categoryBreakdown[entry.category];

    stats.total++;
    if (result.passes) {
      stats.passed++;
    } else {
      stats.failed++;
    }
    stats.mean_recall += result.retrieval.recall_at_5;
    stats.mean_precision += result.retrieval.precision_at_5;
  });

  // Average per-category metrics
  Object.values(categoryBreakdown).forEach((stats) => {
    if (stats.total > 0) {
      stats.mean_recall /= stats.total;
      stats.mean_precision /= stats.total;
    }
  });

  // Failed entries detail
  const failedEntriesDetail = results
    .filter((r) => !r.passes)
    .map((r) => {
      const entry = dataset.entries.find((e) => e.id === r.entry_id)!;
      return {
        entry_id: r.entry_id,
        query: r.query,
        category: entry.category,
        failed_criteria: r.failed_criteria,
      };
    });

  return {
    dataset_version: dataset.version,
    evaluated_at: new Date().toISOString(),
    total_entries: totalResults,
    passed_entries: passedCount,
    failed_entries: totalResults - passedCount,
    aggregate_metrics: {
      mean_recall_at_5: Math.round(meanRecall * 1000) / 1000,
      mean_precision_at_5: Math.round(meanPrecision * 1000) / 1000,
      mean_extraction_f1: Math.round(meanF1 * 1000) / 1000,
      mean_citation_accuracy: Math.round(meanCitationAccuracy * 1000) / 1000,
      mean_confidence: Math.round(meanConfidence * 1000) / 1000,
      mean_execution_time_ms: Math.round(meanExecutionTime),
    },
    category_breakdown: categoryBreakdown,
    results,
    failed_entries_detail: failedEntriesDetail,
  };
}

/**
 * Export evaluation report to JSON
 */
export function exportEvaluationReport(
  report: DatasetEvaluationReport,
  pretty: boolean = true
): string {
  return pretty ? JSON.stringify(report, null, 2) : JSON.stringify(report);
}

/**
 * Print evaluation summary to console
 */
export function printEvaluationSummary(report: DatasetEvaluationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('GOLDEN DATASET EVALUATION REPORT');
  console.log('='.repeat(80));
  console.log(`Dataset Version: ${report.dataset_version}`);
  console.log(`Evaluated At: ${report.evaluated_at}`);
  console.log(`\nOverall Results:`);
  console.log(`  Total Entries: ${report.total_entries}`);
  console.log(`  Passed: ${report.passed_entries} (${Math.round((report.passed_entries / report.total_entries) * 100)}%)`);
  console.log(`  Failed: ${report.failed_entries} (${Math.round((report.failed_entries / report.total_entries) * 100)}%)`);

  console.log(`\nAggregate Metrics:`);
  console.log(`  Mean Recall@5: ${report.aggregate_metrics.mean_recall_at_5.toFixed(3)}`);
  console.log(`  Mean Precision@5: ${report.aggregate_metrics.mean_precision_at_5.toFixed(3)}`);
  console.log(`  Mean Extraction F1: ${report.aggregate_metrics.mean_extraction_f1.toFixed(3)}`);
  console.log(`  Mean Citation Accuracy: ${report.aggregate_metrics.mean_citation_accuracy.toFixed(3)}`);
  console.log(`  Mean Confidence: ${report.aggregate_metrics.mean_confidence.toFixed(3)}`);
  console.log(`  Mean Execution Time: ${report.aggregate_metrics.mean_execution_time_ms}ms`);

  console.log(`\nCategory Breakdown:`);
  Object.entries(report.category_breakdown).forEach(([category, stats]) => {
    if (stats.total > 0) {
      console.log(`  ${category}:`);
      console.log(`    Total: ${stats.total}, Passed: ${stats.passed}, Failed: ${stats.failed}`);
      console.log(`    Mean Recall: ${stats.mean_recall.toFixed(3)}, Mean Precision: ${stats.mean_precision.toFixed(3)}`);
    }
  });

  if (report.failed_entries_detail.length > 0) {
    console.log(`\nFailed Entries (${report.failed_entries_detail.length}):`);
    report.failed_entries_detail.slice(0, 10).forEach((entry) => {
      console.log(`  - [${entry.category}] ${entry.entry_id}: ${entry.query}`);
      console.log(`    Failed: ${entry.failed_criteria.join(', ')}`);
    });
    if (report.failed_entries_detail.length > 10) {
      console.log(`  ... and ${report.failed_entries_detail.length - 10} more`);
    }
  }

  console.log('='.repeat(80) + '\n');
}
