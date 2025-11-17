/**
 * Metadata Filter Service Usage Examples
 *
 * Demonstrates:
 * - Basic filtering (by date, type, patient, author)
 * - Combined filters with AND logic
 * - Indexed filtering for performance
 * - Vector store integration
 * - Filter statistics and validation
 * - Batch filtering
 * - Edge cases
 */

import metadataFilter, { Chunk, FilterCriteria } from '../services/metadata-filter.service';

/**
 * Generate sample chunks for examples
 */
function generateSampleChunks(): Chunk[] {
  return [
    {
      chunk_id: 'chunk_001',
      artifact_id: 'artifact_001',
      patient_id: 'patient_123',
      content: 'Patient prescribed metformin 500mg twice daily for diabetes management.',
      metadata: {
        artifact_type: 'medication_order',
        date: '2024-01-15T10:30:00Z',
        author: 'Dr. Smith',
        section: 'medications',
      },
    },
    {
      chunk_id: 'chunk_002',
      artifact_id: 'artifact_002',
      patient_id: 'patient_123',
      content: 'Blood pressure measured at 120/80 mmHg. Within normal range.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-02-10T14:15:00Z',
        author: 'Nurse Johnson',
        section: 'vitals',
      },
    },
    {
      chunk_id: 'chunk_003',
      artifact_id: 'artifact_003',
      patient_id: 'patient_123',
      content: 'A1C level: 6.8%. Shows improvement from previous reading.',
      metadata: {
        artifact_type: 'lab_result',
        date: '2024-03-05T09:00:00Z',
        author: 'Lab Tech Williams',
        section: 'results',
      },
    },
    {
      chunk_id: 'chunk_004',
      artifact_id: 'artifact_004',
      patient_id: 'patient_456',
      content: 'Patient reports chest pain. Ordered ECG and troponin test.',
      metadata: {
        artifact_type: 'progress_note',
        date: '2024-01-20T16:45:00Z',
        author: 'Dr. Smith',
        section: 'assessment',
      },
    },
    {
      chunk_id: 'chunk_005',
      artifact_id: 'artifact_005',
      patient_id: 'patient_456',
      content: 'Started on aspirin 81mg daily for cardiovascular protection.',
      metadata: {
        artifact_type: 'medication_order',
        date: '2024-01-20T17:00:00Z',
        author: 'Dr. Smith',
        section: 'medications',
      },
    },
    {
      chunk_id: 'chunk_006',
      artifact_id: 'artifact_006',
      patient_id: 'patient_123',
      content: 'Care plan updated to include dietary counseling for diabetes.',
      metadata: {
        artifact_type: 'care_plan',
        date: '2024-04-01T11:30:00Z',
        author: 'Dr. Smith',
        section: 'plan',
      },
    },
  ];
}

/**
 * Example 1: Filter by patient ID
 */
export function exampleFilterByPatient() {
  console.log('Example 1: Filter by Patient ID');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  console.log(`  Total chunks: ${chunks.length}\n`);

  const patientId = 'patient_123';
  const filtered = metadataFilter.filterByPatient(chunks, patientId);

  console.log(`  Filtering by patient_id: ${patientId}`);
  console.log(`  Results: ${filtered.length} chunks\n`);

  filtered.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.chunk_id}`);
    console.log(`     Type: ${chunk.metadata.artifact_type}`);
    console.log(`     Date: ${chunk.metadata.date}`);
    console.log(`     Content: ${chunk.content.substring(0, 60)}...`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Filter by artifact type
 */
export function exampleFilterByType() {
  console.log('Example 2: Filter by Artifact Type');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  const types = ['medication_order', 'prescription'];

  console.log(`  Filtering by types: ${types.join(', ')}`);
  const filtered = metadataFilter.filterByType(chunks, types);

  console.log(`  Results: ${filtered.length} chunks\n`);

  filtered.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.chunk_id} - ${chunk.metadata.artifact_type}`);
    console.log(`     ${chunk.content.substring(0, 60)}...`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Filter by date range
 */
export function exampleFilterByDate() {
  console.log('Example 3: Filter by Date Range');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  const from = '2024-02-01T00:00:00Z';
  const to = '2024-03-31T23:59:59Z';

  console.log(`  Date range: ${from} to ${to}`);

  const filtered = metadataFilter.filterByDate(chunks, from, to);

  console.log(`  Results: ${filtered.length} chunks\n`);

  filtered.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.chunk_id}`);
    console.log(`     Date: ${chunk.metadata.date}`);
    console.log(`     Type: ${chunk.metadata.artifact_type}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Filter by author
 */
export function exampleFilterByAuthor() {
  console.log('Example 4: Filter by Author');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  const author = 'Dr. Smith';

  console.log(`  Filtering by author: ${author}`);

  const filtered = metadataFilter.filterByAuthor(chunks, author);

  console.log(`  Results: ${filtered.length} chunks\n`);

  filtered.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.chunk_id} - ${chunk.metadata.artifact_type}`);
    console.log(`     Author: ${chunk.metadata.author}`);
    console.log(`     Date: ${chunk.metadata.date}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Combined filters with AND logic
 */
export function exampleCombinedFilters() {
  console.log('Example 5: Combined Filters (AND Logic)');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order', 'care_plan'],
    date_from: '2024-01-01T00:00:00Z',
    date_to: '2024-12-31T23:59:59Z',
  };

  console.log('  Filters:');
  console.log(`    Patient ID: ${filters.patient_id}`);
  console.log(`    Types: ${filters.artifact_types?.join(', ')}`);
  console.log(`    Date range: ${filters.date_from} to ${filters.date_to}`);
  console.log('');

  const filtered = metadataFilter.applyFilters(chunks, filters);

  console.log(`  Results: ${filtered.length} chunks\n`);

  filtered.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.chunk_id}`);
    console.log(`     Type: ${chunk.metadata.artifact_type}`);
    console.log(`     Date: ${chunk.metadata.date}`);
    console.log(`     Content: ${chunk.content.substring(0, 60)}...`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Filter with statistics
 */
export function exampleFilterWithStats() {
  console.log('Example 6: Filter with Statistics');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order', 'progress_note'],
  };

  const result = metadataFilter.applyFiltersWithStats(chunks, filters);

  console.log('  Filter Statistics:');
  console.log(`    Total before: ${result.total_before}`);
  console.log(`    Total after: ${result.total_after}`);
  console.log(`    Filters applied: ${result.filters_applied.join(', ')}`);
  console.log(`    Execution time: ${result.execution_time_ms}ms`);
  console.log(
    `    Reduction: ${(((result.total_before - result.total_after) / result.total_before) * 100).toFixed(1)}%`
  );
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Index-based filtering (fast)
 */
export function exampleIndexedFiltering() {
  console.log('Example 7: Index-Based Filtering (Performance)');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  // Build indexes
  console.log('  Building indexes...');
  metadataFilter.buildIndexes(chunks);

  const stats = metadataFilter.getIndexStats();
  console.log('  Index Statistics:');
  console.log(`    Total chunks: ${stats.total_chunks}`);
  console.log(`    Unique patients: ${stats.unique_patients}`);
  console.log(`    Unique types: ${stats.unique_types}`);
  console.log(`    Unique authors: ${stats.unique_authors}`);
  console.log(`    Unique dates: ${stats.unique_dates}`);
  console.log('');

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order'],
  };

  console.log('  Filtering with indexes...');
  const startTime = Date.now();
  const filtered = metadataFilter.applyFiltersWithIndexes(filters);
  const endTime = Date.now();

  console.log(`  Results: ${filtered.length} chunks`);
  console.log(`  Execution time: ${endTime - startTime}ms`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Vector store filter generation
 */
export function exampleVectorStoreFilter() {
  console.log('Example 8: Vector Store Filter Generation');
  console.log('-'.repeat(80));

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order', 'prescription'],
    date_from: '2024-01-01T00:00:00Z',
    date_to: '2024-03-31T23:59:59Z',
  };

  const vectorStoreFilter = metadataFilter.getVectorStoreFilter(filters);

  console.log('  Filter Criteria:');
  console.log(`    Patient: ${filters.patient_id}`);
  console.log(`    Types: ${filters.artifact_types?.join(', ')}`);
  console.log(`    Date range: ${filters.date_from} to ${filters.date_to}`);
  console.log('');

  console.log('  Vector Store Filter (Chroma-style):');
  console.log(JSON.stringify(vectorStoreFilter, null, 2));
  console.log('');

  console.log('  Usage:');
  console.log('    collection.query({');
  console.log('      query_embeddings: [embedding],');
  console.log('      n_results: 10,');
  console.log('      where: vectorStoreFilter');
  console.log('    })');
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 9: FAISS pre-filtering
 */
export function exampleFAISSPreFiltering() {
  console.log('Example 9: FAISS Pre-Filtering');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  // Build indexes
  metadataFilter.buildIndexes(chunks);

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order', 'care_plan'],
  };

  console.log('  Filters for FAISS pre-filtering:');
  console.log(`    Patient: ${filters.patient_id}`);
  console.log(`    Types: ${filters.artifact_types?.join(', ')}`);
  console.log('');

  const chunkIds = metadataFilter.getFilteredChunkIds(filters);

  console.log(`  Matching chunk IDs: ${chunkIds.length}`);
  console.log(`    ${chunkIds.join(', ')}`);
  console.log('');

  console.log('  FAISS Usage:');
  console.log('    1. Get filtered chunk IDs');
  console.log('    2. Look up vector indices for these chunk IDs');
  console.log('    3. Search only those vectors in FAISS index');
  console.log('    4. Significant performance boost for large datasets');
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Filter validation
 */
export function exampleFilterValidation() {
  console.log('Example 10: Filter Validation');
  console.log('-'.repeat(80));

  const testFilters = [
    {
      name: 'Valid filters',
      filters: {
        patient_id: 'patient_123',
        artifact_types: ['medication_order'],
        date_from: '2024-01-01T00:00:00Z',
        date_to: '2024-12-31T23:59:59Z',
      },
    },
    {
      name: 'Invalid date range',
      filters: {
        patient_id: 'patient_123',
        date_from: '2024-12-31T23:59:59Z',
        date_to: '2024-01-01T00:00:00Z',
      },
    },
    {
      name: 'Invalid date format',
      filters: {
        patient_id: 'patient_123',
        date_from: 'invalid-date',
      },
    },
    {
      name: 'Invalid artifact_types type',
      filters: {
        patient_id: 'patient_123',
        artifact_types: 'medication_order', // Should be array
      },
    },
  ];

  testFilters.forEach(({ name, filters }, i) => {
    console.log(`  Test ${i + 1}: ${name}`);

    const validation = metadataFilter.validateFilters(filters as any);

    console.log(`    Valid: ${validation.valid ? 'Yes' : 'No'}`);
    if (!validation.valid) {
      console.log('    Errors:');
      validation.errors.forEach((error) => {
        console.log(`      - ${error}`);
      });
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Filter statistics
 */
export function exampleFilterStats() {
  console.log('Example 11: Filter Statistics');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  // Build indexes
  metadataFilter.buildIndexes(chunks);

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order'],
  };

  const stats = metadataFilter.getFilterStats(filters);

  console.log('  Filter Statistics:');
  console.log(`    Total chunks: ${stats.total_chunks}`);
  console.log(`    Matching chunks: ${stats.matching_chunks}`);
  console.log(`    Selectivity: ${(stats.selectivity * 100).toFixed(1)}%`);
  console.log(`    Filters applied: ${stats.filters_applied.join(', ')}`);
  console.log('');

  console.log('  Interpretation:');
  if (stats.selectivity < 0.1) {
    console.log('    ✓ High selectivity - filters are very effective');
  } else if (stats.selectivity < 0.5) {
    console.log('    ✓ Moderate selectivity - filters reduce search space');
  } else {
    console.log('    ⚠ Low selectivity - filters may not be effective');
  }
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Batch filtering
 */
export function exampleBatchFiltering() {
  console.log('Example 12: Batch Filtering');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  const filtersList: FilterCriteria[] = [
    { patient_id: 'patient_123', artifact_types: ['medication_order'] },
    { patient_id: 'patient_456', artifact_types: ['progress_note'] },
    { author: 'Dr. Smith' },
  ];

  console.log(`  Batch filtering ${filtersList.length} filter sets...\n`);

  const results = metadataFilter.batchFilter(chunks, filtersList);

  results.forEach((filtered, i) => {
    console.log(`  Result ${i + 1}:`);
    console.log(`    Filters: ${JSON.stringify(filtersList[i])}`);
    console.log(`    Matching chunks: ${filtered.length}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 13: Edge cases
 */
export function exampleEdgeCases() {
  console.log('Example 13: Edge Cases');
  console.log('-'.repeat(80));

  const chunks = generateSampleChunks();

  console.log('  Edge Case 1: Empty filters');
  const emptyFilters: FilterCriteria = {};
  const result1 = metadataFilter.applyFilters(chunks, emptyFilters);
  console.log(`    Input: ${chunks.length} chunks`);
  console.log(`    Output: ${result1.length} chunks (all returned)`);
  console.log('');

  console.log('  Edge Case 2: No matching chunks');
  const noMatchFilters: FilterCriteria = {
    patient_id: 'nonexistent_patient',
  };
  const result2 = metadataFilter.applyFilters(chunks, noMatchFilters);
  console.log(`    Input: ${chunks.length} chunks`);
  console.log(`    Output: ${result2.length} chunks (empty array)`);
  console.log('');

  console.log('  Edge Case 3: Empty chunk array');
  const result3 = metadataFilter.applyFilters([], {
    patient_id: 'patient_123',
  });
  console.log(`    Input: 0 chunks`);
  console.log(`    Output: ${result3.length} chunks (empty array)`);
  console.log('');

  console.log('  Edge Case 4: Only date_from provided');
  const dateFromOnly: FilterCriteria = {
    date_from: '2024-03-01T00:00:00Z',
  };
  const result4 = metadataFilter.applyFilters(chunks, dateFromOnly);
  console.log(`    Filter: date_from only`);
  console.log(`    Output: ${result4.length} chunks (filtered to present)`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 14: Performance comparison
 */
export function examplePerformanceComparison() {
  console.log('Example 14: Performance Comparison');
  console.log('-'.repeat(80));

  // Generate larger dataset
  const chunks = generateSampleChunks();
  const largeDataset: Chunk[] = [];

  for (let i = 0; i < 1000; i++) {
    chunks.forEach((chunk) => {
      largeDataset.push({
        ...chunk,
        chunk_id: `${chunk.chunk_id}_${i}`,
      });
    });
  }

  console.log(`  Dataset size: ${largeDataset.length} chunks\n`);

  const filters: FilterCriteria = {
    patient_id: 'patient_123',
    artifact_types: ['medication_order'],
  };

  // Without indexes
  console.log('  Without indexes:');
  const start1 = Date.now();
  const result1 = metadataFilter.applyFilters(largeDataset, filters);
  const end1 = Date.now();
  console.log(`    Time: ${end1 - start1}ms`);
  console.log(`    Results: ${result1.length} chunks`);
  console.log('');

  // With indexes
  console.log('  With indexes:');
  metadataFilter.buildIndexes(largeDataset);
  const start2 = Date.now();
  const result2 = metadataFilter.applyFiltersWithIndexes(filters);
  const end2 = Date.now();
  console.log(`    Time: ${end2 - start2}ms`);
  console.log(`    Results: ${result2.length} chunks`);
  console.log('');

  const speedup = (end1 - start1) / (end2 - start2);
  console.log(`  Speedup: ${speedup.toFixed(1)}x faster with indexes`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('METADATA FILTER SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleFilterByPatient();
    exampleFilterByType();
    exampleFilterByDate();
    exampleFilterByAuthor();
    exampleCombinedFilters();
    exampleFilterWithStats();
    exampleIndexedFiltering();
    exampleVectorStoreFilter();
    exampleFAISSPreFiltering();
    exampleFilterValidation();
    exampleFilterStats();
    exampleBatchFiltering();
    exampleEdgeCases();
    examplePerformanceComparison();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
