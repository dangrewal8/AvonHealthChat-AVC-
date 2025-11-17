"use strict";
/**
 * Audit Logger Usage Examples
 *
 * Demonstrates:
 * - Logging queries and responses
 * - Retrieving query history
 * - Searching and filtering
 * - Exporting (JSON/CSV)
 * - Privacy and retention policies
 * - Statistics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleLogSuccessfulQuery = exampleLogSuccessfulQuery;
exports.exampleLogFailedQuery = exampleLogFailedQuery;
exports.exampleGetQueryHistory = exampleGetQueryHistory;
exports.exampleSearchByText = exampleSearchByText;
exports.exampleFilterByDateRange = exampleFilterByDateRange;
exports.exampleFilterByConfidence = exampleFilterByConfidence;
exports.exampleExportJSON = exampleExportJSON;
exports.exampleExportCSV = exampleExportCSV;
exports.exampleGetStatistics = exampleGetStatistics;
exports.exampleAdvancedSearch = exampleAdvancedSearch;
exports.exampleRetentionPolicy = exampleRetentionPolicy;
exports.exampleLogFilePath = exampleLogFilePath;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const audit_logger_service_1 = __importDefault(require("../services/audit-logger.service"));
/**
 * Generate sample query request
 */
function generateSampleRequest(patientId, queryText) {
    return {
        query_id: `query_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        patient_id: patientId,
        query_text: queryText,
        user_id: 'user_123',
        session_id: 'session_abc',
        timestamp: new Date().toISOString(),
    };
}
/**
 * Generate sample UI response
 */
function generateSampleResponse(queryId, patientId) {
    const extractions = [
        {
            type: 'medication_recommendation',
            content: {
                medication: 'Metformin',
                dosage: '500mg',
                frequency: 'twice daily',
            },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 47],
                supporting_text: 'Metformin 500mg twice daily',
            },
        },
    ];
    const provenance = [
        {
            artifact_id: 'note_123',
            artifact_type: 'clinical_note',
            snippet: '...prescribed Metformin 500mg twice daily...',
            note_date: '2 days ago',
            author: 'Dr. Smith',
            source_url: 'http://localhost:3000/notes/note_123',
            char_offsets: [18, 47],
            relevance_score: 0.9,
        },
    ];
    const confidence = {
        score: 0.85,
        label: 'high',
        components: {
            avg_retrieval_score: 0.9,
            extraction_quality: 1.0,
            support_density: 0.5,
        },
        reason: 'High confidence',
    };
    return {
        query_id: queryId,
        short_answer: 'Patient is taking Metformin 500mg twice daily.',
        detailed_summary: 'Patient is currently taking Metformin 500mg twice daily for diabetes.',
        structured_extractions: extractions,
        provenance,
        confidence,
        metadata: {
            patient_id: patientId,
            query_timestamp: new Date().toISOString(),
            response_timestamp: new Date().toISOString(),
            total_time_ms: 3420,
            sources_count: 1,
            model_used: 'gpt-4',
        },
        audit: {
            query_id: queryId,
            user_id: 'user_123',
            session_id: 'session_abc',
            components_executed: ['query-understanding', 'retriever', 'answer-generation'],
            pipeline_version: '1.0.0',
            timestamps: {
                query_received: new Date().toISOString(),
                retrieval_started: new Date().toISOString(),
                retrieval_completed: new Date().toISOString(),
                generation_started: new Date().toISOString(),
                generation_completed: new Date().toISOString(),
                response_sent: new Date().toISOString(),
            },
        },
    };
}
/**
 * Generate sample metrics
 */
function generateSampleMetrics() {
    return {
        query_timestamp: new Date().toISOString(),
        retrieval_time_ms: 150,
        generation_time_ms: 3200,
        validation_time_ms: 50,
        formatting_time_ms: 20,
        total_time_ms: 3420,
    };
}
/**
 * Example 1: Log successful query
 */
async function exampleLogSuccessfulQuery() {
    console.log('Example 1: Log Successful Query');
    console.log('-'.repeat(80));
    const request = generateSampleRequest('patient_456', 'What medications is the patient taking?');
    const response = generateSampleResponse(request.query_id, request.patient_id);
    const metrics = generateSampleMetrics();
    await audit_logger_service_1.default.logQuery(request, response, metrics);
    console.log('  Query logged successfully:');
    console.log(`    Query ID: ${request.query_id}`);
    console.log(`    Patient ID: ${request.patient_id}`);
    console.log(`    Query Text: ${request.query_text}`);
    console.log(`    Success: true`);
    console.log(`    Confidence: ${response.confidence.score.toFixed(2)}`);
    console.log(`    Total Time: ${metrics.total_time_ms}ms\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Log failed query
 */
async function exampleLogFailedQuery() {
    console.log('Example 2: Log Failed Query');
    console.log('-'.repeat(80));
    const request = generateSampleRequest('patient_456', 'Invalid query');
    const metrics = generateSampleMetrics();
    const error = 'Failed to retrieve candidates from vector store';
    await audit_logger_service_1.default.logQuery(request, null, metrics, error);
    console.log('  Query logged with error:');
    console.log(`    Query ID: ${request.query_id}`);
    console.log(`    Patient ID: ${request.patient_id}`);
    console.log(`    Success: false`);
    console.log(`    Error: ${error}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Get query history for patient
 */
async function exampleGetQueryHistory() {
    console.log('Example 3: Get Query History for Patient');
    console.log('-'.repeat(80));
    // Log some queries first
    const patientId = 'patient_789';
    for (let i = 0; i < 5; i++) {
        const request = generateSampleRequest(patientId, `Query ${i + 1}`);
        const response = generateSampleResponse(request.query_id, request.patient_id);
        const metrics = generateSampleMetrics();
        await audit_logger_service_1.default.logQuery(request, response, metrics);
    }
    // Get history
    const history = await audit_logger_service_1.default.getQueryHistory(patientId, 10);
    console.log(`  Query history for ${patientId}:\n`);
    history.forEach((entry, index) => {
        console.log(`    ${index + 1}. ${entry.query_text}`);
        console.log(`       Timestamp: ${entry.timestamp}`);
        console.log(`       Confidence: ${entry.confidence_score.toFixed(2)}`);
        console.log(`       Success: ${entry.success}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Search queries by text
 */
async function exampleSearchByText() {
    console.log('Example 4: Search Queries by Text');
    console.log('-'.repeat(80));
    // Log queries with different text
    const queries = [
        'What medications is the patient taking?',
        'What are the lab results?',
        'What medications were prescribed?',
        'Show me the care plan',
    ];
    for (const queryText of queries) {
        const request = generateSampleRequest('patient_456', queryText);
        const response = generateSampleResponse(request.query_id, request.patient_id);
        const metrics = generateSampleMetrics();
        await audit_logger_service_1.default.logQuery(request, response, metrics);
    }
    // Search for "medication"
    const results = await audit_logger_service_1.default.searchQueries({
        query_text: 'medication',
    });
    console.log('  Search results for "medication":\n');
    results.forEach((entry, index) => {
        console.log(`    ${index + 1}. ${entry.query_text}`);
    });
    console.log(`\n    Total: ${results.length} results\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Filter by date range
 */
async function exampleFilterByDateRange() {
    console.log('Example 5: Filter by Date Range');
    console.log('-'.repeat(80));
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const results = await audit_logger_service_1.default.filterByDateRange(oneDayAgo.toISOString(), now.toISOString());
    console.log(`  Queries in last 24 hours:\n`);
    console.log(`    Total: ${results.length} queries`);
    if (results.length > 0) {
        console.log(`    Earliest: ${results[results.length - 1].timestamp}`);
        console.log(`    Latest: ${results[0].timestamp}`);
    }
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Filter by confidence score
 */
async function exampleFilterByConfidence() {
    console.log('Example 6: Filter by Confidence Score');
    console.log('-'.repeat(80));
    // Search for high-confidence queries (> 0.8)
    const highConfidence = await audit_logger_service_1.default.searchQueries({
        min_confidence: 0.8,
    });
    console.log('  High-confidence queries (> 0.8):\n');
    console.log(`    Total: ${highConfidence.length} queries`);
    if (highConfidence.length > 0) {
        console.log(`    Average confidence: ${(highConfidence.reduce((sum, e) => sum + e.confidence_score, 0) / highConfidence.length).toFixed(2)}`);
    }
    console.log('');
    // Search for low-confidence queries (< 0.5)
    const lowConfidence = await audit_logger_service_1.default.searchQueries({
        max_confidence: 0.5,
    });
    console.log('  Low-confidence queries (< 0.5):\n');
    console.log(`    Total: ${lowConfidence.length} queries\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Export as JSON
 */
async function exampleExportJSON() {
    console.log('Example 7: Export as JSON');
    console.log('-'.repeat(80));
    const json = await audit_logger_service_1.default.export('json', {
        limit: 3,
    });
    console.log('  Exported JSON (first 300 chars):\n');
    console.log(json.substring(0, 300).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Export as CSV
 */
async function exampleExportCSV() {
    console.log('Example 8: Export as CSV');
    console.log('-'.repeat(80));
    const csv = await audit_logger_service_1.default.export('csv', {
        limit: 3,
    });
    console.log('  Exported CSV (first 10 lines):\n');
    const lines = csv.split('\n').slice(0, 10);
    lines.forEach(line => {
        console.log(`    ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Get statistics
 */
async function exampleGetStatistics() {
    console.log('Example 9: Get Statistics');
    console.log('-'.repeat(80));
    const stats = audit_logger_service_1.default.getStatistics();
    console.log('  Audit Statistics:\n');
    console.log(`    Total Queries: ${stats.total_queries}`);
    console.log(`    Successful: ${stats.successful_queries}`);
    console.log(`    Failed: ${stats.failed_queries}`);
    console.log(`    Success Rate: ${stats.success_rate.toFixed(1)}%`);
    console.log(`    Avg Confidence: ${stats.avg_confidence_score.toFixed(2)}`);
    console.log(`    Avg Processing Time: ${stats.avg_processing_time_ms.toFixed(0)}ms`);
    console.log(`    Unique Patients: ${stats.unique_patients}`);
    console.log(`    Unique Users: ${stats.unique_users}`);
    if (stats.date_range.earliest) {
        console.log(`    Date Range: ${stats.date_range.earliest} to ${stats.date_range.latest}`);
    }
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Advanced search
 */
async function exampleAdvancedSearch() {
    console.log('Example 10: Advanced Search');
    console.log('-'.repeat(80));
    // Search with multiple filters
    const results = await audit_logger_service_1.default.searchQueries({
        patient_id: 'patient_456',
        query_text: 'medication',
        min_confidence: 0.7,
        success_only: true,
        limit: 10,
    });
    console.log('  Advanced search results:');
    console.log('    Filters:');
    console.log('      - Patient: patient_456');
    console.log('      - Query text contains: "medication"');
    console.log('      - Min confidence: 0.7');
    console.log('      - Success only: true');
    console.log('      - Limit: 10\n');
    console.log(`    Results: ${results.length} queries\n`);
    results.forEach((entry, index) => {
        console.log(`    ${index + 1}. ${entry.query_text}`);
        console.log(`       Confidence: ${entry.confidence_score.toFixed(2)}`);
        console.log(`       Time: ${entry.total_time_ms}ms`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Retention policy
 */
async function exampleRetentionPolicy() {
    console.log('Example 11: Retention Policy');
    console.log('-'.repeat(80));
    // Set retention policy
    audit_logger_service_1.default.setRetentionPolicy({
        retention_days: 90,
        auto_cleanup: true,
        anonymize_after_days: 30,
    });
    console.log('  Retention policy set:');
    console.log('    Retention: 90 days');
    console.log('    Auto-cleanup: Enabled');
    console.log('    Anonymize after: 30 days\n');
    // Apply retention policy
    console.log('  Applying retention policy...');
    audit_logger_service_1.default.applyRetentionPolicy();
    console.log('  Policy applied\n');
    // Anonymize old entries
    console.log('  Anonymizing old entries...');
    audit_logger_service_1.default.anonymizeOldEntries();
    console.log('  Anonymization complete\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Log file path
 */
async function exampleLogFilePath() {
    console.log('Example 12: Log File Path');
    console.log('-'.repeat(80));
    const logPath = audit_logger_service_1.default.getLogFilePath();
    console.log('  Audit log file:');
    console.log(`    Path: ${logPath}`);
    console.log(`    Total entries: ${audit_logger_service_1.default.getTotalCount()}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 13: Explain audit logger
 */
async function exampleExplain() {
    console.log('Example 13: Explain Audit Logger');
    console.log('-'.repeat(80));
    const explanation = audit_logger_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('AUDIT LOGGER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        // Clear any existing entries
        audit_logger_service_1.default.clear();
        await exampleLogSuccessfulQuery();
        await exampleLogFailedQuery();
        await exampleGetQueryHistory();
        await exampleSearchByText();
        await exampleFilterByDateRange();
        await exampleFilterByConfidence();
        await exampleExportJSON();
        await exampleExportCSV();
        await exampleGetStatistics();
        await exampleAdvancedSearch();
        await exampleRetentionPolicy();
        await exampleLogFilePath();
        await exampleExplain();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=audit-logger.example.js.map