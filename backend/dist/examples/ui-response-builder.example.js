"use strict";
/**
 * UI Response Builder Usage Examples
 *
 * Demonstrates:
 * - Building complete UI responses
 * - Formatting metadata
 * - Error responses
 * - Response validation
 * - Response utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBuildResponse = exampleBuildResponse;
exports.exampleFormatMetadata = exampleFormatMetadata;
exports.exampleBuildErrorResponse = exampleBuildErrorResponse;
exports.exampleValidateResponse = exampleValidateResponse;
exports.exampleAddUserInfo = exampleAddUserInfo;
exports.exampleToJSON = exampleToJSON;
exports.exampleGetResponseSize = exampleGetResponseSize;
exports.exampleTruncateResponse = exampleTruncateResponse;
exports.exampleGetResponseSummary = exampleGetResponseSummary;
exports.exampleAuditInformation = exampleAuditInformation;
exports.exampleCompletePipeline = exampleCompletePipeline;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const ui_response_builder_service_1 = __importDefault(require("../services/ui-response-builder.service"));
const intent_classifier_service_1 = require("../services/intent-classifier.service");
/**
 * Generate sample generated answer
 */
function generateSampleAnswer() {
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
    return {
        short_answer: 'Patient is taking Metformin 500mg twice daily for diabetes.',
        detailed_summary: 'Patient is currently taking Metformin 500mg twice daily for Type 2 Diabetes management (note_123). Blood glucose levels are improving with the current regimen.',
        structured_extractions: extractions,
        model: 'gpt-4',
        total_tokens: 1050,
        generation_time_ms: 3200,
    };
}
/**
 * Generate sample formatted provenance
 */
function generateSampleProvenance() {
    return [
        {
            artifact_id: 'note_123',
            artifact_type: 'clinical_note',
            snippet: '...prescribed Metformin 500mg twice daily for Type 2 Diabetes...',
            note_date: '2 days ago',
            author: 'Dr. Smith',
            source_url: 'http://localhost:3000/notes/note_123',
            char_offsets: [18, 47],
            relevance_score: 0.9,
        },
    ];
}
/**
 * Generate sample confidence score
 */
function generateSampleConfidence() {
    return {
        score: 0.85,
        label: 'high',
        components: {
            avg_retrieval_score: 0.9,
            extraction_quality: 1.0,
            support_density: 0.5,
        },
        reason: 'Confidence is high (0.85) because: retrieval scores are very high, extraction quality is excellent, some sources confirm findings.',
    };
}
/**
 * Generate sample structured query
 */
function generateSampleQuery() {
    return {
        original_query: 'What medications is the patient currently taking?',
        patient_id: 'patient_456',
        intent: intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [],
        temporal_filter: null,
        filters: {},
        detail_level: 'standard',
        query_id: `query_${Date.now()}`,
    };
}
/**
 * Generate sample query metrics
 */
function generateSampleMetrics() {
    const queryTimestamp = new Date().toISOString();
    return {
        query_timestamp: queryTimestamp,
        retrieval_time_ms: 150,
        generation_time_ms: 3200,
        validation_time_ms: 50,
        formatting_time_ms: 20,
        total_time_ms: 3420,
    };
}
/**
 * Example 1: Build complete UI response
 */
function exampleBuildResponse() {
    console.log('Example 1: Build Complete UI Response');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    // Update sources count
    ui_response_builder_service_1.default.updateSourcesCount(response, provenance.length);
    console.log('  Complete UI Response:\n');
    console.log(`    Query ID: ${response.query_id}`);
    console.log(`    Short Answer: ${response.short_answer.substring(0, 60)}...`);
    console.log(`    Extractions: ${response.structured_extractions.length}`);
    console.log(`    Provenance: ${response.provenance.length}`);
    console.log(`    Confidence: ${response.confidence.label} (${response.confidence.score.toFixed(2)})`);
    console.log(`    Total Time: ${response.metadata.total_time_ms}ms`);
    console.log(`    Model: ${response.metadata.model_used}`);
    console.log(`    Pipeline Version: ${response.audit.pipeline_version}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Format metadata
 */
function exampleFormatMetadata() {
    console.log('Example 2: Format Metadata');
    console.log('-'.repeat(80));
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const metadata = ui_response_builder_service_1.default.formatMetadata(query, metrics, 'gpt-4');
    console.log('  Response Metadata:\n');
    console.log(`    Patient ID: ${metadata.patient_id}`);
    console.log(`    Query Timestamp: ${metadata.query_timestamp}`);
    console.log(`    Response Timestamp: ${metadata.response_timestamp}`);
    console.log(`    Total Time: ${metadata.total_time_ms}ms`);
    console.log(`    Model Used: ${metadata.model_used}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Build error response
 */
function exampleBuildErrorResponse() {
    console.log('Example 3: Build Error Response');
    console.log('-'.repeat(80));
    const queryId = 'query_error_123';
    const errorResponse = ui_response_builder_service_1.default.buildErrorResponse(queryId, 'RETRIEVAL_FAILED', 'Failed to retrieve candidates from vector store', { reason: 'Connection timeout', retry: true });
    console.log('  Error Response:\n');
    console.log(`    Query ID: ${errorResponse.query_id}`);
    console.log(`    Error Code: ${errorResponse.error.code}`);
    console.log(`    Error Message: ${errorResponse.error.message}`);
    console.log(`    Error Details: ${JSON.stringify(errorResponse.error.details)}`);
    console.log(`    Error Timestamp: ${errorResponse.metadata.error_timestamp}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Validate response
 */
function exampleValidateResponse() {
    console.log('Example 4: Validate Response');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    console.log('  Validating valid response:\n');
    try {
        ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
        console.log('    ✅ Validation passed\n');
    }
    catch (error) {
        console.log(`    ❌ Validation failed: ${error.message}\n`);
    }
    // Test invalid response
    console.log('  Validating invalid response (missing required fields):\n');
    try {
        const invalidResponse = {
            query_id: 'test',
            // Missing required fields
        };
        ui_response_builder_service_1.default.validateResponse(invalidResponse);
        console.log('    ❌ Should have failed validation\n');
    }
    catch (error) {
        console.log(`    ✅ Correctly caught error: ${error.message}\n`);
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Add user info to audit
 */
function exampleAddUserInfo() {
    console.log('Example 5: Add User Info to Audit');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    console.log('  Before adding user info:');
    console.log(`    User ID: ${response.audit.user_id || 'undefined'}`);
    console.log(`    Session ID: ${response.audit.session_id || 'undefined'}\n`);
    ui_response_builder_service_1.default.addUserInfo(response, 'user_789', 'session_abc123');
    console.log('  After adding user info:');
    console.log(`    User ID: ${response.audit.user_id}`);
    console.log(`    Session ID: ${response.audit.session_id}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Format response as JSON
 */
function exampleToJSON() {
    console.log('Example 6: Format Response as JSON');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    console.log('  Compact JSON (first 100 chars):');
    const compactJSON = ui_response_builder_service_1.default.toJSON(response, false);
    console.log(`    ${compactJSON.substring(0, 100)}...\n`);
    console.log('  Pretty JSON (first 200 chars):');
    const prettyJSON = ui_response_builder_service_1.default.toJSON(response, true);
    console.log(prettyJSON.substring(0, 200).split('\n').map(line => `    ${line}`).join('\n'));
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Get response size
 */
function exampleGetResponseSize() {
    console.log('Example 7: Get Response Size');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    const sizeBytes = ui_response_builder_service_1.default.getResponseSize(response);
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    console.log('  Response Size:\n');
    console.log(`    Bytes: ${sizeBytes}`);
    console.log(`    KB: ${sizeKB}`);
    console.log(`    Too large (> 1MB): ${ui_response_builder_service_1.default.isResponseTooLarge(response) ? 'Yes' : 'No'}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Truncate large response
 */
function exampleTruncateResponse() {
    console.log('Example 8: Truncate Large Response');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    console.log('  Original response:');
    console.log(`    Extractions: ${response.structured_extractions.length}`);
    console.log(`    Provenance: ${response.provenance.length}`);
    console.log(`    Summary length: ${response.detailed_summary.length} chars\n`);
    // Force truncation with very small max size
    const truncated = ui_response_builder_service_1.default.truncateResponse(response, 1000);
    console.log('  Truncated response (max 1KB):');
    console.log(`    Extractions: ${truncated.structured_extractions.length}`);
    console.log(`    Provenance: ${truncated.provenance.length}`);
    console.log(`    Summary length: ${truncated.detailed_summary.length} chars\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Get response summary
 */
function exampleGetResponseSummary() {
    console.log('Example 9: Get Response Summary');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    const summary = ui_response_builder_service_1.default.getResponseSummary(response);
    console.log('  Response Summary:\n');
    console.log(`    ${summary}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Audit information
 */
function exampleAuditInformation() {
    console.log('Example 10: Audit Information');
    console.log('-'.repeat(80));
    const answer = generateSampleAnswer();
    const provenance = generateSampleProvenance();
    const confidence = generateSampleConfidence();
    const query = generateSampleQuery();
    const metrics = generateSampleMetrics();
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    console.log('  Audit Information:\n');
    console.log(`    Query ID: ${response.audit.query_id}`);
    console.log(`    Pipeline Version: ${response.audit.pipeline_version}`);
    console.log(`    Components Executed: ${response.audit.components_executed.length}`);
    response.audit.components_executed.forEach(component => {
        console.log(`      - ${component}`);
    });
    console.log('\n    Timestamps:');
    console.log(`      Query Received: ${response.audit.timestamps.query_received}`);
    console.log(`      Retrieval Completed: ${response.audit.timestamps.retrieval_completed}`);
    console.log(`      Generation Completed: ${response.audit.timestamps.generation_completed}`);
    console.log(`      Response Sent: ${response.audit.timestamps.response_sent}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Complete pipeline integration
 */
function exampleCompletePipeline() {
    console.log('Example 11: Complete Pipeline Integration');
    console.log('-'.repeat(80));
    console.log('  Simulating complete RAG pipeline:\n');
    // Simulate pipeline steps
    console.log('    1. Query Understanding ✓');
    const query = generateSampleQuery();
    console.log('    2. Retrieval ✓');
    const metrics = generateSampleMetrics();
    console.log('    3. Answer Generation ✓');
    const answer = generateSampleAnswer();
    console.log('    4. Confidence Scoring ✓');
    const confidence = generateSampleConfidence();
    console.log('    5. Citation Validation ✓');
    console.log('    6. Provenance Formatting ✓');
    const provenance = generateSampleProvenance();
    console.log('    7. UI Response Building ✓\n');
    const response = ui_response_builder_service_1.default.build(answer, provenance, confidence, query, metrics);
    ui_response_builder_service_1.default.updateSourcesCount(response, provenance.length);
    ui_response_builder_service_1.default.addUserInfo(response, 'user_123', 'session_456');
    console.log('  Final Response:');
    console.log(`    Query ID: ${response.query_id}`);
    console.log(`    Answer: ${response.short_answer}`);
    console.log(`    Confidence: ${response.confidence.label} (${response.confidence.score.toFixed(2)})`);
    console.log(`    Sources: ${response.metadata.sources_count}`);
    console.log(`    Total Time: ${response.metadata.total_time_ms}ms\n`);
    console.log('  ✅ Complete Pipeline Success\n');
}
/**
 * Example 12: Explain UI response builder
 */
function exampleExplain() {
    console.log('Example 12: Explain UI Response Builder');
    console.log('-'.repeat(80));
    const explanation = ui_response_builder_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('UI RESPONSE BUILDER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBuildResponse();
        exampleFormatMetadata();
        exampleBuildErrorResponse();
        exampleValidateResponse();
        exampleAddUserInfo();
        exampleToJSON();
        exampleGetResponseSize();
        exampleTruncateResponse();
        exampleGetResponseSummary();
        exampleAuditInformation();
        exampleCompletePipeline();
        exampleExplain();
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
//# sourceMappingURL=ui-response-builder.example.js.map