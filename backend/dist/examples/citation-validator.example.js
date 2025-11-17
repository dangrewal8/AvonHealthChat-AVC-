"use strict";
/**
 * Citation Validator Usage Examples
 *
 * Demonstrates:
 * - Valid citations
 * - Invalid artifact IDs
 * - Invalid char offsets
 * - Text mismatches
 * - Missing provenance
 * - Validation summaries
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleValidCitations = exampleValidCitations;
exports.exampleInvalidArtifactId = exampleInvalidArtifactId;
exports.exampleInvalidCharOffsets = exampleInvalidCharOffsets;
exports.exampleTextMismatch = exampleTextMismatch;
exports.exampleMissingProvenance = exampleMissingProvenance;
exports.exampleValidateCharOffsets = exampleValidateCharOffsets;
exports.exampleValidateTextMatch = exampleValidateTextMatch;
exports.exampleValidateProvenance = exampleValidateProvenance;
exports.exampleGetValidationSummary = exampleGetValidationSummary;
exports.exampleAllHaveProvenance = exampleAllHaveProvenance;
exports.exampleValidateSingle = exampleValidateSingle;
exports.exampleGetErrorTypesSummary = exampleGetErrorTypesSummary;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const citation_validator_service_1 = __importDefault(require("../services/citation-validator.service"));
/**
 * Generate sample candidates
 */
function generateSampleCandidates() {
    const chunks = [
        {
            chunk_id: 'chunk_001',
            artifact_id: 'note_123',
            patient_id: 'patient_456',
            content: 'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management.',
            metadata: { artifact_type: 'clinical_note', date: '2024-01-15' },
        },
        {
            chunk_id: 'chunk_002',
            artifact_id: 'note_124',
            patient_id: 'patient_456',
            content: 'Follow up scheduled in 2 weeks for blood pressure monitoring.',
            metadata: { artifact_type: 'care_plan', date: '2024-01-16' },
        },
    ];
    return chunks.map((chunk, index) => ({
        chunk,
        score: 0.9 - index * 0.1,
        snippet: chunk.content.substring(0, 50),
        highlights: [],
        metadata: chunk.metadata,
        rank: index + 1,
    }));
}
/**
 * Example 1: Valid citations
 */
function exampleValidCitations() {
    console.log('Example 1: Valid Citations');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const validExtractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 47],
                supporting_text: 'Metformin 500mg twice daily',
            },
        },
        {
            type: 'care_plan_note',
            content: { follow_up: '2 weeks' },
            provenance: {
                artifact_id: 'note_124',
                chunk_id: 'chunk_002',
                char_offsets: [0, 27],
                supporting_text: 'Follow up scheduled in 2 we',
            },
        },
    ];
    const result = citation_validator_service_1.default.validate(validExtractions, candidates);
    console.log('  Validating citations with correct offsets and text:\n');
    console.log(`    Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`    Errors: ${result.error_count}`);
    console.log(`    Warnings: ${result.warning_count}`);
    console.log(`    Validated: ${result.validated_count} extractions\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Invalid artifact ID
 */
function exampleInvalidArtifactId() {
    console.log('Example 2: Invalid Artifact ID');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const invalidExtractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: {
                artifact_id: 'note_999', // Invalid artifact ID
                chunk_id: 'chunk_999', // Invalid chunk ID
                char_offsets: [18, 47],
                supporting_text: 'Metformin 500mg twice daily',
            },
        },
    ];
    const result = citation_validator_service_1.default.validate(invalidExtractions, candidates);
    console.log('  Validating citation with non-existent artifact:\n');
    console.log(`    Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`    Errors: ${result.error_count}`);
    if (result.errors.length > 0) {
        console.log('    Error details:');
        result.errors.forEach(error => {
            console.log(`      - [${error.error_type}] ${error.message}`);
        });
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Invalid char offsets
 */
function exampleInvalidCharOffsets() {
    console.log('Example 3: Invalid Char Offsets');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const invalidExtractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [500, 600], // Exceeds text length!
                supporting_text: 'Metformin 500mg twice daily',
            },
        },
    ];
    const result = citation_validator_service_1.default.validate(invalidExtractions, candidates);
    console.log('  Validating citation with offsets exceeding text length:\n');
    console.log(`    Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`    Errors: ${result.error_count}`);
    if (result.errors.length > 0) {
        console.log('    Error details:');
        result.errors.forEach(error => {
            console.log(`      - [${error.error_type}] ${error.message}`);
            if (error.details) {
                console.log(`        Offsets: [${error.details.offsets[0]}, ${error.details.offsets[1]}]`);
                console.log(`        Text length: ${error.details.text_length}`);
            }
        });
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 4: Text mismatch
 */
function exampleTextMismatch() {
    console.log('Example 4: Text Mismatch');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const mismatchExtractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 47],
                supporting_text: 'WRONG TEXT HERE', // Does not match!
            },
        },
    ];
    const result = citation_validator_service_1.default.validate(mismatchExtractions, candidates);
    console.log('  Validating citation with mismatched supporting text:\n');
    console.log(`    Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`    Errors: ${result.error_count}`);
    if (result.errors.length > 0) {
        console.log('    Error details:');
        result.errors.forEach(error => {
            console.log(`      - [${error.error_type}] ${error.message}`);
            if (error.details) {
                console.log(`        Expected: "${error.details.expected}"`);
                console.log(`        Actual: "${error.details.actual}"`);
            }
        });
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 5: Missing provenance
 */
function exampleMissingProvenance() {
    console.log('Example 5: Missing Provenance');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const missingProvenanceExtractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: undefined, // Missing provenance!
        },
    ];
    const result = citation_validator_service_1.default.validate(missingProvenanceExtractions, candidates);
    console.log('  Validating citation without provenance:\n');
    console.log(`    Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`    Errors: ${result.error_count}`);
    if (result.errors.length > 0) {
        console.log('    Error details:');
        result.errors.forEach(error => {
            console.log(`      - [${error.error_type}] ${error.message}`);
        });
    }
    console.log('\n  ✅ Success\n');
}
/**
 * Example 6: Validate char offsets
 */
function exampleValidateCharOffsets() {
    console.log('Example 6: Validate Char Offsets');
    console.log('-'.repeat(80));
    const text = 'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management.';
    console.log('  Testing char offset validation:\n');
    // Valid offsets
    console.log(`    Offsets [18, 47] in text length ${text.length}:`);
    const valid1 = citation_validator_service_1.default.validateCharOffsets([18, 47], text);
    console.log(`      ${valid1 ? '✅ Valid' : '❌ Invalid'}`);
    // Invalid: exceeds length
    console.log(`\n    Offsets [500, 600] in text length ${text.length}:`);
    const valid2 = citation_validator_service_1.default.validateCharOffsets([500, 600], text);
    console.log(`      ${valid2 ? '✅ Valid' : '❌ Invalid'}`);
    // Invalid: start >= end
    console.log(`\n    Offsets [50, 30] (start > end):`);
    const valid3 = citation_validator_service_1.default.validateCharOffsets([50, 30], text);
    console.log(`      ${valid3 ? '✅ Valid' : '❌ Invalid'}`);
    // Invalid: negative start
    console.log(`\n    Offsets [-10, 20] (negative start):`);
    const valid4 = citation_validator_service_1.default.validateCharOffsets([-10, 20], text);
    console.log(`      ${valid4 ? '✅ Valid' : '❌ Invalid'}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Validate text match
 */
function exampleValidateTextMatch() {
    console.log('Example 7: Validate Text Match');
    console.log('-'.repeat(80));
    const chunkText = 'Patient prescribed Metformin 500mg twice daily for diabetes.';
    console.log('  Testing text match validation:\n');
    // Exact match
    console.log('    Exact match:');
    const result1 = citation_validator_service_1.default.validateTextMatch('Metformin 500mg twice daily', chunkText, [19, 46]);
    console.log(`      Valid: ${result1.valid ? '✅' : '❌'}`);
    console.log(`      Warning: ${result1.warning ? 'Yes' : 'No'}\n`);
    // Trimmed match (warning)
    console.log('    Trimmed match (extra whitespace):');
    const result2 = citation_validator_service_1.default.validateTextMatch('  Metformin 500mg twice daily  ', chunkText, [19, 46]);
    console.log(`      Valid: ${result2.valid ? '✅' : '❌'}`);
    console.log(`      Warning: ${result2.warning ? 'Yes - ' + result2.warning_type : 'No'}\n`);
    // Case mismatch (warning)
    console.log('    Case mismatch:');
    const result3 = citation_validator_service_1.default.validateTextMatch('METFORMIN 500MG TWICE DAILY', chunkText, [19, 46]);
    console.log(`      Valid: ${result3.valid ? '✅' : '❌'}`);
    console.log(`      Warning: ${result3.warning ? 'Yes - ' + result3.warning_type : 'No'}\n`);
    // No match
    console.log('    No match:');
    const result4 = citation_validator_service_1.default.validateTextMatch('WRONG TEXT', chunkText, [19, 46]);
    console.log(`      Valid: ${result4.valid ? '✅' : '❌'}`);
    console.log(`      Extracted: "${result4.extracted}"\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Validate provenance
 */
function exampleValidateProvenance() {
    console.log('Example 8: Validate Provenance');
    console.log('-'.repeat(80));
    const chunk = {
        chunk_id: 'chunk_001',
        artifact_id: 'note_123',
        patient_id: 'patient_456',
        content: 'Patient prescribed Metformin 500mg twice daily for diabetes.',
        metadata: { artifact_type: 'clinical_note', date: '2024-01-15' },
    };
    console.log('  Testing provenance validation:\n');
    // Valid provenance
    const validProvenance = {
        artifact_id: 'note_123',
        chunk_id: 'chunk_001',
        char_offsets: [19, 46],
        supporting_text: 'Metformin 500mg twice daily',
    };
    console.log('    Valid provenance:');
    const valid1 = citation_validator_service_1.default.validateProvenance(validProvenance, chunk);
    console.log(`      ${valid1 ? '✅ Valid' : '❌ Invalid'}\n`);
    // Invalid: artifact ID mismatch
    const invalidProvenance1 = {
        artifact_id: 'note_999', // Wrong artifact ID
        chunk_id: 'chunk_001',
        char_offsets: [19, 46],
        supporting_text: 'Metformin 500mg twice daily',
    };
    console.log('    Invalid artifact ID:');
    const valid2 = citation_validator_service_1.default.validateProvenance(invalidProvenance1, chunk);
    console.log(`      ${valid2 ? '✅ Valid' : '❌ Invalid'}\n`);
    // Invalid: bad offsets
    const invalidProvenance2 = {
        artifact_id: 'note_123',
        chunk_id: 'chunk_001',
        char_offsets: [500, 600], // Exceeds length
        supporting_text: 'Metformin 500mg twice daily',
    };
    console.log('    Invalid char offsets:');
    const valid3 = citation_validator_service_1.default.validateProvenance(invalidProvenance2, chunk);
    console.log(`      ${valid3 ? '✅ Valid' : '❌ Invalid'}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Get validation summary
 */
function exampleGetValidationSummary() {
    console.log('Example 9: Get Validation Summary');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const mixedExtractions = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 47],
                supporting_text: 'Metformin 500mg twice daily',
            },
        },
        {
            type: 'care_plan_note',
            content: { follow_up: '2 weeks' },
            provenance: {
                artifact_id: 'note_999', // Invalid!
                chunk_id: 'chunk_999',
                char_offsets: [0, 20],
                supporting_text: 'Follow up scheduled',
            },
        },
    ];
    const result = citation_validator_service_1.default.validate(mixedExtractions, candidates);
    console.log('  Validation Summary:\n');
    const summary = citation_validator_service_1.default.getValidationSummary(result);
    console.log(summary.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('  ✅ Success\n');
}
/**
 * Example 10: All have provenance
 */
function exampleAllHaveProvenance() {
    console.log('Example 10: All Have Provenance');
    console.log('-'.repeat(80));
    const withProvenance = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 47],
                supporting_text: 'Metformin 500mg',
            },
        },
    ];
    const withoutProvenance = [
        {
            type: 'medication_recommendation',
            content: { medication: 'Metformin' },
            provenance: undefined,
        },
    ];
    console.log('  Checking provenance presence:\n');
    console.log('    All extractions have provenance:');
    const allHave1 = citation_validator_service_1.default.allHaveProvenance(withProvenance);
    console.log(`      ${allHave1 ? '✅ Yes' : '❌ No'}\n`);
    console.log('    Some extractions missing provenance:');
    const allHave2 = citation_validator_service_1.default.allHaveProvenance(withoutProvenance);
    console.log(`      ${allHave2 ? '✅ Yes' : '❌ No'}\n`);
    const missing = citation_validator_service_1.default.getExtractionsWithoutProvenance(withoutProvenance);
    console.log(`    Missing provenance at indices: ${missing.join(', ')}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Validate single extraction
 */
function exampleValidateSingle() {
    console.log('Example 11: Validate Single Extraction');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extraction = {
        type: 'medication_recommendation',
        content: { medication: 'Metformin' },
        provenance: {
            artifact_id: 'note_123',
            chunk_id: 'chunk_001',
            char_offsets: [18, 47],
            supporting_text: 'Metformin 500mg twice daily',
        },
    };
    console.log('  Validating single extraction:\n');
    const result = citation_validator_service_1.default.validateSingle(extraction, candidates);
    console.log(`    Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`    Errors: ${result.error_count}`);
    console.log(`    Warnings: ${result.warning_count}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Get error types summary
 */
function exampleGetErrorTypesSummary() {
    console.log('Example 12: Get Error Types Summary');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const problematicExtractions = [
        {
            type: 'medication_recommendation',
            content: {},
            provenance: undefined, // Missing provenance
        },
        {
            type: 'care_plan_note',
            content: {},
            provenance: {
                artifact_id: 'note_999',
                chunk_id: 'chunk_999', // Invalid artifact
                char_offsets: [0, 10],
                supporting_text: 'text',
            },
        },
        {
            type: 'general_note',
            content: {},
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [500, 600], // Invalid offsets
                supporting_text: 'text',
            },
        },
    ];
    const result = citation_validator_service_1.default.validate(problematicExtractions, candidates);
    console.log('  Error Types Summary:\n');
    const errorSummary = citation_validator_service_1.default.getErrorTypesSummary(result.errors);
    Object.entries(errorSummary).forEach(([type, count]) => {
        if (count > 0) {
            console.log(`    ${type}: ${count}`);
        }
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 13: Explain validation process
 */
function exampleExplain() {
    console.log('Example 13: Explain Validation Process');
    console.log('-'.repeat(80));
    const explanation = citation_validator_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('CITATION VALIDATOR EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleValidCitations();
        exampleInvalidArtifactId();
        exampleInvalidCharOffsets();
        exampleTextMismatch();
        exampleMissingProvenance();
        exampleValidateCharOffsets();
        exampleValidateTextMatch();
        exampleValidateProvenance();
        exampleGetValidationSummary();
        exampleAllHaveProvenance();
        exampleValidateSingle();
        exampleGetErrorTypesSummary();
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
//# sourceMappingURL=citation-validator.example.js.map