/**
 * Retriever Agent Service Usage Examples
 *
 * Demonstrates:
 * - Full retrieval pipeline
 * - Metadata filtering integration
 * - Hybrid search and ranking
 * - Snippet and highlight generation
 * - Query caching
 * - Performance diagnostics
 * - Batch retrieval
 */

import retrieverAgent from '../services/retriever-agent.service';
import { Chunk } from '../services/metadata-filter.service';
import { StructuredQuery } from '../services/query-understanding-agent.service';
import { QueryIntent } from '../services/intent-classifier.service';

/**
 * Generate sample chunks for examples
 */
function generateSampleChunks(): Chunk[] {
  return [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'artifact_001',
      patient_id: 'patient_123',
      content:
        'Patient prescribed metformin 500mg twice daily for type 2 diabetes management. ' +
        'Blood glucose levels have improved significantly. Patient reports good medication adherence.',
      metadata: {
        artifact_type: 'medication_order',
        date: '2024-10-20T10:00:00Z',
        author: 'Dr. Smith',
        section: 'medications',
      },
    },
    {
      chunk_id: 'chunk_002',
      artifact_id: 'artifact_002',
      patient_id: 'patient_123',
      content:
        'Blood pressure measured at 120/80 mmHg. Patient continues on current medications including metformin. ' +
        'No adverse effects reported. Diabetes well controlled.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-09-15T14:00:00Z',
        author: 'Nurse Johnson',
        section: 'vitals',
      },
    },
    {
      chunk_id: 'chunk_003',
      artifact_id: 'artifact_003',
      patient_id: 'patient_123',
      content:
        'A1C level: 6.8%. Significant improvement from previous reading of 7.2%. ' +
        'Metformin therapy proving effective. Continue current treatment plan.',
      metadata: {
        artifact_type: 'lab_result',
        date: '2024-08-01T09:00:00Z',
        author: 'Lab Tech Williams',
        section: 'results',
      },
    },
    {
      chunk_id: 'chunk_004',
      artifact_id: 'artifact_004',
      patient_id: 'patient_123',
      content:
        'Care plan updated: Continue metformin 500mg BID. Monitor blood glucose weekly. ' +
        'Dietary counseling scheduled. Patient education on diabetes management provided.',
      metadata: {
        artifact_type: 'care_plan',
        date: '2024-10-01T11:00:00Z',
        author: 'Dr. Smith',
        section: 'plan',
      },
    },
    {
      chunk_id: 'chunk_005',
      artifact_id: 'artifact_005',
      patient_id: 'patient_123',
      content:
        'Patient education session completed. Discussed importance of medication adherence, ' +
        'diet modification, and regular exercise for diabetes management.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-07-15T10:00:00Z',
        author: 'Nurse Williams',
        section: 'education',
      },
    },
    {
      chunk_id: 'chunk_006',
      artifact_id: 'artifact_006',
      patient_id: 'patient_456',
      content:
        'Patient reports chest pain and shortness of breath. ECG ordered. ' +
        'Troponin levels elevated. Admitted for observation.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-10-18T16:00:00Z',
        author: 'Dr. Jones',
        section: 'assessment',
      },
    },
  ];
}

/**
 * Generate sample structured query
 */
function generateSampleQuery(): StructuredQuery {
  return {
    original_query: 'What medications for diabetes?',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [],
    temporal_filter: null,
    filters: {
      artifact_types: ['medication_order', 'prescription'],
    },
    detail_level: 3,
    query_id: 'query_001',
  };
}

/**
 * Example 1: Basic retrieval
 */
export async function exampleBasicRetrieval() {
  console.log('Example 1: Basic Retrieval');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query = generateSampleQuery();

  console.log(`  Query: "${query.original_query}"`);
  console.log(`  Patient: ${query.patient_id}`);
  console.log(`  Intent: ${query.intent}\n`);

  const result = await retrieverAgent.retrieve(query, 5);

  console.log('  Results:');
  console.log(`    Total searched: ${result.total_searched}`);
  console.log(`    After filtering: ${result.filtered_count}`);
  console.log(`    Candidates: ${result.candidates.length}`);
  console.log(`    Time: ${result.retrieval_time_ms}ms\n`);

  result.candidates.forEach((candidate) => {
    console.log(`  Rank ${candidate.rank}: ${candidate.chunk.chunk_id}`);
    console.log(`    Score: ${candidate.score.toFixed(3)}`);
    console.log(`    Type: ${candidate.metadata.artifact_type}`);
    console.log(`    Snippet: ${candidate.snippet}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Snippet and highlight demonstration
 */
export async function exampleSnippetsHighlights() {
  console.log('Example 2: Snippets and Highlights');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'metformin diabetes management',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [],
    temporal_filter: null,
    filters: {},
    detail_level: 3,
    query_id: 'query_002',
  };

  const result = await retrieverAgent.retrieve(query, 3);

  console.log(`  Query: "${query.original_query}"\n`);

  result.candidates.forEach((candidate) => {
    console.log(`  Candidate ${candidate.rank}:`);
    console.log(`    Snippet: ${candidate.snippet}`);
    console.log(`    Highlights: ${candidate.highlights.length} terms`);

    candidate.highlights.slice(0, 3).forEach((h) => {
      console.log(`      - "${h.text}" at position ${h.start}-${h.end}`);
    });

    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Performance diagnostics
 */
export async function exampleDiagnostics() {
  console.log('Example 3: Performance Diagnostics');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query = generateSampleQuery();

  const result = await retrieverAgent.retrieve(query);

  console.log('  Retrieval Diagnostics:\n');
  console.log(retrieverAgent.getDiagnosticsSummary(result));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 4: Query caching
 */
export async function exampleQueryCaching() {
  console.log('Example 4: Query Caching');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query = generateSampleQuery();

  console.log('  First retrieval (no cache):\n');
  const result1 = await retrieverAgent.retrieve(query);
  console.log(`    Time: ${result1.retrieval_time_ms}ms`);
  console.log(`    Cache hit: ${result1.diagnostics?.cache_hit ? 'Yes' : 'No'}\n`);

  console.log('  Second retrieval (from cache):\n');
  const result2 = await retrieverAgent.retrieve(query);
  console.log(`    Time: ${result2.retrieval_time_ms}ms`);
  console.log(`    Cache hit: ${result2.diagnostics?.cache_hit ? 'Yes' : 'No'}\n`);

  console.log('  Cache Statistics:');
  const cacheStats = retrieverAgent.getCacheStats();
  console.log(`    Size: ${cacheStats.size} entries`);
  console.log(`    TTL: ${cacheStats.ttl_ms / 1000}s\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Metadata filtering effectiveness
 */
export async function exampleMetadataFiltering() {
  console.log('Example 5: Metadata Filtering Effectiveness');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const scenarios = [
    {
      name: 'No filters',
      query: {
        original_query: 'patient information',
        patient_id: 'patient_123',
        intent: QueryIntent.RETRIEVE_ALL,
        entities: [],
        temporal_filter: null,
        filters: {},
        detail_level: 3,
        query_id: 'query_003a',
      },
    },
    {
      name: 'Patient filter only',
      query: {
        original_query: 'patient information',
        patient_id: 'patient_123',
        intent: QueryIntent.RETRIEVE_ALL,
        entities: [],
        temporal_filter: null,
        filters: {
          patient_id: 'patient_123',
        },
        detail_level: 3,
        query_id: 'query_003b',
      },
    },
    {
      name: 'Patient + type filters',
      query: {
        original_query: 'patient information',
        patient_id: 'patient_123',
        intent: QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [],
        temporal_filter: null,
        filters: {
          artifact_types: ['medication_order'],
        },
        detail_level: 3,
        query_id: 'query_003c',
      },
    },
  ];

  for (const scenario of scenarios) {
    const result = await retrieverAgent.retrieve(scenario.query as StructuredQuery);

    console.log(`  Scenario: ${scenario.name}`);
    console.log(`    Total chunks: ${result.total_searched}`);
    console.log(`    After filtering: ${result.filtered_count}`);
    console.log(
      `    Reduction: ${(((result.total_searched - result.filtered_count) / result.total_searched) * 100).toFixed(1)}%`
    );
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Top-K variation
 */
export async function exampleTopK() {
  console.log('Example 6: Top-K Results');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query = generateSampleQuery();

  const topKValues = [3, 5, 10];

  for (const k of topKValues) {
    const result = await retrieverAgent.retrieve(query, k);

    console.log(`  Top-${k} Results:`);
    console.log(`    Returned: ${result.candidates.length} candidates`);
    console.log(`    Top score: ${result.candidates[0]?.score.toFixed(3) || 'N/A'}`);
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Batch retrieval
 */
export async function exampleBatchRetrieval() {
  console.log('Example 7: Batch Retrieval');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const queries: StructuredQuery[] = [
    {
      original_query: 'medications for diabetes',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_MEDICATIONS,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: 'batch_001',
    },
    {
      original_query: 'recent lab results',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_ALL,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: 'batch_002',
    },
    {
      original_query: 'care plan updates',
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_CARE_PLANS,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: 'batch_003',
    },
  ];

  console.log(`  Processing ${queries.length} queries in batch...\n`);

  const startTime = Date.now();
  const results = await retrieverAgent.batchRetrieve(queries, 5);
  const totalTime = Date.now() - startTime;

  results.forEach((result, i) => {
    console.log(`  Query ${i + 1}: "${queries[i].original_query}"`);
    console.log(`    Candidates: ${result.candidates.length}`);
    console.log(`    Time: ${result.retrieval_time_ms}ms`);
    console.log('');
  });

  console.log(`  Total batch time: ${totalTime}ms`);
  console.log(`  Average per query: ${(totalTime / queries.length).toFixed(1)}ms\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Top result explanation
 */
export async function exampleResultExplanation() {
  console.log('Example 8: Result Explanation');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query = generateSampleQuery();

  const result = await retrieverAgent.retrieve(query);

  console.log('  Top Result Explanation:\n');
  console.log(retrieverAgent.explainTopResult(result));

  console.log('\n  ✅ Success\n');
}

/**
 * Example 9: Different query intents
 */
export async function exampleDifferentIntents() {
  console.log('Example 9: Different Query Intents');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const intents = [
    { intent: QueryIntent.RETRIEVE_MEDICATIONS, query: 'medications for patient' },
    { intent: QueryIntent.RETRIEVE_NOTES, query: 'clinical notes' },
    { intent: QueryIntent.RETRIEVE_CARE_PLANS, query: 'care plan' },
    { intent: QueryIntent.SUMMARY, query: 'summarize patient history' },
  ];

  for (const { intent, query: queryText } of intents) {
    const query: StructuredQuery = {
      original_query: queryText,
      patient_id: 'patient_123',
      intent,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: `intent_${intent}`,
    };

    const result = await retrieverAgent.retrieve(query, 3);

    console.log(`  Intent: ${intent}`);
    console.log(`    Query: "${queryText}"`);
    console.log(`    Results: ${result.candidates.length}`);

    if (result.candidates.length > 0) {
      console.log(`    Top result type: ${result.candidates[0].metadata.artifact_type}`);
    }

    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Cache management
 */
export async function exampleCacheManagement() {
  console.log('Example 10: Cache Management');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  console.log('  Initial cache state:');
  let stats = retrieverAgent.getCacheStats();
  console.log(`    Size: ${stats.size}\n`);

  // Perform several queries
  for (let i = 0; i < 5; i++) {
    const query: StructuredQuery = {
      original_query: `query ${i}`,
      patient_id: 'patient_123',
      intent: QueryIntent.RETRIEVE_ALL,
      entities: [],
      temporal_filter: null,
      filters: {},
      detail_level: 3,
      query_id: `cache_test_${i}`,
    };

    await retrieverAgent.retrieve(query);
  }

  console.log('  After 5 queries:');
  stats = retrieverAgent.getCacheStats();
  console.log(`    Size: ${stats.size}\n`);

  // Clear cache
  retrieverAgent.clearCache();

  console.log('  After clearing cache:');
  stats = retrieverAgent.getCacheStats();
  console.log(`    Size: ${stats.size}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Full pipeline with all features
 */
export async function exampleFullPipeline() {
  console.log('Example 11: Full Pipeline Integration');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();
  retrieverAgent.initialize(chunks);

  const query: StructuredQuery = {
    original_query: 'metformin diabetes treatment effectiveness',
    patient_id: 'patient_123',
    intent: QueryIntent.RETRIEVE_MEDICATIONS,
    entities: [],
    temporal_filter: {
      timeReference: 'last_3_months',
      dateFrom: '2024-07-23T00:00:00Z',
      dateTo: '2024-10-23T23:59:59Z',
    },
    filters: {
      artifact_types: ['medication_order', 'lab_result', 'progress_note'],
      date_range: {
        from: '2024-07-23T00:00:00Z',
        to: '2024-10-23T23:59:59Z',
      },
    },
    detail_level: 4,
    query_id: 'full_pipeline_001',
  };

  console.log('  Query Details:');
  console.log(`    Text: "${query.original_query}"`);
  console.log(`    Patient: ${query.patient_id}`);
  console.log(`    Intent: ${query.intent}`);
  console.log(`    Types: ${query.filters.artifact_types?.join(', ')}`);
  console.log(`    Date range: Last 3 months\n`);

  const result = await retrieverAgent.retrieve(query, 5);

  console.log('  Pipeline Execution:\n');
  console.log(retrieverAgent.getDiagnosticsSummary(result));

  console.log('\n  Top Results:\n');
  result.candidates.slice(0, 3).forEach((c) => {
    console.log(`  Rank ${c.rank}:`);
    console.log(`    Score: ${c.score.toFixed(3)}`);
    console.log(`    Type: ${c.metadata.artifact_type}`);
    console.log(`    Date: ${c.metadata.date}`);
    console.log(`    Snippet: ${c.snippet}`);
    console.log(`    Highlights: ${c.highlights.length}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('RETRIEVER AGENT SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicRetrieval();
    exampleSnippetsHighlights();
    exampleDiagnostics();
    exampleQueryCaching();
    exampleMetadataFiltering();
    exampleTopK();
    exampleBatchRetrieval();
    exampleResultExplanation();
    exampleDifferentIntents();
    exampleCacheManagement();
    exampleFullPipeline();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
