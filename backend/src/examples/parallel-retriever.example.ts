/**
 * Parallel Retriever Service Usage Examples
 *
 * Demonstrates:
 * - Automatic parallelization for multi-type queries
 * - Time window based parallelization
 * - Result merging and deduplication
 * - Performance comparisons (parallel vs sequential)
 * - Batch parallel processing
 */

import parallelRetriever from '../services/parallel-retriever.service';
import queryUnderstandingAgent from '../services/query-understanding-agent.service';
import integratedRetriever from '../services/integrated-retriever.service';
import { Chunk } from '../services/metadata-filter.service';
import { StructuredQuery } from '../services/query-understanding-agent.service';
import { QueryIntent } from '../services/intent-classifier.service';

/**
 * Generate sample chunks for examples
 */
function generateSampleChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  // Medication orders
  for (let i = 0; i < 5; i++) {
    chunks.push({
      chunk_id: `med_${i}`,
      artifact_id: `artifact_med_${i}`,
      patient_id: 'patient_123',
      content: `Medication order ${i}: Metformin 500mg prescribed for diabetes management.`,
      metadata: {
        artifact_type: 'medication_order',
        date: new Date(2024, i % 12, 15).toISOString(),
        author: 'Dr. Smith',
      },
    });
  }

  // Progress notes
  for (let i = 0; i < 5; i++) {
    chunks.push({
      chunk_id: `note_${i}`,
      artifact_id: `artifact_note_${i}`,
      patient_id: 'patient_123',
      content: `Progress note ${i}: Patient continues treatment. Vitals stable.`,
      metadata: {
        artifact_type: 'progress_note',
        date: new Date(2024, i % 12, 10).toISOString(),
        author: 'Nurse Johnson',
      },
    });
  }

  // Lab results
  for (let i = 0; i < 5; i++) {
    chunks.push({
      chunk_id: `lab_${i}`,
      artifact_id: `artifact_lab_${i}`,
      patient_id: 'patient_123',
      content: `Lab result ${i}: A1C 6.8%, glucose 105 mg/dL. Results within normal range.`,
      metadata: {
        artifact_type: 'lab_result',
        date: new Date(2024, i % 12, 1).toISOString(),
        author: 'Lab Tech',
      },
    });
  }

  // Care plans
  for (let i = 0; i < 5; i++) {
    chunks.push({
      chunk_id: `care_${i}`,
      artifact_id: `artifact_care_${i}`,
      patient_id: 'patient_123',
      content: `Care plan ${i}: Continue current treatment regimen. Monitor progress.`,
      metadata: {
        artifact_type: 'care_plan',
        date: new Date(2024, i % 12, 20).toISOString(),
        author: 'Dr. Smith',
      },
    });
  }

  return chunks;
}

/**
 * Example 1: Automatic parallelization (multi-type query)
 */
export async function exampleAutoParallelization() {
  console.log('Example 1: Automatic Parallelization');
  console.log('-'.repeat(80));

  // Initialize
  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  // Query targeting multiple artifact types
  const query: StructuredQuery = {
    original_query: 'patient information',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'progress_note', 'lab_result'],
    },
    detail_level: 3,
    query_id: 'auto_parallel_001',
  };

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Artifact Types: ${query.filters.artifact_types?.join(', ')}`);
  console.log('');

  // Execute with automatic parallelization
  const result = await parallelRetriever.retrieve(query);

  console.log('  Results:\n');
  console.log(`    Parallel Searches: ${result.parallel_searches}`);
  console.log(`    Total Time: ${result.retrieval_time_ms}ms`);
  console.log(`    Merge Time: ${result.merge_time_ms}ms`);
  console.log(`    Duplicates Removed: ${result.deduplication_removed}`);
  console.log(`    Final Candidates: ${result.candidates.length}\n`);

  console.log('  Top 3 Results:\n');
  result.candidates.slice(0, 3).forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Type: ${c.metadata.artifact_type}`);
    console.log(`       Score: ${c.score.toFixed(3)}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Time window parallelization
 */
export async function exampleTimeWindowParallelization() {
  console.log('Example 2: Time Window Parallelization');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  // Query with long date range (>6 months)
  const query: StructuredQuery = {
    original_query: 'historical data',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {
      date_range: {
        from: '2024-01-01T00:00:00Z',
        to: '2024-12-31T23:59:59Z',
      },
    },
    detail_level: 3,
    query_id: 'time_parallel_001',
  };

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Date Range: ${query.filters.date_range?.from} to ${query.filters.date_range?.to}`);
  console.log('');

  const result = await parallelRetriever.retrieve(query);

  console.log('  Results:\n');
  console.log(`    Parallel Time Windows: ${result.parallel_searches}`);
  console.log(`    Total Time: ${result.retrieval_time_ms}ms`);
  console.log(`    Candidates: ${result.candidates.length}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Performance comparison (parallel vs sequential)
 */
export async function examplePerformanceComparison() {
  console.log('Example 3: Performance Comparison');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'all medical records',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'progress_note', 'lab_result', 'care_plan'],
    },
    detail_level: 3,
    query_id: 'comparison_001',
  };

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Artifact Types: ${query.filters.artifact_types?.length} types\n`);

  console.log('  Running comparison...\n');

  const comparison = await parallelRetriever.comparePerformance(query);

  console.log('  Sequential Execution:');
  console.log(`    Time: ${comparison.sequential.retrieval_time_ms}ms`);
  console.log(`    Searches: ${comparison.sequential.parallel_searches}`);
  console.log('');

  console.log('  Parallel Execution:');
  console.log(`    Time: ${comparison.parallel.retrieval_time_ms}ms`);
  console.log(`    Searches: ${comparison.parallel.parallel_searches}`);
  console.log('');

  console.log(`  Speedup: ${comparison.speedup.toFixed(2)}x`);
  console.log(`  Time Saved: ${(comparison.sequential.retrieval_time_ms - comparison.parallel.retrieval_time_ms).toFixed(0)}ms`);
  console.log(
    `  Performance Gain: ${(((comparison.speedup - 1) * 100).toFixed(0))}%\n`
  );

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Result merging and deduplication
 */
export async function exampleMergingDeduplication() {
  console.log('Example 4: Result Merging and Deduplication');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'patient records',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'progress_note'],
    },
    detail_level: 3,
    query_id: 'merge_001',
  };

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Types: ${query.filters.artifact_types?.join(', ')}\n`);

  const result = await parallelRetriever.retrieve(query);

  console.log('  Merge Statistics:\n');
  console.log(`    Parallel Searches: ${result.parallel_searches}`);
  console.log(`    Total Candidates (before merge): ~${result.parallel_searches * 10}`);
  console.log(`    Duplicates Removed: ${result.deduplication_removed}`);
  console.log(`    Unique Candidates: ${result.candidates.length}`);
  console.log(`    Merge Time: ${result.merge_time_ms}ms\n`);

  console.log('  Top 5 Merged Results:\n');
  result.candidates.slice(0, 5).forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Type: ${c.metadata.artifact_type}`);
    console.log(`       Score: ${c.score.toFixed(3)} (normalized)`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Parallel retrieval summary
 */
export async function exampleRetrievalSummary() {
  console.log('Example 5: Retrieval Summary');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'medications and lab results',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'lab_result'],
    },
    detail_level: 3,
    query_id: 'summary_001',
  };

  const result = await parallelRetriever.retrieve(query);

  console.log('\n' + parallelRetriever.getSummary(result));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 6: Single type query (no parallelization)
 */
export async function exampleSingleType() {
  console.log('Example 6: Single Type Query (No Parallelization)');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  // Query with single artifact type
  const query: StructuredQuery = {
    original_query: 'medications only',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order'],
    },
    detail_level: 3,
    query_id: 'single_001',
  };

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Artifact Type: ${query.filters.artifact_types?.[0]}\n`);

  const result = await parallelRetriever.retrieve(query);

  console.log('  Results:\n');
  console.log(`    Parallel Searches: ${result.parallel_searches}`);
  console.log(`    Sequential Fallback: ${result.sequential_fallback ? 'Yes' : 'No'}`);
  console.log(`    Total Time: ${result.retrieval_time_ms}ms`);
  console.log(`    Candidates: ${result.candidates.length}\n`);

  console.log('  Note: Single-type queries use sequential retrieval (no parallelization benefit)\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Batch parallel retrieval
 */
export async function exampleBatchParallel() {
  console.log('Example 7: Batch Parallel Retrieval');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  const queries: StructuredQuery[] = [
    {
      original_query: 'medications',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_MEDICATIONS,
      entities: [],
      temporal_filter: null,
      filters: {
        artifact_types: ['medication_order', 'prescription'],
      },
      detail_level: 3,
      query_id: 'batch_001',
    },
    {
      original_query: 'lab results',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_ALL,
      entities: [],
      temporal_filter: null,
      filters: {
        artifact_types: ['lab_result'],
      },
      detail_level: 3,
      query_id: 'batch_002',
    },
    {
      original_query: 'clinical notes',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_NOTES,
      entities: [],
      temporal_filter: null,
      filters: {
        artifact_types: ['progress_note', 'clinical_note'],
      },
      detail_level: 3,
      query_id: 'batch_003',
    },
  ];

  console.log(`  Processing ${queries.length} queries in batch...\n`);

  const results = await parallelRetriever.batchRetrieve(queries);

  results.forEach((result, i) => {
    console.log(`  Query ${i + 1}: "${queries[i].original_query}"`);
    console.log(`    Parallel Searches: ${result.parallel_searches}`);
    console.log(`    Time: ${result.retrieval_time_ms}ms`);
    console.log(`    Candidates: ${result.candidates.length}`);
    console.log('');
  });

  const totalTime = results.reduce((sum, r) => sum + r.retrieval_time_ms, 0);
  const avgTime = totalTime / results.length;

  console.log(`  Total Time: ${totalTime}ms`);
  console.log(`  Average Time: ${avgTime.toFixed(0)}ms per query\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Force parallelization
 */
export async function exampleForceParallel() {
  console.log('Example 8: Force Parallelization');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'all records',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {},
    detail_level: 3,
    query_id: 'force_001',
  };

  console.log(`  Query: "${query.original_query}"`);
  console.log('  Note: No filters specified (normally would be sequential)\n');

  console.log('  Without force:\n');
  const result1 = await parallelRetriever.retrieve(query, false);
  console.log(`    Parallel Searches: ${result1.parallel_searches}`);
  console.log(`    Sequential Fallback: ${result1.sequential_fallback}\n`);

  console.log('  With force:\n');
  const result2 = await parallelRetriever.retrieve(query, true);
  console.log(`    Parallel Searches: ${result2.parallel_searches}`);
  console.log(`    Sequential Fallback: ${result2.sequential_fallback}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Integration with Query Understanding
 */
export async function exampleWithQueryUnderstanding() {
  console.log('Example 9: Integration with Query Understanding');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  // Natural language query
  const userQuery = 'Show me all medications, lab results, and clinical notes';
  const patientId = 'patient_123';

  console.log(`  User Query: "${userQuery}"`);
  console.log(`  Patient: ${patientId}\n`);

  // Parse query
  console.log('  Step 1: Parse query...\n');
  const structuredQuery = queryUnderstandingAgent.parse(userQuery, patientId);

  console.log('  Parsed:');
  console.log(`    Intent: ${structuredQuery.intent}`);
  console.log(`    Entities: ${structuredQuery.entities.length}`);
  console.log('');

  // Execute parallel retrieval
  console.log('  Step 2: Execute parallel retrieval...\n');
  const result = await parallelRetriever.retrieve(structuredQuery);

  console.log('  Results:');
  console.log(`    Parallel Searches: ${result.parallel_searches}`);
  console.log(`    Time: ${result.retrieval_time_ms}ms`);
  console.log(`    Candidates: ${result.candidates.length}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Performance metrics analysis
 */
export async function examplePerformanceMetrics() {
  console.log('Example 10: Performance Metrics Analysis');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  integratedRetriever.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'comprehensive search',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_ALL,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'progress_note', 'lab_result'],
    },
    detail_level: 3,
    query_id: 'metrics_001',
  };

  const result = await parallelRetriever.retrieve(query);

  console.log('  Performance Breakdown:\n');
  console.log('  Stage Metrics (averaged across parallel searches):\n');

  result.stage_metrics.forEach((metric) => {
    const pct = ((metric.duration_ms / result.retrieval_time_ms) * 100).toFixed(1);
    console.log(`    ${metric.stage.padEnd(25)} ${String(metric.duration_ms).padStart(4)}ms (${pct.padStart(5)}%)`);
  });

  console.log('');
  console.log(`  Merge Time: ${result.merge_time_ms}ms`);
  console.log(`  Total Time: ${result.retrieval_time_ms}ms\n`);

  console.log('  Efficiency Analysis:\n');
  const parallelOverhead = result.merge_time_ms;
  const parallelBenefit = result.parallel_searches > 1 ? result.parallel_searches * 0.3 : 0;

  console.log(`    Parallel Overhead: ${parallelOverhead}ms`);
  console.log(`    Estimated Benefit: ${(parallelBenefit * 100).toFixed(0)}% time saved`);
  console.log(`    Net Gain: ${result.parallel_searches > 1 ? 'Positive ✓' : 'Minimal'}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('PARALLEL RETRIEVER SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    await exampleAutoParallelization();
    await exampleTimeWindowParallelization();
    await examplePerformanceComparison();
    await exampleMergingDeduplication();
    await exampleRetrievalSummary();
    await exampleSingleType();
    await exampleBatchParallel();
    await exampleForceParallel();
    await exampleWithQueryUnderstanding();
    await examplePerformanceMetrics();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
