/**
 * Query Understanding Agent (QUA) Service Usage Examples
 *
 * Demonstrates:
 * - Basic query parsing
 * - Intent-based filtering
 * - Temporal filtering
 * - Entity extraction
 * - Filter construction
 * - Metadata extraction
 * - Batch processing
 * - Query validation
 */

import queryUnderstandingAgent from '../services/query-understanding-agent.service';
import { QueryIntent } from '../services/intent-classifier.service';

const PATIENT_ID = 'patient_123';

/**
 * Example 1: Basic query parsing
 */
export function exampleBasicParsing() {
  console.log('Example 1: Basic Query Parsing');
  console.log('-'.repeat(80));

  const queries = [
    'What medications is the patient taking?',
    'Show me recent progress notes',
    'Patient care plan',
    'Summarize the medical history',
  ];

  console.log('  Parsing basic queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);

    console.log(`    Intent: ${structured.intent}`);
    console.log(`    Entities: ${structured.entities.length}`);
    console.log(`    Has temporal filter: ${structured.temporal_filter ? 'Yes' : 'No'}`);
    console.log(`    Artifact types: ${structured.filters.artifact_types?.join(', ') || 'All'}`);
    console.log(`    Query ID: ${structured.query_id}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Intent-based artifact filtering
 */
export function exampleIntentFiltering() {
  console.log('Example 2: Intent-Based Artifact Filtering');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'Show medications', expected: ['medication_order', 'prescription'] },
    { query: 'Care plan for diabetes', expected: ['care_plan', 'treatment_plan'] },
    { query: 'Recent visit notes', expected: ['progress_note', 'clinical_note', 'encounter'] },
  ];

  console.log('  Testing intent to artifact type mapping:\n');

  queries.forEach(({ query, expected }, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);

    console.log(`    Intent: ${structured.intent}`);
    console.log(`    Expected types: ${expected.join(', ')}`);
    console.log(`    Actual types: ${structured.filters.artifact_types?.join(', ') || 'None'}`);

    const match = structured.filters.artifact_types?.some((type) => expected.includes(type));
    console.log(`    Match: ${match ? '✓' : '✗'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Temporal filtering
 */
export function exampleTemporalFiltering() {
  console.log('Example 3: Temporal Filtering');
  console.log('-'.repeat(80));

  const queries = [
    'Medications in the last 3 months',
    'Progress notes from yesterday',
    'Care plan since January',
    'Blood work between June and August',
  ];

  console.log('  Parsing queries with temporal information:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);

    if (structured.temporal_filter) {
      console.log(`    Temporal reference: "${structured.temporal_filter.timeReference}"`);
      console.log(`    Date from: ${new Date(structured.temporal_filter.dateFrom).toLocaleDateString()}`);
      console.log(`    Date to: ${new Date(structured.temporal_filter.dateTo).toLocaleDateString()}`);

      if (structured.filters.date_range) {
        console.log(`    Date range filter applied: Yes`);
      }
    } else {
      console.log('    No temporal filter');
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Entity extraction
 */
export function exampleEntityExtraction() {
  console.log('Example 4: Entity Extraction');
  console.log('-'.repeat(80));

  const queries = [
    'Patient with diabetes on metformin 500mg twice daily',
    'Hypertension treated with lisinopril, started last month',
    'Chest pain yesterday, prescribed aspirin by Dr. Smith',
  ];

  console.log('  Extracting entities from complex queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);

    console.log(`    Total entities: ${structured.entities.length}`);

    // Group by type
    const byType: Record<string, typeof structured.entities> = {};
    structured.entities.forEach((entity) => {
      if (!byType[entity.type]) byType[entity.type] = [];
      byType[entity.type].push(entity);
    });

    Object.keys(byType).forEach((type) => {
      console.log(`    ${type}: ${byType[type].map((e) => e.text).join(', ')}`);
    });

    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Complete query parsing with metadata
 */
export function exampleCompleteParsingWithMetadata() {
  console.log('Example 5: Complete Query Parsing with Metadata');
  console.log('-'.repeat(80));

  const query = 'What medications were prescribed for diabetes in the last 3 months?';

  console.log(`  Query: "${query}"\n`);

  const result = queryUnderstandingAgent.parseWithMetadata(query, PATIENT_ID);

  console.log('  Structured Query:');
  console.log(`    Original query: "${result.original_query}"`);
  console.log(`    Patient ID: ${result.patient_id}`);
  console.log(`    Query ID: ${result.query_id}`);
  console.log('');

  console.log('  Intent Analysis:');
  console.log(`    Intent: ${result.intent}`);
  console.log(`    Confidence: ${(result.intent_confidence * 100).toFixed(1)}%`);
  if (result.ambiguous_intents && result.ambiguous_intents.length > 0) {
    console.log('    Ambiguous intents:');
    result.ambiguous_intents.forEach((ambiguous) => {
      console.log(`      - ${ambiguous.intent} (${(ambiguous.confidence * 100).toFixed(1)}%)`);
    });
  }
  console.log('');

  console.log('  Entity Analysis:');
  console.log(`    Medications: ${result.entity_count.medications}`);
  console.log(`    Conditions: ${result.entity_count.conditions}`);
  console.log(`    Symptoms: ${result.entity_count.symptoms}`);
  console.log(`    Dates: ${result.entity_count.dates}`);
  console.log(`    Persons: ${result.entity_count.persons}`);
  console.log(`    Total: ${result.entities.length}`);
  console.log('');

  console.log('  Temporal Analysis:');
  console.log(`    Has temporal filter: ${result.has_temporal}`);
  if (result.temporal_filter) {
    console.log(`    Time reference: "${result.temporal_filter.timeReference}"`);
    console.log(`    From: ${new Date(result.temporal_filter.dateFrom).toLocaleDateString()}`);
    console.log(`    To: ${new Date(result.temporal_filter.dateTo).toLocaleDateString()}`);
  }
  console.log('');

  console.log('  Filters:');
  console.log(`    Artifact types: ${result.filters.artifact_types?.join(', ') || 'All'}`);
  if (result.filters.date_range) {
    console.log(`    Date range:`);
    console.log(`      From: ${new Date(result.filters.date_range.from).toLocaleDateString()}`);
    console.log(`      To: ${new Date(result.filters.date_range.to).toLocaleDateString()}`);
  }
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Intent-specific entity extraction
 */
export function exampleIntentSpecificExtraction() {
  console.log('Example 6: Intent-Specific Entity Extraction');
  console.log('-'.repeat(80));

  const queries = [
    'Medications for hypertension and diabetes',
    'Care plan for diabetes management',
    'Recent notes about chest pain',
  ];

  console.log('  Extracting entities relevant to detected intent:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);

    console.log(`    Intent: ${structured.intent}`);

    // Extract relevant entities based on intent
    switch (structured.intent) {
      case QueryIntent.RETRIEVE_MEDICATIONS:
        const medications = queryUnderstandingAgent.getMedications(structured);
        console.log(`    Medications: ${medications.map((m) => m.text).join(', ') || 'None'}`);
        break;

      case QueryIntent.RETRIEVE_CARE_PLANS:
        const conditions = queryUnderstandingAgent.getConditions(structured);
        console.log(`    Conditions: ${conditions.map((c) => c.text).join(', ') || 'None'}`);
        break;

      case QueryIntent.RETRIEVE_NOTES:
        const symptoms = queryUnderstandingAgent.getSymptoms(structured);
        console.log(`    Symptoms: ${symptoms.map((s) => s.text).join(', ') || 'None'}`);
        break;
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Query context validation
 */
export function exampleContextValidation() {
  console.log('Example 7: Query Context Validation');
  console.log('-'.repeat(80));

  const queries = [
    'What medications is the patient on?',
    'Show me everything',
    'Hello',
    'Patient info',
  ];

  console.log('  Checking if queries have sufficient context for retrieval:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);
    const hasSufficientContext = queryUnderstandingAgent.hasSufficientContext(structured);

    console.log(`    Intent: ${structured.intent}`);
    console.log(`    Entities: ${structured.entities.length}`);
    console.log(`    Has temporal: ${structured.temporal_filter ? 'Yes' : 'No'}`);
    console.log(`    Sufficient context: ${hasSufficientContext ? '✓ Yes' : '✗ No'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Batch query processing
 */
export function exampleBatchProcessing() {
  console.log('Example 8: Batch Query Processing');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'Current medications', patientId: 'patient_001' },
    { query: 'Care plan for diabetes', patientId: 'patient_002' },
    { query: 'Recent progress notes', patientId: 'patient_003' },
    { query: 'Lab results from last week', patientId: 'patient_004' },
  ];

  console.log(`  Processing ${queries.length} queries in batch:\n`);

  const results = queryUnderstandingAgent.parseBatch(queries);

  results.forEach((structured, i) => {
    console.log(`  Result ${i + 1}:`);
    console.log(`    Patient: ${structured.patient_id}`);
    console.log(`    Intent: ${structured.intent}`);
    console.log(`    Summary: ${queryUnderstandingAgent.getSummary(structured)}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Query sanitization
 */
export function exampleQuerySanitization() {
  console.log('Example 9: Query Sanitization');
  console.log('-'.repeat(80));

  const queries = [
    '  What medications   is the patient  on?  ',
    'Show me patient@#$ info',
    'Recent    notes    with    extra    spaces',
  ];

  console.log('  Sanitizing queries before processing:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}:`);
    console.log(`    Original: "${query}"`);

    const sanitized = queryUnderstandingAgent.sanitizeQuery(query);
    console.log(`    Sanitized: "${sanitized}"`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Filter construction
 */
export function exampleFilterConstruction() {
  console.log('Example 10: Filter Construction');
  console.log('-'.repeat(80));

  const queries = [
    'Medications prescribed in the last month',
    'Care plan updates since January',
    'All progress notes',
  ];

  console.log('  Examining filter construction:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"`);

    const structured = queryUnderstandingAgent.parse(query, PATIENT_ID);

    console.log('    Constructed filters:');
    if (structured.filters.artifact_types) {
      console.log(`      Artifact types: ${structured.filters.artifact_types.join(', ')}`);
    }
    if (structured.filters.date_range) {
      console.log(`      Date range: ${new Date(structured.filters.date_range.from).toLocaleDateString()} to ${new Date(structured.filters.date_range.to).toLocaleDateString()}`);
    }
    if (!structured.filters.artifact_types && !structured.filters.date_range) {
      console.log('      No filters applied (retrieve all)');
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Error handling and validation
 */
export function exampleErrorHandling() {
  console.log('Example 11: Error Handling and Validation');
  console.log('-'.repeat(80));

  const testCases = [
    { query: '', patientId: PATIENT_ID, expectedError: 'Query cannot be empty' },
    { query: 'Valid query', patientId: '', expectedError: 'Patient ID cannot be empty' },
    {
      query: 'A'.repeat(1001),
      patientId: PATIENT_ID,
      expectedError: 'Query is too long',
    },
  ];

  console.log('  Testing validation and error handling:\n');

  testCases.forEach(({ query, patientId, expectedError }, i) => {
    console.log(`  Test ${i + 1}:`);
    console.log(`    Query length: ${query.length}`);
    console.log(`    Patient ID: "${patientId}"`);

    try {
      queryUnderstandingAgent.parse(query, patientId);
      console.log('    ✗ Error not thrown');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const matches = errorMessage.includes(expectedError);
      console.log(`    ${matches ? '✓' : '✗'} Error caught: "${errorMessage}"`);
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Real-world medical queries
 */
export function exampleRealWorldQueries() {
  console.log('Example 12: Real-World Medical Queries');
  console.log('-'.repeat(80));

  const queries = [
    'What medications were prescribed for diabetes in the last 3 months?',
    'Show me recent progress notes about chest pain',
    'Care plan updates for hypertension since last visit',
    'Compare HbA1c results from June to September',
    'Summarize patient medical history',
  ];

  console.log('  Processing real-world medical queries:\n');

  queries.forEach((query, i) => {
    console.log(`  Query ${i + 1}: "${query}"\n`);

    const result = queryUnderstandingAgent.parseWithMetadata(query, PATIENT_ID);

    console.log(`    Intent: ${result.intent} (${(result.intent_confidence * 100).toFixed(0)}%)`);

    if (result.entities.length > 0) {
      const entitySummary: string[] = [];
      if (result.entity_count.medications > 0)
        entitySummary.push(`${result.entity_count.medications} medication(s)`);
      if (result.entity_count.conditions > 0)
        entitySummary.push(`${result.entity_count.conditions} condition(s)`);
      if (result.entity_count.symptoms > 0)
        entitySummary.push(`${result.entity_count.symptoms} symptom(s)`);

      console.log(`    Entities: ${entitySummary.join(', ')}`);
    }

    if (result.temporal_filter) {
      console.log(`    Temporal: ${result.temporal_filter.timeReference}`);
    }

    console.log(`    Summary: ${queryUnderstandingAgent.getSummary(result)}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('QUERY UNDERSTANDING AGENT (QUA) EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicParsing();
    exampleIntentFiltering();
    exampleTemporalFiltering();
    exampleEntityExtraction();
    exampleCompleteParsingWithMetadata();
    exampleIntentSpecificExtraction();
    exampleContextValidation();
    exampleBatchProcessing();
    exampleQuerySanitization();
    exampleFilterConstruction();
    exampleErrorHandling();
    exampleRealWorldQueries();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
