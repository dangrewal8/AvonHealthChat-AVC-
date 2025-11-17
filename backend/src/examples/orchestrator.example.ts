/**
 * Orchestrator Usage Examples
 *
 * Demonstrates:
 * - Basic query processing
 * - Successful pipeline execution
 * - Timeout handling
 * - Error recovery
 * - Performance monitoring
 * - Pipeline stages
 * - Partial results
 * - Integration examples
 */

import orchestrator from '../services/orchestrator.service';

/**
 * Example 1: Basic query processing
 */
export async function exampleBasicQuery() {
  console.log('Example 1: Basic Query Processing');
  console.log('-'.repeat(80));

  const query = 'What medications is the patient taking?';
  const patientId = 'patient_123';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Query:', query);
    console.log('  Patient ID:', patientId);
    console.log('\n  Response:');
    console.log('    Query ID:', response.queryId);
    console.log('    Success:', response.success);
    console.log('    Short Answer:', response.shortAnswer);
    console.log('\n  Metadata:');
    console.log('    Total Time:', response.metadata?.totalTimeMs, 'ms');
    console.log('    Stages:', response.metadata?.stages);

    console.log('\n  ✅ Success\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 2: Successful pipeline execution
 */
export async function exampleSuccessfulPipeline() {
  console.log('Example 2: Successful Pipeline Execution');
  console.log('-'.repeat(80));

  const query = 'What is the patient\'s current diagnosis?';
  const patientId = 'patient_456';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Pipeline execution:');
    console.log('    Query ID:', response.queryId);
    console.log('    Success:', response.success);
    console.log('\n  Pipeline stages completed:');

    if (response.metadata?.stages) {
      console.log('    1. Query Understanding:', response.metadata.stages.query_understanding, 'ms');
      console.log('    2. Retrieval:', response.metadata.stages.retrieval, 'ms');
      console.log('    3. Generation:', response.metadata.stages.generation, 'ms');
      console.log('    4. Confidence Scoring:', response.metadata.stages.confidence_scoring, 'ms');
      console.log('    5. Provenance Formatting:', response.metadata.stages.provenance_formatting, 'ms');
      console.log('    6. Response Building:', response.metadata.stages.response_building, 'ms');
      console.log('    7. Audit Logging:', response.metadata.stages.audit_logging, 'ms');
    }

    console.log('\n  Total time:', response.metadata?.totalTimeMs, 'ms');
    console.log('\n  ✅ Success (all 7 stages completed)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 3: Custom timeout
 */
export async function exampleCustomTimeout() {
  console.log('Example 3: Custom Timeout');
  console.log('-'.repeat(80));

  const query = 'What are the patient\'s lab results?';
  const patientId = 'patient_789';

  try {
    // Set custom timeout (10 seconds instead of default 6)
    const response = await orchestrator.processQuery(query, patientId, {
      timeout: 10000,
    });

    console.log('  Query:', query);
    console.log('  Timeout:', '10 seconds (custom)');
    console.log('\n  Response:');
    console.log('    Success:', response.success);
    console.log('    Total Time:', response.metadata?.totalTimeMs, 'ms');

    console.log('\n  ✅ Success (custom timeout)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 4: Disable audit logging
 */
export async function exampleDisableAuditLogging() {
  console.log('Example 4: Disable Audit Logging');
  console.log('-'.repeat(80));

  const query = 'What is the patient\'s care plan?';
  const patientId = 'patient_101';

  try {
    const response = await orchestrator.processQuery(query, patientId, {
      enableAuditLogging: false,
    });

    console.log('  Query:', query);
    console.log('  Audit Logging:', 'disabled');
    console.log('\n  Response:');
    console.log('    Success:', response.success);
    console.log('\n  Stages completed:');
    console.log('    Audit Logging:', response.metadata?.stages.audit_logging ? 'yes' : 'no');

    console.log('\n  ✅ Success (audit logging skipped)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 5: Session ID tracking
 */
export async function exampleSessionTracking() {
  console.log('Example 5: Session ID Tracking');
  console.log('-'.repeat(80));

  const query = 'What are the patient\'s vital signs?';
  const patientId = 'patient_202';
  const sessionId = 'session_abc123';

  try {
    const response = await orchestrator.processQuery(query, patientId, {
      sessionId,
    });

    console.log('  Query:', query);
    console.log('  Patient ID:', patientId);
    console.log('  Session ID:', sessionId);
    console.log('\n  Response:');
    console.log('    Query ID:', response.queryId);
    console.log('    Success:', response.success);

    console.log('\n  ✅ Success (session tracked)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 6: Performance monitoring
 */
export async function examplePerformanceMonitoring() {
  console.log('Example 6: Performance Monitoring');
  console.log('-'.repeat(80));

  const query = 'What allergies does the patient have?';
  const patientId = 'patient_303';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Performance metrics:\n');
    console.log('    Query ID:', response.queryId);
    console.log('    Total Time:', response.metadata?.totalTimeMs, 'ms');
    console.log('\n  Stage breakdown:');

    if (response.metadata?.stages) {
      const stages = response.metadata.stages;
      const total = response.metadata.totalTimeMs || 0;

      console.log('    Query Understanding:', stages.query_understanding, 'ms',
                  `(${((stages.query_understanding! / total) * 100).toFixed(1)}%)`);
      console.log('    Retrieval:', stages.retrieval, 'ms',
                  `(${((stages.retrieval! / total) * 100).toFixed(1)}%)`);
      console.log('    Generation:', stages.generation, 'ms',
                  `(${((stages.generation! / total) * 100).toFixed(1)}%)`);
      console.log('    Confidence Scoring:', stages.confidence_scoring, 'ms',
                  `(${((stages.confidence_scoring! / total) * 100).toFixed(1)}%)`);
      console.log('    Provenance Formatting:', stages.provenance_formatting, 'ms',
                  `(${((stages.provenance_formatting! / total) * 100).toFixed(1)}%)`);
      console.log('    Response Building:', stages.response_building, 'ms',
                  `(${((stages.response_building! / total) * 100).toFixed(1)}%)`);
      console.log('    Audit Logging:', stages.audit_logging, 'ms',
                  `(${((stages.audit_logging! / total) * 100).toFixed(1)}%)`);
    }

    console.log('\n  ✅ Success (performance tracked)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 7: Response structure
 */
export async function exampleResponseStructure() {
  console.log('Example 7: Response Structure');
  console.log('-'.repeat(80));

  const query = 'What procedures has the patient had?';
  const patientId = 'patient_404';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Full response structure:\n');
    console.log('    queryId:', response.queryId);
    console.log('    success:', response.success);
    console.log('    shortAnswer:', response.shortAnswer);
    console.log('    detailedSummary:', response.detailedSummary);
    console.log('    structuredExtractions:', response.structuredExtractions?.length, 'items');
    console.log('    provenance:', response.provenance?.length, 'items');
    console.log('    confidence:');
    console.log('      score:', response.confidence?.score);
    console.log('      label:', response.confidence?.label);
    console.log('      reason:', response.confidence?.reason);
    console.log('    metadata:');
    console.log('      totalTimeMs:', response.metadata?.totalTimeMs);
    console.log('      stages:', Object.keys(response.metadata?.stages || {}).length);

    console.log('\n  ✅ Success (complete response structure)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 8: Confidence scoring
 */
export async function exampleConfidenceScoring() {
  console.log('Example 8: Confidence Scoring');
  console.log('-'.repeat(80));

  const query = 'What is the patient\'s medication history?';
  const patientId = 'patient_505';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Query:', query);
    console.log('\n  Confidence score:');
    console.log('    Score:', response.confidence?.score);
    console.log('    Label:', response.confidence?.label);
    console.log('    Reason:', response.confidence?.reason);
    console.log('\n  Interpretation:');

    const score = response.confidence?.score || 0;
    if (score >= 0.8) {
      console.log('    High confidence - information is well-supported by sources');
    } else if (score >= 0.6) {
      console.log('    Medium confidence - some supporting evidence found');
    } else {
      console.log('    Low confidence - limited supporting evidence');
    }

    console.log('\n  ✅ Success\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 9: Provenance tracking
 */
export async function exampleProvenanceTracking() {
  console.log('Example 9: Provenance Tracking');
  console.log('-'.repeat(80));

  const query = 'What immunizations has the patient received?';
  const patientId = 'patient_606';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Query:', query);
    console.log('\n  Provenance information:');
    console.log('    Total sources:', response.provenance?.length);
    console.log('\n  Source details:');

    response.provenance?.forEach((prov: any, i: number) => {
      console.log(`\n    Source ${i + 1}:`);
      console.log('      Artifact ID:', prov.artifact_id);
      console.log('      Chunk ID:', prov.chunk_id);
      console.log('      Snippet:', prov.snippet);
      console.log('      Date:', prov.note_date);
      console.log('      URL:', prov.source_url);
    });

    console.log('\n  ✅ Success (full provenance tracked)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 10: Structured extractions
 */
export async function exampleStructuredExtractions() {
  console.log('Example 10: Structured Extractions');
  console.log('-'.repeat(80));

  const query = 'What medications is the patient currently taking?';
  const patientId = 'patient_707';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Query:', query);
    console.log('\n  Structured extractions:');
    console.log('    Total extractions:', response.structuredExtractions?.length);

    response.structuredExtractions?.forEach((ext: any, i: number) => {
      console.log(`\n    Extraction ${i + 1}:`);
      console.log('      Type:', ext.type);
      console.log('      Medication:', ext.medication);
      console.log('      Dose:', ext.dose);
      console.log('      Frequency:', ext.frequency);
      console.log('      Provenance:', ext.provenance?.length, 'sources');
    });

    console.log('\n  ✅ Success (structured data extracted)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 11: Medical record query
 */
export async function exampleMedicalRecordQuery() {
  console.log('Example 11: Medical Record Query');
  console.log('-'.repeat(80));

  const query = 'Summarize the patient\'s recent progress notes';
  const patientId = 'patient_808';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Medical query:', query);
    console.log('\n  Response:');
    console.log('    Short Answer:', response.shortAnswer);
    console.log('\n    Detailed Summary:', response.detailedSummary);
    console.log('\n  Supporting evidence:');
    console.log('    Sources:', response.provenance?.length);
    console.log('    Confidence:', response.confidence?.label);
    console.log('    Processing time:', response.metadata?.totalTimeMs, 'ms');

    console.log('\n  ✅ Success (medical query processed)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 12: Different query intents
 */
export async function exampleDifferentIntents() {
  console.log('Example 12: Different Query Intents');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'What medications is the patient on?', intent: 'RETRIEVE_MEDICATIONS' },
    { query: 'What is the patient\'s diagnosis?', intent: 'RETRIEVE_DIAGNOSIS' },
    { query: 'What allergies does the patient have?', intent: 'RETRIEVE_ALLERGIES' },
  ];

  for (const { query, intent } of queries) {
    try {
      const response = await orchestrator.processQuery(query, 'patient_909');

      console.log(`\n  Query: "${query}"`);
      console.log('    Expected Intent:', intent);
      console.log('    Success:', response.success);
      console.log('    Answer:', response.shortAnswer);
    } catch (error) {
      console.error('    ❌ Error:', error);
    }
  }

  console.log('\n  ✅ Success (multiple intents processed)\n');
}

/**
 * Example 13: Pipeline stages detail
 */
export async function examplePipelineStages() {
  console.log('Example 13: Pipeline Stages Detail');
  console.log('-'.repeat(80));

  const query = 'What is the patient\'s care plan?';
  const patientId = 'patient_010';

  try {
    const response = await orchestrator.processQuery(query, patientId);

    console.log('  Pipeline execution flow:\n');
    console.log('  Stage 1: Query Understanding (QUA)');
    console.log('    - Parse user query');
    console.log('    - Extract entities and intent');
    console.log('    - Time:', response.metadata?.stages.query_understanding, 'ms');

    console.log('\n  Stage 2: Retrieval');
    console.log('    - Search for relevant chunks');
    console.log('    - Rank by relevance');
    console.log('    - Time:', response.metadata?.stages.retrieval, 'ms');

    console.log('\n  Stage 3: Generation');
    console.log('    - Generate answer with LLM');
    console.log('    - Extract structured data');
    console.log('    - Time:', response.metadata?.stages.generation, 'ms');

    console.log('\n  Stage 4: Confidence Scoring');
    console.log('    - Calculate confidence score');
    console.log('    - Based on retrieval quality and citations');
    console.log('    - Time:', response.metadata?.stages.confidence_scoring, 'ms');

    console.log('\n  Stage 5: Provenance Formatting');
    console.log('    - Format citations for UI');
    console.log('    - Add source URLs and snippets');
    console.log('    - Time:', response.metadata?.stages.provenance_formatting, 'ms');

    console.log('\n  Stage 6: Response Building');
    console.log('    - Build final UI response');
    console.log('    - Combine all components');
    console.log('    - Time:', response.metadata?.stages.response_building, 'ms');

    console.log('\n  Stage 7: Audit Logging');
    console.log('    - Log query and response');
    console.log('    - For compliance and debugging');
    console.log('    - Time:', response.metadata?.stages.audit_logging, 'ms');

    console.log('\n  Total pipeline time:', response.metadata?.totalTimeMs, 'ms');
    console.log('\n  ✅ Success (all 7 stages completed)\n');
  } catch (error) {
    console.error('  ❌ Error:', error);
  }
}

/**
 * Example 14: Real-world scenario
 */
export async function exampleRealWorldScenario() {
  console.log('Example 14: Real-World Scenario');
  console.log('-'.repeat(80));

  console.log('  Scenario: Clinician reviewing patient chart\n');

  const queries = [
    'What medications is the patient currently taking?',
    'What are the patient\'s current diagnoses?',
    'Are there any documented allergies?',
    'What was the outcome of the last visit?',
  ];

  const patientId = 'patient_111';

  console.log('  Patient ID:', patientId);
  console.log('  Queries:', queries.length);

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    try {
      const response = await orchestrator.processQuery(query, patientId);

      console.log(`\n  Query ${i + 1}: "${query}"`);
      console.log('    Answer:', response.shortAnswer);
      console.log('    Confidence:', response.confidence?.label);
      console.log('    Sources:', response.provenance?.length);
      console.log('    Time:', response.metadata?.totalTimeMs, 'ms');
    } catch (error) {
      console.error('    ❌ Error:', error);
    }
  }

  console.log('\n  ✅ Success (real-world workflow completed)\n');
}

/**
 * Example 15: Explain orchestrator
 */
export async function exampleExplain() {
  console.log('Example 15: Explain Orchestrator');
  console.log('-'.repeat(80));

  const explanation = orchestrator.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('ORCHESTRATOR EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    await exampleBasicQuery();
    await exampleSuccessfulPipeline();
    await exampleCustomTimeout();
    await exampleDisableAuditLogging();
    await exampleSessionTracking();
    await examplePerformanceMonitoring();
    await exampleResponseStructure();
    await exampleConfidenceScoring();
    await exampleProvenanceTracking();
    await exampleStructuredExtractions();
    await exampleMedicalRecordQuery();
    await exampleDifferentIntents();
    await examplePipelineStages();
    await exampleRealWorldScenario();
    exampleExplain();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
