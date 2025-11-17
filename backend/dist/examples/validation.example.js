"use strict";
/**
 * Validation Service Usage Examples
 *
 * Demonstrates comprehensive artifact validation:
 * - Required field validation
 * - Type checking
 * - Date validity (ISO 8601, future dates, old dates)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleValidArtifact = exampleValidArtifact;
exports.exampleMissingRequiredFields = exampleMissingRequiredFields;
exports.exampleInvalidTypes = exampleInvalidTypes;
exports.exampleInvalidDateFormat = exampleInvalidDateFormat;
exports.exampleFutureDate = exampleFutureDate;
exports.exampleVeryOldDate = exampleVeryOldDate;
exports.exampleDateBefore1900 = exampleDateBefore1900;
exports.exampleEmptyFields = exampleEmptyFields;
exports.exampleInvalidArtifactType = exampleInvalidArtifactType;
exports.exampleMultipleWarnings = exampleMultipleWarnings;
exports.exampleBatchValidation = exampleBatchValidation;
exports.exampleVeryLongText = exampleVeryLongText;
exports.exampleBooleanValidation = exampleBooleanValidation;
exports.runAllExamples = runAllExamples;
const validation_service_1 = __importDefault(require("../services/validation.service"));
/**
 * Example 1: Valid artifact - all fields present and correct
 */
function exampleValidArtifact() {
    const artifact = {
        id: 'cp_123',
        type: 'care_plan',
        patient_id: 'patient_456',
        author: 'Dr. Smith',
        occurred_at: '2024-01-15T10:30:00.000Z',
        title: 'Diabetes Management Plan',
        text: 'Comprehensive care plan for managing Type 2 diabetes with focus on diet and exercise.',
        source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_123',
        meta: {
            status: 'active',
            goals: ['Control blood sugar', 'Reduce A1C'],
        },
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 1: Valid Artifact');
    console.log('Valid:', result.valid);
    console.log('Errors:', result.errors.length);
    console.log('Warnings:', result.warnings.length);
    console.log('Summary:', validation_service_1.default.getValidationSummary(result));
    console.log('---\n');
    return result;
}
/**
 * Example 2: Missing required fields
 */
function exampleMissingRequiredFields() {
    const artifact = {
        id: 'note_123',
        type: 'note',
        // Missing patient_id
        // Missing occurred_at
        // Missing text
        // Missing source
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 2: Missing Required Fields');
    console.log('Valid:', result.valid);
    console.log('Errors:');
    console.log(validation_service_1.default.formatErrors(result.errors));
    console.log('---\n');
    return result;
}
/**
 * Example 3: Invalid field types
 */
function exampleInvalidTypes() {
    const artifact = {
        id: 123, // Should be string
        type: 'medication',
        patient_id: 'patient_456',
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: ['array', 'not', 'string'], // Should be string
        source: 'https://demo-api.avonhealth.com/v2/medications/med_123',
        meta: 'should be object', // Should be object
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 3: Invalid Field Types');
    console.log('Valid:', result.valid);
    console.log('Errors:');
    console.log(validation_service_1.default.formatErrors(result.errors));
    console.log('---\n');
    return result;
}
/**
 * Example 4: Invalid date format
 */
function exampleInvalidDateFormat() {
    const artifact = {
        id: 'note_456',
        type: 'note',
        patient_id: 'patient_123',
        occurred_at: '01/15/2024', // Invalid format - should be ISO 8601
        text: 'Patient follow-up note',
        source: 'https://demo-api.avonhealth.com/v2/notes/note_456',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 4: Invalid Date Format');
    console.log('Valid:', result.valid);
    console.log('Errors:');
    console.log(validation_service_1.default.formatErrors(result.errors));
    console.log('---\n');
    return result;
}
/**
 * Example 5: Future date (warning)
 */
function exampleFutureDate() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days in future
    const artifact = {
        id: 'cp_789',
        type: 'care_plan',
        patient_id: 'patient_123',
        occurred_at: futureDate.toISOString(),
        text: 'Upcoming care plan',
        source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_789',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 5: Future Date (Warning)');
    console.log('Valid:', result.valid);
    console.log('Warnings:');
    console.log(validation_service_1.default.formatWarnings(result.warnings));
    console.log('Summary:', validation_service_1.default.getValidationSummary(result));
    console.log('---\n');
    return result;
}
/**
 * Example 6: Very old date (warning)
 */
function exampleVeryOldDate() {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 15); // 15 years ago
    const artifact = {
        id: 'note_999',
        type: 'note',
        patient_id: 'patient_123',
        occurred_at: oldDate.toISOString(),
        text: 'Very old medical note from 15 years ago',
        source: 'https://demo-api.avonhealth.com/v2/notes/note_999',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 6: Very Old Date (Warning)');
    console.log('Valid:', result.valid);
    console.log('Warnings:');
    console.log(validation_service_1.default.formatWarnings(result.warnings));
    console.log('Summary:', validation_service_1.default.getValidationSummary(result));
    console.log('---\n');
    return result;
}
/**
 * Example 7: Date before 1900 (error)
 */
function exampleDateBefore1900() {
    const artifact = {
        id: 'note_888',
        type: 'note',
        patient_id: 'patient_123',
        occurred_at: '1850-01-01T10:00:00.000Z', // Before 1900
        text: 'Invalid historical date',
        source: 'https://demo-api.avonhealth.com/v2/notes/note_888',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 7: Date Before 1900 (Error)');
    console.log('Valid:', result.valid);
    console.log('Errors:');
    console.log(validation_service_1.default.formatErrors(result.errors));
    console.log('---\n');
    return result;
}
/**
 * Example 8: Empty required fields
 */
function exampleEmptyFields() {
    const artifact = {
        id: '', // Empty
        type: 'medication',
        patient_id: '   ', // Whitespace only
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: '', // Empty
        source: 'https://demo-api.avonhealth.com/v2/medications/med_123',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 8: Empty Required Fields');
    console.log('Valid:', result.valid);
    console.log('Errors:');
    console.log(validation_service_1.default.formatErrors(result.errors));
    console.log('---\n');
    return result;
}
/**
 * Example 9: Invalid artifact type
 */
function exampleInvalidArtifactType() {
    const artifact = {
        id: 'test_123',
        type: 'invalid_type', // Invalid type
        patient_id: 'patient_123',
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: 'Test artifact',
        source: 'https://demo-api.avonhealth.com/v2/test/test_123',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 9: Invalid Artifact Type');
    console.log('Valid:', result.valid);
    console.log('Errors:');
    console.log(validation_service_1.default.formatErrors(result.errors));
    console.log('---\n');
    return result;
}
/**
 * Example 10: Multiple warnings (valid but with issues)
 */
function exampleMultipleWarnings() {
    const artifact = {
        id: 'unknown', // Placeholder ID (warning)
        type: 'note',
        patient_id: 'patient_123',
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: 'Short', // Very short text (warning)
        source: '/api/notes/123', // Not a full URL (warning)
        // Missing title (warning)
        // Missing author (warning)
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 10: Multiple Warnings (Valid but with Issues)');
    console.log('Valid:', result.valid);
    console.log('Errors:', result.errors.length);
    console.log('Warnings:');
    console.log(validation_service_1.default.formatWarnings(result.warnings));
    console.log('Summary:', validation_service_1.default.getValidationSummary(result));
    console.log('---\n');
    return result;
}
/**
 * Example 11: Batch validation
 */
function exampleBatchValidation() {
    const artifacts = [
        {
            id: 'cp_1',
            type: 'care_plan',
            patient_id: 'patient_123',
            occurred_at: '2024-01-15T10:30:00.000Z',
            text: 'Valid care plan',
            source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_1',
        },
        {
            id: 'med_2',
            type: 'medication',
            patient_id: 'patient_123',
            // Missing occurred_at (error)
            text: 'Medication details',
            source: 'https://demo-api.avonhealth.com/v2/medications/med_2',
        },
        {
            id: 'note_3',
            type: 'note',
            patient_id: 'patient_123',
            occurred_at: '2030-01-15T10:30:00.000Z', // Future date (warning)
            text: 'Future note',
            source: 'https://demo-api.avonhealth.com/v2/notes/note_3',
        },
    ];
    const batchResult = validation_service_1.default.validateBatch(artifacts);
    console.log('Example 11: Batch Validation');
    console.log('Total:', batchResult.totalCount);
    console.log('Valid:', batchResult.validCount);
    console.log('Invalid:', batchResult.invalidCount);
    console.log('With Warnings:', batchResult.warningCount);
    console.log('---\n');
    batchResult.results.forEach((result, index) => {
        console.log(`Artifact ${index + 1}: ${validation_service_1.default.getValidationSummary(result)}`);
    });
    console.log('---\n');
    return batchResult;
}
/**
 * Example 12: Very long text (warning)
 */
function exampleVeryLongText() {
    const longText = 'A'.repeat(60000); // 60,000 characters
    const artifact = {
        id: 'note_long',
        type: 'note',
        patient_id: 'patient_123',
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: longText,
        source: 'https://demo-api.avonhealth.com/v2/notes/note_long',
    };
    const result = validation_service_1.default.validate(artifact);
    console.log('Example 12: Very Long Text (Warning)');
    console.log('Valid:', result.valid);
    console.log('Warnings:');
    console.log(validation_service_1.default.formatWarnings(result.warnings));
    console.log('---\n');
    return result;
}
/**
 * Example 13: Simple boolean validation
 */
function exampleBooleanValidation() {
    const validArtifact = {
        id: 'cp_valid',
        type: 'care_plan',
        patient_id: 'patient_123',
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: 'Valid care plan',
        source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_valid',
    };
    const invalidArtifact = {
        id: 'cp_invalid',
        type: 'care_plan',
        // Missing patient_id
        occurred_at: '2024-01-15T10:30:00.000Z',
        text: 'Invalid care plan',
        source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_invalid',
    };
    console.log('Example 13: Simple Boolean Validation');
    console.log('Valid artifact:', validation_service_1.default.validateArtifact(validArtifact));
    console.log('Invalid artifact:', validation_service_1.default.validateArtifact(invalidArtifact));
    console.log('---\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('ARTIFACT VALIDATION EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    exampleValidArtifact();
    exampleMissingRequiredFields();
    exampleInvalidTypes();
    exampleInvalidDateFormat();
    exampleFutureDate();
    exampleVeryOldDate();
    exampleDateBefore1900();
    exampleEmptyFields();
    exampleInvalidArtifactType();
    exampleMultipleWarnings();
    exampleBatchValidation();
    exampleVeryLongText();
    exampleBooleanValidation();
    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=validation.example.js.map