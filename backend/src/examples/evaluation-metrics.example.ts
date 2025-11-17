/**
 * Evaluation Metrics Example
 *
 * Demonstrates usage of the EvaluationMetrics class for RAG system evaluation.
 *
 */

import {
  EvaluationMetrics,
  createEvaluationMetrics,
  QueryEvaluation,
} from '../utils/evaluation-metrics';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example 1: Basic Metrics Calculation
 */
function example1_BasicMetrics() {
  console.log('\n=== Example 1: Basic Metrics Calculation ===\n');

  const metrics = createEvaluationMetrics();

  // Test case: 3 retrieved, 2 are relevant out of 4 total relevant
  const retrieved = ['doc1', 'doc2', 'doc3'];
  const groundTruth = ['doc1', 'doc3', 'doc4', 'doc5'];

  const precision = metrics.calculatePrecision(retrieved, groundTruth);
  const recall = metrics.calculateRecall(retrieved, groundTruth);
  const f1 = metrics.calculateF1(precision, recall);

  console.log('Retrieved:', retrieved);
  console.log('Ground Truth:', groundTruth);
  console.log('');
  console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
  console.log(`  (2 relevant out of 3 retrieved = 2/3 = 66.67%)`);
  console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
  console.log(`  (2 relevant retrieved out of 4 total relevant = 2/4 = 50%)`);
  console.log(`F1 Score: ${(f1 * 100).toFixed(2)}%`);
  console.log(`  (harmonic mean of precision and recall)`);
}

/**
 * Example 2: MRR (Mean Reciprocal Rank)
 */
function example2_MRR() {
  console.log('\n=== Example 2: Mean Reciprocal Rank (MRR) ===\n');

  const metrics = createEvaluationMetrics();

  // Rankings where first relevant item appears
  // Query 1: First relevant at position 1
  // Query 2: First relevant at position 2
  // Query 3: First relevant at position 3
  const rankings = [1, 2, 3];

  const mrr = metrics.calculateMRR(rankings);

  console.log('First relevant item positions:', rankings);
  console.log('');
  console.log('Reciprocal ranks:');
  console.log('  Query 1: 1/1 = 1.000');
  console.log('  Query 2: 1/2 = 0.500');
  console.log('  Query 3: 1/3 = 0.333');
  console.log('');
  console.log(`MRR: ${mrr.toFixed(4)}`);
  console.log(`  (average = (1.000 + 0.500 + 0.333) / 3 = 0.611)`);
}

/**
 * Example 3: NDCG (Normalized Discounted Cumulative Gain)
 */
function example3_NDCG() {
  console.log('\n=== Example 3: NDCG (Normalized Discounted Cumulative Gain) ===\n');

  const metrics = createEvaluationMetrics();

  // Perfect ranking
  const perfectRetrieved = [3, 2, 1, 0];
  const ideal = [3, 2, 1, 0];
  const perfectNDCG = metrics.calculateNDCG(perfectRetrieved, ideal);

  console.log('Perfect Ranking:');
  console.log(`  Retrieved: [${perfectRetrieved}]`);
  console.log(`  Ideal:     [${ideal}]`);
  console.log(`  NDCG:      ${perfectNDCG.toFixed(4)} (100% - perfect!)`);

  // Suboptimal ranking
  const suboptimalRetrieved = [1, 0, 3, 2];
  const suboptimalNDCG = metrics.calculateNDCG(suboptimalRetrieved, ideal);

  console.log('');
  console.log('Suboptimal Ranking:');
  console.log(`  Retrieved: [${suboptimalRetrieved}]`);
  console.log(`  Ideal:     [${ideal}]`);
  console.log(`  NDCG:      ${suboptimalNDCG.toFixed(4)} (~${(suboptimalNDCG * 100).toFixed(1)}%)`);

  // Poor ranking
  const poorRetrieved = [0, 0, 0, 1];
  const poorNDCG = metrics.calculateNDCG(poorRetrieved, ideal);

  console.log('');
  console.log('Poor Ranking:');
  console.log(`  Retrieved: [${poorRetrieved}]`);
  console.log(`  Ideal:     [${ideal}]`);
  console.log(`  NDCG:      ${poorNDCG.toFixed(4)} (~${(poorNDCG * 100).toFixed(1)}%)`);
}

/**
 * Example 4: Single Query Evaluation
 */
function example4_SingleQueryEvaluation() {
  console.log('\n=== Example 4: Single Query Evaluation ===\n');

  const metrics = createEvaluationMetrics({
    min_precision: 0.6,
    min_recall: 0.6,
    min_f1: 0.6,
  });

  const evaluation = metrics.evaluateQuery(
    'query-001',
    'What medications is the patient taking?',
    ['med-1', 'med-2', 'med-3', 'note-1'],
    ['med-1', 'med-2', 'med-4'],
    'medications'
  );

  console.log('Query:', evaluation.query);
  console.log('Category:', evaluation.category);
  console.log('');
  console.log('Retrieved:', evaluation.retrieved_ids);
  console.log('Ground Truth:', evaluation.ground_truth_ids);
  console.log('');
  console.log('Metrics:');
  console.log(`  Precision: ${(evaluation.metrics.precision * 100).toFixed(2)}%`);
  console.log(`  Recall:    ${(evaluation.metrics.recall * 100).toFixed(2)}%`);
  console.log(`  F1:        ${(evaluation.metrics.f1 * 100).toFixed(2)}%`);
  console.log(`  MRR:       ${(evaluation.metrics.mrr * 100).toFixed(2)}%`);
  console.log(`  NDCG:      ${(evaluation.metrics.ndcg * 100).toFixed(2)}%`);
  console.log('');
  console.log(`Passed: ${evaluation.passed ? 'YES ✓' : 'NO ✗'}`);
}

/**
 * Example 5: Multiple Query Evaluation with Report
 */
function example5_MultipleQueryEvaluation() {
  console.log('\n=== Example 5: Multiple Query Evaluation ===\n');

  const metrics = createEvaluationMetrics({
    min_precision: 0.7,
    min_recall: 0.7,
    min_f1: 0.7,
  });

  // Evaluate multiple queries
  const evaluations: QueryEvaluation[] = [];

  // Query 1: Good performance
  evaluations.push(
    metrics.evaluateQuery(
      'q1',
      'Patient medications',
      ['med-1', 'med-2', 'med-3'],
      ['med-1', 'med-2', 'med-3'],
      'medications'
    )
  );

  // Query 2: Moderate performance
  evaluations.push(
    metrics.evaluateQuery(
      'q2',
      'Recent lab results',
      ['lab-1', 'lab-2', 'note-1'],
      ['lab-1', 'lab-2', 'lab-3'],
      'labs'
    )
  );

  // Query 3: Poor performance
  evaluations.push(
    metrics.evaluateQuery(
      'q3',
      'Care plan details',
      ['note-1', 'note-2'],
      ['care-1', 'care-2', 'care-3'],
      'care_plans'
    )
  );

  // Query 4: Good performance
  evaluations.push(
    metrics.evaluateQuery(
      'q4',
      'Patient allergies',
      ['allergy-1', 'allergy-2'],
      ['allergy-1', 'allergy-2'],
      'medications'
    )
  );

  // Generate report
  const report = metrics.generateReport(evaluations);

  console.log('Total Queries:', report.total_queries);
  console.log('');
  console.log('Aggregate Metrics:');
  console.log(`  Avg Precision: ${(report.aggregate_metrics.avg_precision * 100).toFixed(2)}%`);
  console.log(`  Avg Recall:    ${(report.aggregate_metrics.avg_recall * 100).toFixed(2)}%`);
  console.log(`  Avg F1:        ${(report.aggregate_metrics.avg_f1 * 100).toFixed(2)}%`);
  console.log(`  Avg MRR:       ${(report.aggregate_metrics.avg_mrr * 100).toFixed(2)}%`);
  console.log(`  Avg NDCG:      ${(report.aggregate_metrics.avg_ndcg * 100).toFixed(2)}%`);
  console.log('');
  console.log('Pass Rate:');
  console.log(`  Passed: ${report.summary.passed}/${report.total_queries}`);
  console.log(`  Failed: ${report.summary.failed}/${report.total_queries}`);
  console.log(`  Rate:   ${(report.summary.pass_rate * 100).toFixed(2)}%`);
  console.log('');
  console.log('By Category:');
  Object.entries(report.aggregate_metrics.by_category || {}).forEach(([category, stats]) => {
    console.log(`  ${category}:`);
    console.log(`    Queries:  ${stats.query_count}`);
    console.log(`    Avg F1:   ${(stats.avg_f1 * 100).toFixed(2)}%`);
    console.log(`    Pass Rate: ${(stats.pass_rate * 100).toFixed(2)}%`);
  });
}

/**
 * Example 6: Export to JSON
 */
function example6_ExportToJSON() {
  console.log('\n=== Example 6: Export to JSON ===\n');

  const metrics = createEvaluationMetrics();

  const evaluations = [
    metrics.evaluateQuery('q1', 'Test query 1', ['d1', 'd2'], ['d1', 'd2']),
    metrics.evaluateQuery('q2', 'Test query 2', ['d1', 'd3'], ['d1', 'd2']),
  ];

  const report = metrics.generateReport(evaluations);
  const json = metrics.exportToJSON(report, true);

  console.log('Generated JSON Report:');
  console.log(json.substring(0, 500) + '...');
  console.log('');
  console.log(`Total length: ${json.length} characters`);

  // Save to file
  const outputDir = path.join(__dirname, '../../test-data');
  const outputPath = path.join(outputDir, 'evaluation-report.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, json, 'utf-8');
  console.log(`Saved to: ${outputPath}`);
}

/**
 * Example 7: Export to CSV
 */
function example7_ExportToCSV() {
  console.log('\n=== Example 7: Export to CSV ===\n');

  const metrics = createEvaluationMetrics();

  const evaluations = [
    metrics.evaluateQuery('q1', 'What medications?', ['d1', 'd2'], ['d1', 'd2'], 'meds'),
    metrics.evaluateQuery('q2', 'Recent labs?', ['d1', 'd3'], ['d1', 'd2'], 'labs'),
    metrics.evaluateQuery('q3', 'Care plan?', ['d4'], ['d1', 'd2', 'd3'], 'care'),
  ];

  const report = metrics.generateReport(evaluations);
  const csv = metrics.exportToCSV(report);

  console.log('Generated CSV Report:');
  console.log(csv);

  // Save to file
  const outputDir = path.join(__dirname, '../../test-data');
  const outputPath = path.join(outputDir, 'evaluation-report.csv');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, csv, 'utf-8');
  console.log(`\nSaved to: ${outputPath}`);
}

/**
 * Example 8: Summary Report
 */
function example8_SummaryReport() {
  console.log('\n=== Example 8: Summary Report ===\n');

  const metrics = createEvaluationMetrics({
    min_precision: 0.7,
    min_recall: 0.7,
    min_f1: 0.7,
  });

  // Create diverse set of evaluations
  const evaluations = [
    // High performance queries
    metrics.evaluateQuery('q1', 'Query 1', ['d1', 'd2', 'd3'], ['d1', 'd2', 'd3'], 'medications'),
    metrics.evaluateQuery('q2', 'Query 2', ['d1', 'd2'], ['d1', 'd2'], 'medications'),

    // Medium performance
    metrics.evaluateQuery('q3', 'Query 3', ['d1', 'd2', 'd4'], ['d1', 'd2', 'd3'], 'labs'),
    metrics.evaluateQuery('q4', 'Query 4', ['d1', 'd3'], ['d1', 'd2', 'd3'], 'labs'),

    // Low performance
    metrics.evaluateQuery('q5', 'Query 5', ['d4', 'd5'], ['d1', 'd2', 'd3'], 'care_plans'),
    metrics.evaluateQuery('q6', 'Query 6', ['d1'], ['d1', 'd2', 'd3', 'd4'], 'care_plans'),
  ];

  const report = metrics.generateReport(evaluations);
  const summary = metrics.getSummary(report);

  console.log(summary);
}

/**
 * Example 9: Edge Cases
 */
function example9_EdgeCases() {
  console.log('\n=== Example 9: Edge Cases ===\n');

  const metrics = createEvaluationMetrics();

  // Empty retrieved list
  console.log('1. Empty Retrieved List:');
  const precision1 = metrics.calculatePrecision([], ['d1', 'd2']);
  const recall1 = metrics.calculateRecall([], ['d1', 'd2']);
  console.log(`   Precision: ${precision1.toFixed(4)}`);
  console.log(`   Recall:    ${recall1.toFixed(4)}`);

  // Empty ground truth
  console.log('\n2. Empty Ground Truth:');
  const precision2 = metrics.calculatePrecision(['d1', 'd2'], []);
  const recall2 = metrics.calculateRecall(['d1', 'd2'], []);
  console.log(`   Precision: ${precision2.toFixed(4)}`);
  console.log(`   Recall:    ${recall2.toFixed(4)}`);

  // No overlap
  console.log('\n3. No Overlap:');
  const precision3 = metrics.calculatePrecision(['d1', 'd2'], ['d3', 'd4']);
  const recall3 = metrics.calculateRecall(['d1', 'd2'], ['d3', 'd4']);
  const f13 = metrics.calculateF1(precision3, recall3);
  console.log(`   Precision: ${precision3.toFixed(4)}`);
  console.log(`   Recall:    ${recall3.toFixed(4)}`);
  console.log(`   F1:        ${f13.toFixed(4)}`);

  // Perfect match
  console.log('\n4. Perfect Match:');
  const precision4 = metrics.calculatePrecision(['d1', 'd2'], ['d1', 'd2']);
  const recall4 = metrics.calculateRecall(['d1', 'd2'], ['d1', 'd2']);
  const f14 = metrics.calculateF1(precision4, recall4);
  console.log(`   Precision: ${precision4.toFixed(4)}`);
  console.log(`   Recall:    ${recall4.toFixed(4)}`);
  console.log(`   F1:        ${f14.toFixed(4)}`);
}

/**
 * Example 10: Pass/Fail Criteria
 */
function example10_PassFailCriteria() {
  console.log('\n=== Example 10: Pass/Fail Criteria ===\n');

  // Strict criteria
  const strictMetrics = createEvaluationMetrics({
    min_precision: 0.9,
    min_recall: 0.9,
    min_f1: 0.9,
    min_mrr: 0.8,
    min_ndcg: 0.85,
  });

  // Lenient criteria
  const lenientMetrics = createEvaluationMetrics({
    min_precision: 0.5,
    min_recall: 0.5,
    min_f1: 0.5,
    min_mrr: 0.3,
    min_ndcg: 0.4,
  });

  const retrieved = ['d1', 'd2', 'd3'];
  const groundTruth = ['d1', 'd2', 'd4', 'd5'];

  const strictEval = strictMetrics.evaluateQuery('q1', 'Test', retrieved, groundTruth);
  const lenientEval = lenientMetrics.evaluateQuery('q1', 'Test', retrieved, groundTruth);

  console.log('Same query evaluated with different criteria:\n');

  console.log('Strict Criteria (P≥0.9, R≥0.9, F1≥0.9):');
  console.log(`  Precision: ${(strictEval.metrics.precision * 100).toFixed(2)}%`);
  console.log(`  Recall:    ${(strictEval.metrics.recall * 100).toFixed(2)}%`);
  console.log(`  F1:        ${(strictEval.metrics.f1 * 100).toFixed(2)}%`);
  console.log(`  Result:    ${strictEval.passed ? 'PASS ✓' : 'FAIL ✗'}`);

  console.log('\nLenient Criteria (P≥0.5, R≥0.5, F1≥0.5):');
  console.log(`  Precision: ${(lenientEval.metrics.precision * 100).toFixed(2)}%`);
  console.log(`  Recall:    ${(lenientEval.metrics.recall * 100).toFixed(2)}%`);
  console.log(`  F1:        ${(lenientEval.metrics.f1 * 100).toFixed(2)}%`);
  console.log(`  Result:    ${lenientEval.passed ? 'PASS ✓' : 'FAIL ✗'}`);
}

/**
 * Main function - Run all examples
 */
function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Evaluation Metrics - Usage Examples                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    example1_BasicMetrics();
    example2_MRR();
    example3_NDCG();
    example4_SingleQueryEvaluation();
    example5_MultipleQueryEvaluation();
    example6_ExportToJSON();
    example7_ExportToCSV();
    example8_SummaryReport();
    example9_EdgeCases();
    example10_PassFailCriteria();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  All Examples Completed ✓                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_BasicMetrics,
  example2_MRR,
  example3_NDCG,
  example4_SingleQueryEvaluation,
  example5_MultipleQueryEvaluation,
  example6_ExportToJSON,
  example7_ExportToCSV,
  example8_SummaryReport,
  example9_EdgeCases,
  example10_PassFailCriteria,
};
