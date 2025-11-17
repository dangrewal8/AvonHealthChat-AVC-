"use strict";
/**
 * Answer Generation Agent Usage Examples
 *
 * Demonstrates:
 * - Complete answer generation
 * - Validation errors and handling
 * - Performance monitoring
 * - Integration with retriever
 * - Error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleGenerateAnswer = exampleGenerateAnswer;
exports.exampleValidateExtractions = exampleValidateExtractions;
exports.exampleValidateProvenance = exampleValidateProvenance;
exports.exampleCheckCharOffsets = exampleCheckCharOffsets;
exports.exampleVerifyArtifactExists = exampleVerifyArtifactExists;
exports.exampleGetExtractionStats = exampleGetExtractionStats;
exports.exampleFormatAnswer = exampleFormatAnswer;
exports.exampleExplain = exampleExplain;
exports.exampleErrorNoCandidates = exampleErrorNoCandidates;
exports.exampleErrorInvalidQuery = exampleErrorInvalidQuery;
exports.exampleValidationMissingProvenance = exampleValidationMissingProvenance;
exports.examplePerformanceMonitoring = examplePerformanceMonitoring;
exports.runAllExamples = runAllExamples;
const answer_generation_agent_service_1 = __importDefault(require("../services/answer-generation-agent.service"));
const intent_classifier_service_1 = require("../services/intent-classifier.service");
/**
 * Generate sample candidates for testing
 */
function generateSampleCandidates() {
    const chunks = [
        {
            chunk_id: 'chunk_001',
            artifact_id: 'note_123',
            patient_id: 'patient_456',
            content: 'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management. Blood glucose levels improving with current regimen.',
            metadata: {
                artifact_type: 'clinical_note',
                date: '2024-01-15T10:30:00Z',
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_002',
            artifact_id: 'note_124',
            patient_id: 'patient_456',
            content: 'Follow up scheduled in 2 weeks for blood pressure monitoring. Continue Metformin as prescribed. Monitor for hypoglycemia.',
            metadata: {
                artifact_type: 'care_plan',
                date: '2024-01-16T14:00:00Z',
                author: 'Dr. Johnson',
            },
        },
    ];
    return chunks.map((chunk, index) => ({
        chunk,
        score: 0.9 - index * 0.1,
        snippet: chunk.content.substring(0, 100),
        highlights: [],
        metadata: chunk.metadata,
        rank: index + 1,
    }));
}
/**
 * Generate sample query
 */
function generateSampleQuery(queryText) {
    return {
        original_query: queryText,
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
 * Example 1: Complete answer generation
 */
async function exampleGenerateAnswer() {
    console.log('Example 1: Complete Answer Generation');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What medications is the patient currently taking?');
    console.log(`  Query: "${query.original_query}"`);
    console.log(`  Candidates: ${candidates.length}\n`);
    try {
        // Note: Requires OPENAI_API_KEY environment variable
        // const answer = await answerGenerationAgent.generate(candidates, query);
        // console.log('  Generated Answer:\n');
        // console.log(`    Short Answer: ${answer.short_answer}`);
        // console.log(`    Detailed Summary: ${answer.detailed_summary}`);
        // console.log(`    Extractions: ${answer.structured_extractions.length}`);
        // console.log(`    Model: ${answer.model}`);
        // console.log(`    Total Tokens: ${answer.total_tokens}`);
        // console.log(`    Generation Time: ${answer.generation_time_ms}ms`);
        console.log('  ⚠️  Requires OPENAI_API_KEY to run');
        console.log('  Example structure shown in documentation\n');
    }
    catch (error) {
        console.error('  Error:', error.message);
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Validate extractions
 */
function exampleValidateExtractions() {
    console.log('Example 2: Validate Extractions');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    // Valid extraction
    const validExtraction = {
        type: 'medication_recommendation',
        content: {
            medication: 'Metformin',
            dosage: '500mg',
            frequency: 'twice daily',
        },
        provenance: {
            artifact_id: 'note_123',
            chunk_id: 'chunk_001',
            char_offsets: [18, 71],
            supporting_text: 'prescribed Metformin 500mg twice daily for Type 2 Diabetes',
        },
    };
    // Invalid extraction (bad offsets)
    const invalidExtraction = {
        type: 'medication_recommendation',
        content: {
            medication: 'Lisinopril',
        },
        provenance: {
            artifact_id: 'note_123',
            chunk_id: 'chunk_001',
            char_offsets: [500, 600], // Exceeds chunk length!
            supporting_text: 'prescribed Lisinopril 10mg',
        },
    };
    console.log('  Validating valid extraction:\n');
    const result1 = answer_generation_agent_service_1.default.validateExtractions([validExtraction], candidates);
    console.log(`    Valid: ${result1.valid}`);
    console.log(`    Errors: ${result1.errors.length}`);
    console.log(`    Warnings: ${result1.warnings.length}`);
    console.log('\n  Validating invalid extraction:\n');
    const result2 = answer_generation_agent_service_1.default.validateExtractions([invalidExtraction], candidates);
    console.log(`    Valid: ${result2.valid}`);
    console.log(`    Errors: ${result2.errors.length}`);
    if (result2.errors.length > 0) {
        console.log(`    Error messages:`);
        result2.errors.forEach(err => console.log(`      - ${err}`));
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Validate provenance
 */
function exampleValidateProvenance() {
    console.log('Example 3: Validate Provenance');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extraction = {
        type: 'medication_recommendation',
        content: {
            medication: 'Metformin',
        },
        provenance: {
            artifact_id: 'note_123',
            chunk_id: 'chunk_001',
            char_offsets: [18, 71],
            supporting_text: 'prescribed Metformin 500mg twice daily',
        },
    };
    console.log('  Checking provenance validity:\n');
    const isValid = answer_generation_agent_service_1.default.validateProvenance(extraction, candidates);
    console.log(`    Valid: ${isValid ? '✅' : '❌'}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 4: Check char offsets
 */
function exampleCheckCharOffsets() {
    console.log('Example 4: Check Char Offsets');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    console.log('  Testing char offset validation:\n');
    // Valid offsets
    console.log('    Valid offsets [18, 71]:');
    const valid = answer_generation_agent_service_1.default.checkCharOffsets('chunk_001', [18, 71], candidates);
    console.log(`      Result: ${valid ? '✅ Valid' : '❌ Invalid'}`);
    // Invalid offsets (exceeds length)
    console.log('\n    Invalid offsets [500, 600]:');
    const invalid = answer_generation_agent_service_1.default.checkCharOffsets('chunk_001', [500, 600], candidates);
    console.log(`      Result: ${invalid ? '✅ Valid' : '❌ Invalid'}`);
    // Invalid offsets (start > end)
    console.log('\n    Invalid offsets [100, 50]:');
    const invalid2 = answer_generation_agent_service_1.default.checkCharOffsets('chunk_001', [100, 50], candidates);
    console.log(`      Result: ${invalid2 ? '✅ Valid' : '❌ Invalid'}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 5: Verify artifact exists
 */
function exampleVerifyArtifactExists() {
    console.log('Example 5: Verify Artifact Exists');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    console.log('  Checking artifact existence:\n');
    // Existing artifact
    console.log('    Artifact "note_123":');
    const exists = answer_generation_agent_service_1.default.verifyArtifactExists('note_123', candidates);
    console.log(`      Result: ${exists ? '✅ Exists' : '❌ Not Found'}`);
    // Non-existing artifact
    console.log('\n    Artifact "note_999":');
    const notExists = answer_generation_agent_service_1.default.verifyArtifactExists('note_999', candidates);
    console.log(`      Result: ${notExists ? '✅ Exists' : '❌ Not Found'}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 6: Get extraction statistics
 */
function exampleGetExtractionStats() {
    console.log('Example 6: Get Extraction Statistics');
    console.log('-'.repeat(80));
    const extractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 71],
                supporting_text: 'prescribed Metformin 500mg twice daily',
            },
        },
        {
            type: 'care_plan_note',
            content: { follow_up: '2 weeks' },
            provenance: {
                artifact_id: 'note_124',
                chunk_id: 'chunk_002',
                char_offsets: [0, 50],
                supporting_text: 'Follow up scheduled in 2 weeks for blood pressure',
            },
        },
        {
            type: 'medication_recommendation',
            content: { medication: 'Lisinopril' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [100, 130],
                supporting_text: 'Lisinopril 10mg once daily',
            },
        },
    ];
    console.log('  Extraction Statistics:\n');
    const stats = answer_generation_agent_service_1.default.getExtractionStats(extractions);
    console.log(`    Total: ${stats.total}`);
    console.log(`    With Provenance: ${stats.with_provenance}`);
    console.log(`    Avg Supporting Text Length: ${stats.avg_supporting_text_length}`);
    console.log(`    By Type:`);
    Object.entries(stats.by_type).forEach(([type, count]) => {
        console.log(`      - ${type}: ${count}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 7: Format answer for display
 */
function exampleFormatAnswer() {
    console.log('Example 7: Format Answer for Display');
    console.log('-'.repeat(80));
    const mockAnswer = {
        short_answer: 'Patient is taking Metformin 500mg twice daily for diabetes.',
        detailed_summary: 'Patient is currently taking Metformin 500mg twice daily for Type 2 Diabetes management (note_123). Blood glucose levels are improving with the current regimen. A follow-up appointment is scheduled in 2 weeks for blood pressure monitoring (note_124).',
        structured_extractions: [
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
                    char_offsets: [18, 71],
                    supporting_text: 'prescribed Metformin 500mg twice daily',
                },
            },
        ],
        model: 'gpt-4',
        total_tokens: 1050,
        generation_time_ms: 3200,
    };
    console.log('  Formatted Answer:\n');
    const formatted = answer_generation_agent_service_1.default.formatAnswer(mockAnswer);
    console.log(formatted.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 8: Explain answer generation process
 */
function exampleExplain() {
    console.log('Example 8: Explain Answer Generation Process');
    console.log('-'.repeat(80));
    const explanation = answer_generation_agent_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 9: Error handling - no candidates
 */
async function exampleErrorNoCandidates() {
    console.log('Example 9: Error Handling - No Candidates');
    console.log('-'.repeat(80));
    const query = generateSampleQuery('What medications is the patient taking?');
    console.log('  Attempting to generate answer with no candidates:\n');
    try {
        await answer_generation_agent_service_1.default.generate([], query);
        console.log('    ❌ Should have thrown error');
    }
    catch (error) {
        console.log(`    ✅ Caught error: ${error.message}`);
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 10: Error handling - invalid query
 */
async function exampleErrorInvalidQuery() {
    console.log('Example 10: Error Handling - Invalid Query');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const invalidQuery = {};
    console.log('  Attempting to generate answer with invalid query:\n');
    try {
        await answer_generation_agent_service_1.default.generate(candidates, invalidQuery);
        console.log('    ❌ Should have thrown error');
    }
    catch (error) {
        console.log(`    ✅ Caught error: ${error.message}`);
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 11: Validation - missing provenance
 */
function exampleValidationMissingProvenance() {
    console.log('Example 11: Validation - Missing Provenance');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    // Extraction without provenance (intentionally invalid for testing)
    const extractionWithoutProvenance = {
        type: 'medication_recommendation',
        content: { medication: 'Aspirin' },
    };
    console.log('  Validating extraction without provenance:\n');
    const result = answer_generation_agent_service_1.default.validateExtractions([extractionWithoutProvenance], candidates);
    console.log(`    Valid: ${result.valid}`);
    console.log(`    Errors: ${result.errors.length}`);
    if (result.errors.length > 0) {
        console.log(`    Error messages:`);
        result.errors.forEach(err => console.log(`      - ${err}`));
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 12: Performance monitoring
 */
async function examplePerformanceMonitoring() {
    console.log('Example 12: Performance Monitoring');
    console.log('-'.repeat(80));
    console.log('  Metrics Tracked:\n');
    console.log('    - Total generation time (ms)');
    console.log('    - Token usage (pass1 + pass2)');
    console.log('    - Extraction count');
    console.log('    - Validation time');
    console.log('    - Model used\n');
    console.log('  Example Metrics:\n');
    console.log('    Generation Time: 3,200ms');
    console.log('    Total Tokens: 1,050');
    console.log('    Extractions: 3');
    console.log('    Model: gpt-4\n');
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('ANSWER GENERATION AGENT EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await exampleGenerateAnswer();
        exampleValidateExtractions();
        exampleValidateProvenance();
        exampleCheckCharOffsets();
        exampleVerifyArtifactExists();
        exampleGetExtractionStats();
        exampleFormatAnswer();
        exampleExplain();
        await exampleErrorNoCandidates();
        await exampleErrorInvalidQuery();
        exampleValidationMissingProvenance();
        await examplePerformanceMonitoring();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
        console.log('\nNote: Live API examples require OPENAI_API_KEY environment variable');
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=answer-generation-agent.example.js.map