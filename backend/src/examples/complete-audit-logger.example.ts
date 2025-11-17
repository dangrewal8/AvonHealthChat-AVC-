/**
 * Complete Audit Logger Usage Examples
 *
 * Demonstrates:
 * - Logging complete audit entries (per ChatGPT specification)
 * - All required fields: user_id, patient_id, query_text, artifact_ids,
 *   LLM prompt, LLM response, timestamp, model version
 * - Query and filtering
 * - Privacy modes
 * - Export capabilities
 */

import completeAuditLogger, {
  CompleteAuditEntry,
  LLMInteraction,
  RetrievalDetails,
  PrivacyMode,
} from '../services/complete-audit-logger.service';

/**
 * Generate sample complete audit entry
 */
function generateSampleEntry(
  userId: string,
  patientId: string,
  queryText: string
): CompleteAuditEntry {
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const retrieval: RetrievalDetails = {
    artifact_ids: ['note_123', 'note_456', 'lab_789'],
    chunk_ids: ['chunk_001', 'chunk_002', 'chunk_003'],
    relevance_scores: [0.92, 0.88, 0.85],
    retrieval_time_ms: 150,
    retrieval_method: 'vector_search',
  };

  const llmInteraction: LLMInteraction = {
    prompt: `You are a medical assistant. Based on the following patient records, answer the question: "${queryText}"\n\nRecord 1: Patient prescribed Metformin 500mg twice daily...\nRecord 2: Follow-up scheduled in 2 weeks...\nRecord 3: Lab results show HbA1c at 6.5%...`,
    response: 'Patient is currently taking Metformin 500mg twice daily for Type 2 Diabetes management. Blood glucose levels are improving with the current regimen.',
    model: 'meditron',
    model_version: 'meditron:7b',
    temperature: 0.3,
    max_tokens: 500,
    tokens_used: 450,
    prompt_tokens: 250,
    completion_tokens: 200,
    latency_ms: 3200,
  };

  return {
    query_id: queryId,
    timestamp: new Date().toISOString(),
    user_id: userId,
    patient_id: patientId,
    query_text: queryText,
    query_intent: 'RETRIEVE_MEDICATIONS',
    retrieval,
    llm_interaction: llmInteraction,
    response_summary: 'Patient is taking Metformin 500mg twice daily.',
    confidence_score: 0.85,
    success: true,
    total_time_ms: 3420,
    session_id: 'session_abc123',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0',
    pipeline_version: '1.0.0',
  };
}

/**
 * Example 1: Log complete audit entry (ChatGPT requirements)
 */
export async function exampleLogComplete() {
  console.log('Example 1: Log Complete Audit Entry (ChatGPT Requirements)');
  console.log('-'.repeat(80));

  const entry = generateSampleEntry('user_123', 'patient_456', 'What medications is the patient taking?');

  await completeAuditLogger.logComplete(entry);

  console.log('  ✓ Logged complete audit entry:\n');
  console.log('    ChatGPT Required Fields:');
  console.log(`      • user_id: ${entry.user_id}`);
  console.log(`      • patient_id: ${entry.patient_id}`);
  console.log(`      • query_text: ${entry.query_text}`);
  console.log(`      • retrieved artifact_ids: ${entry.retrieval.artifact_ids.join(', ')}`);
  console.log(`      • LLM prompt: ${entry.llm_interaction.prompt.substring(0, 80)}...`);
  console.log(`      • LLM response: ${entry.llm_interaction.response.substring(0, 80)}...`);
  console.log(`      • timestamp: ${entry.timestamp}`);
  console.log(`      • model version: ${entry.llm_interaction.model_version}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Log multiple queries
 */
export async function exampleLogMultiple() {
  console.log('Example 2: Log Multiple Queries');
  console.log('-'.repeat(80));

  const queries = [
    { userId: 'user_123', patientId: 'patient_456', query: 'What are the lab results?' },
    { userId: 'user_123', patientId: 'patient_456', query: 'When is the next appointment?' },
    { userId: 'user_789', patientId: 'patient_101', query: 'What is the diagnosis?' },
  ];

  for (const q of queries) {
    const entry = generateSampleEntry(q.userId, q.patientId, q.query);
    await completeAuditLogger.logComplete(entry);
  }

  console.log(`  Logged ${queries.length} queries:\n`);
  queries.forEach((q, i) => {
    console.log(`    ${i + 1}. ${q.query}`);
    console.log(`       User: ${q.userId}, Patient: ${q.patientId}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Query by patient_id
 */
export async function exampleQueryByPatient() {
  console.log('Example 3: Query by Patient ID');
  console.log('-'.repeat(80));

  const results = await completeAuditLogger.query({
    patient_id: 'patient_456',
    limit: 10,
  });

  console.log(`  Found ${results.length} queries for patient_456:\n`);
  results.forEach((entry, i) => {
    console.log(`    ${i + 1}. ${entry.query_text}`);
    console.log(`       Query ID: ${entry.query_id}`);
    console.log(`       Timestamp: ${entry.timestamp}`);
    console.log(`       Model: ${entry.llm_interaction.model}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Query by user_id
 */
export async function exampleQueryByUser() {
  console.log('Example 4: Query by User ID');
  console.log('-'.repeat(80));

  const results = await completeAuditLogger.query({
    user_id: 'user_123',
    limit: 10,
  });

  console.log(`  Found ${results.length} queries by user_123:\n`);
  results.forEach((entry, i) => {
    console.log(`    ${i + 1}. ${entry.query_text}`);
    console.log(`       Patient: ${entry.patient_id}`);
    console.log(`       Success: ${entry.success ? '✓' : '✗'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Get by query_id
 */
export async function exampleGetByQueryId() {
  console.log('Example 5: Get by Query ID');
  console.log('-'.repeat(80));

  // First, log an entry
  const entry = generateSampleEntry('user_123', 'patient_456', 'What is the care plan?');
  await completeAuditLogger.logComplete(entry);

  // Then retrieve it
  const retrieved = await completeAuditLogger.getByQueryId(entry.query_id);

  if (retrieved) {
    console.log('  Retrieved audit entry:\n');
    console.log(`    Query ID: ${retrieved.query_id}`);
    console.log(`    Query: ${retrieved.query_text}`);
    console.log(`    User: ${retrieved.user_id}`);
    console.log(`    Patient: ${retrieved.patient_id}`);
    console.log(`    Artifacts: ${retrieved.retrieval.artifact_ids.join(', ')}`);
    console.log(`    Model: ${retrieved.llm_interaction.model} ${retrieved.llm_interaction.model_version}`);
    console.log(`    Tokens: ${retrieved.llm_interaction.tokens_used}`);
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Privacy mode - Full
 */
export async function examplePrivacyFull() {
  console.log('Example 6: Privacy Mode - Full');
  console.log('-'.repeat(80));

  const results = await completeAuditLogger.query({
    patient_id: 'patient_456',
    limit: 1,
    privacy_mode: PrivacyMode.FULL,
  });

  if (results.length > 0) {
    const entry = results[0];
    console.log('  Full access (all fields visible):\n');
    console.log(`    Query text: ${entry.query_text}`);
    console.log(`    LLM prompt: ${entry.llm_interaction.prompt.substring(0, 60)}...`);
    console.log(`    LLM response: ${entry.llm_interaction.response.substring(0, 60)}...`);
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Privacy mode - Redacted
 */
export async function examplePrivacyRedacted() {
  console.log('Example 7: Privacy Mode - Redacted');
  console.log('-'.repeat(80));

  const results = await completeAuditLogger.query({
    patient_id: 'patient_456',
    limit: 1,
    privacy_mode: PrivacyMode.REDACTED,
  });

  if (results.length > 0) {
    const entry = results[0];
    console.log('  Redacted (PHI removed):\n');
    console.log(`    Query text: ${entry.query_text}`);
    console.log(`    LLM prompt: ${entry.llm_interaction.prompt}`);
    console.log(`    LLM response: ${entry.llm_interaction.response}`);
    console.log(`    Artifact IDs: ${entry.retrieval.artifact_ids.join(', ')}`);
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Privacy mode - Minimal
 */
export async function examplePrivacyMinimal() {
  console.log('Example 8: Privacy Mode - Minimal');
  console.log('-'.repeat(80));

  const results = await completeAuditLogger.query({
    patient_id: 'patient_456',
    limit: 1,
    privacy_mode: PrivacyMode.MINIMAL,
  });

  if (results.length > 0) {
    const entry = results[0];
    console.log('  Minimal (only IDs and metadata):\n');
    console.log(`    Query ID: ${entry.query_id}`);
    console.log(`    User ID: ${entry.user_id}`);
    console.log(`    Patient ID: ${entry.patient_id}`);
    console.log(`    Query text: ${entry.query_text}`);
    console.log(`    Model: ${entry.llm_interaction.model}`);
    console.log(`    Tokens: ${entry.llm_interaction.tokens_used}`);
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Filter by date range
 */
export async function exampleFilterByDateRange() {
  console.log('Example 9: Filter by Date Range');
  console.log('-'.repeat(80));

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const results = await completeAuditLogger.query({
    start_date: oneDayAgo.toISOString(),
    end_date: now.toISOString(),
  });

  console.log(`  Queries in last 24 hours: ${results.length}\n`);

  if (results.length > 0) {
    console.log('  Recent queries:');
    results.slice(0, 3).forEach((entry, i) => {
      console.log(`    ${i + 1}. ${entry.query_text}`);
      console.log(`       ${entry.timestamp}`);
    });
    console.log('');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Filter by model
 */
export async function exampleFilterByModel() {
  console.log('Example 10: Filter by Model');
  console.log('-'.repeat(80));

  const results = await completeAuditLogger.query({
    model: 'meditron',
  });

  console.log(`  Queries using meditron: ${results.length}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Export as JSON
 */
export async function exampleExportJSON() {
  console.log('Example 11: Export as JSON');
  console.log('-'.repeat(80));

  const json = await completeAuditLogger.export(
    {
      patient_id: 'patient_456',
      limit: 2,
    },
    'json'
  );

  console.log('  Exported JSON (first 300 chars):\n');
  console.log(json.substring(0, 300).split('\n').map(line => `    ${line}`).join('\n'));
  console.log('    ...\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Export as CSV
 */
export async function exampleExportCSV() {
  console.log('Example 12: Export as CSV');
  console.log('-'.repeat(80));

  const csv = await completeAuditLogger.export(
    {
      user_id: 'user_123',
      limit: 3,
    },
    'csv'
  );

  console.log('  Exported CSV (first 10 lines):\n');
  const lines = csv.split('\n').slice(0, 10);
  lines.forEach(line => {
    console.log(`    ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
  });
  console.log('    ...\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 13: Get statistics
 */
export async function exampleGetStatistics() {
  console.log('Example 13: Get Statistics');
  console.log('-'.repeat(80));

  const stats = completeAuditLogger.getStatistics();

  console.log('  Audit Statistics:\n');
  console.log(`    Total queries: ${stats.total_queries}`);
  console.log(`    Successful: ${stats.successful_queries}`);
  console.log(`    Failed: ${stats.failed_queries}`);
  console.log(`    Success rate: ${stats.success_rate.toFixed(1)}%`);
  console.log(`    Avg tokens: ${stats.avg_tokens_used.toFixed(0)}`);
  console.log(`    Avg time: ${stats.avg_processing_time_ms.toFixed(0)}ms`);
  console.log(`    Unique users: ${stats.unique_users}`);
  console.log(`    Unique patients: ${stats.unique_patients}\n`);

  console.log('    Model usage:');
  Object.entries(stats.model_usage).forEach(([model, count]) => {
    console.log(`      - ${model}: ${count} queries`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 14: Log failed query
 */
export async function exampleLogFailedQuery() {
  console.log('Example 14: Log Failed Query');
  console.log('-'.repeat(80));

  const failedEntry: CompleteAuditEntry = {
    query_id: `query_error_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user_id: 'user_123',
    patient_id: 'patient_456',
    query_text: 'What are the test results?',
    retrieval: {
      artifact_ids: [],
      retrieval_time_ms: 100,
    },
    llm_interaction: {
      prompt: 'Unable to generate prompt',
      response: 'Error occurred',
      model: 'meditron',
    },
    response_summary: 'Query failed',
    success: false,
    error: 'Retrieval failed: Vector database timeout',
    total_time_ms: 150,
  };

  await completeAuditLogger.logComplete(failedEntry);

  console.log('  Logged failed query:\n');
  console.log(`    Query ID: ${failedEntry.query_id}`);
  console.log(`    Error: ${failedEntry.error}`);
  console.log(`    Success: ${failedEntry.success}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 15: Complete pipeline logging
 */
export async function exampleCompletePipeline() {
  console.log('Example 15: Complete Pipeline Logging');
  console.log('-'.repeat(80));

  console.log('  Simulating complete RAG pipeline:\n');

  const entry: CompleteAuditEntry = {
    query_id: `query_pipeline_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user_id: 'user_123',
    patient_id: 'patient_456',
    query_text: 'What medications has the patient been prescribed?',
    query_intent: 'RETRIEVE_MEDICATIONS',
    retrieval: {
      artifact_ids: ['note_123', 'note_456', 'prescription_789'],
      chunk_ids: ['chunk_001', 'chunk_002', 'chunk_003'],
      relevance_scores: [0.95, 0.90, 0.87],
      retrieval_time_ms: 180,
      retrieval_method: 'hybrid_search',
    },
    llm_interaction: {
      prompt: `You are a medical assistant. Based on these patient records, list the medications:\n\nRecord 1: Metformin 500mg twice daily\nRecord 2: Lisinopril 10mg once daily\nRecord 3: Atorvastatin 20mg at bedtime`,
      response: 'The patient has been prescribed the following medications:\n1. Metformin 500mg - twice daily for Type 2 Diabetes\n2. Lisinopril 10mg - once daily for hypertension\n3. Atorvastatin 20mg - at bedtime for cholesterol management',
      model: 'meditron',
      model_version: 'meditron:7b',
      temperature: 0.3,
      max_tokens: 500,
      tokens_used: 520,
      prompt_tokens: 280,
      completion_tokens: 240,
      latency_ms: 3400,
    },
    response_summary: 'Patient prescribed Metformin, Lisinopril, and Atorvastatin.',
    confidence_score: 0.92,
    success: true,
    total_time_ms: 3680,
    session_id: 'session_xyz789',
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    pipeline_version: '1.0.0',
  };

  await completeAuditLogger.logComplete(entry);

  console.log('    ✓ Query understanding');
  console.log('    ✓ Vector retrieval (3 artifacts)');
  console.log('    ✓ LLM generation (meditron:7b)');
  console.log('    ✓ Confidence scoring (0.92)');
  console.log('    ✓ Complete audit logged\n');

  console.log('  Pipeline details:');
  console.log(`    Total time: ${entry.total_time_ms}ms`);
  console.log(`    Retrieval time: ${entry.retrieval.retrieval_time_ms}ms`);
  console.log(`    LLM latency: ${entry.llm_interaction.latency_ms}ms`);
  console.log(`    Tokens used: ${entry.llm_interaction.tokens_used}`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 16: Log file path
 */
export async function exampleLogFilePath() {
  console.log('Example 16: Log File Path');
  console.log('-'.repeat(80));

  const logPath = completeAuditLogger.getLogFilePath();

  console.log('  Audit log file:');
  console.log(`    Path: ${logPath}`);
  console.log(`    Format: Append-only JSON lines`);
  console.log(`    Privacy mode: ${completeAuditLogger.getPrivacyMode()}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 17: Explain complete audit logger
 */
export async function exampleExplain() {
  console.log('Example 17: Explain Complete Audit Logger');
  console.log('-'.repeat(80));

  const explanation = completeAuditLogger.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('COMPLETE AUDIT LOGGER EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    // Clear existing entries
    completeAuditLogger.clear();

    await exampleLogComplete();
    await exampleLogMultiple();
    await exampleQueryByPatient();
    await exampleQueryByUser();
    await exampleGetByQueryId();
    await examplePrivacyFull();
    await examplePrivacyRedacted();
    await examplePrivacyMinimal();
    await exampleFilterByDateRange();
    await exampleFilterByModel();
    await exampleExportJSON();
    await exampleExportCSV();
    await exampleGetStatistics();
    await exampleLogFailedQuery();
    await exampleCompletePipeline();
    await exampleLogFilePath();
    await exampleExplain();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
