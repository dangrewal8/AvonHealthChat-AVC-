"use strict";
/**
 * Quick Validation Service Test
 * Run: npm run build && node dist/test-validation.js
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_service_1 = __importDefault(require("./services/validation.service"));
console.log('='.repeat(80));
console.log('ARTIFACT VALIDATION SERVICE TEST');
console.log('='.repeat(80));
console.log('\n');
// Test 1: Valid Artifact
console.log('Test 1: Valid Artifact');
const validArtifact = {
    id: 'cp_123',
    type: 'care_plan',
    patient_id: 'patient_456',
    author: 'Dr. Smith',
    occurred_at: '2024-01-15T10:30:00.000Z',
    title: 'Diabetes Management Plan',
    text: 'Comprehensive care plan for managing Type 2 diabetes.',
    source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_123',
};
const validResult = validation_service_1.default.validate(validArtifact);
console.log('  Valid:', validResult.valid ? '✅' : '❌');
console.log('  Errors:', validResult.errors.length);
console.log('  Warnings:', validResult.warnings.length);
console.log('  Summary:', validation_service_1.default.getValidationSummary(validResult));
console.log('');
// Test 2: Missing Required Fields
console.log('Test 2: Missing Required Fields');
const missingFieldsArtifact = {
    id: 'note_123',
    type: 'note',
    // Missing: patient_id, occurred_at, text, source
};
const missingResult = validation_service_1.default.validate(missingFieldsArtifact);
console.log('  Valid:', missingResult.valid ? '✅' : '❌');
console.log('  Errors:', missingResult.errors.length);
console.log('  Expected: Should have 4 errors (missing patient_id, occurred_at, text, source)');
if (missingResult.errors.length >= 4) {
    console.log('  Result: ✅ Correct number of errors');
}
else {
    console.log('  Result: ❌ Wrong number of errors');
}
console.log('');
// Test 3: Invalid Date Format
console.log('Test 3: Invalid Date Format');
const invalidDateArtifact = {
    id: 'note_456',
    type: 'note',
    patient_id: 'patient_123',
    occurred_at: '01/15/2024', // Invalid format
    text: 'Patient follow-up note',
    source: 'https://demo-api.avonhealth.com/v2/notes/note_456',
};
const dateResult = validation_service_1.default.validate(invalidDateArtifact);
console.log('  Valid:', dateResult.valid ? '✅' : '❌');
console.log('  Errors:', dateResult.errors.length);
console.log('  Expected: Should have error about ISO 8601 format');
const hasDateError = dateResult.errors.some((e) => e.field === 'occurred_at' && e.message.includes('ISO 8601'));
if (hasDateError) {
    console.log('  Result: ✅ Date validation error detected');
}
else {
    console.log('  Result: ❌ Date validation error not detected');
}
console.log('');
// Test 4: Future Date (Warning)
console.log('Test 4: Future Date (Warning)');
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);
const futureArtifact = {
    id: 'cp_789',
    type: 'care_plan',
    patient_id: 'patient_123',
    occurred_at: futureDate.toISOString(),
    text: 'Upcoming care plan',
    source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_789',
};
const futureResult = validation_service_1.default.validate(futureArtifact);
console.log('  Valid:', futureResult.valid ? '✅' : '❌');
console.log('  Errors:', futureResult.errors.length);
console.log('  Warnings:', futureResult.warnings.length);
console.log('  Expected: Should be valid but with future date warning');
const hasFutureWarning = futureResult.warnings.some((w) => w.field === 'occurred_at' && w.message.includes('future'));
if (futureResult.valid && hasFutureWarning) {
    console.log('  Result: ✅ Future date warning detected, artifact still valid');
}
else {
    console.log('  Result: ❌ Future date validation incorrect');
}
console.log('');
// Test 5: Batch Validation
console.log('Test 5: Batch Validation');
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
        // Missing occurred_at
        text: 'Medication details',
        source: 'https://demo-api.avonhealth.com/v2/medications/med_2',
    },
    {
        id: 'note_3',
        type: 'note',
        patient_id: 'patient_123',
        occurred_at: futureDate.toISOString(),
        text: 'Future note',
        source: 'https://demo-api.avonhealth.com/v2/notes/note_3',
    },
];
const batchResult = validation_service_1.default.validateBatch(artifacts);
console.log('  Total:', batchResult.totalCount);
console.log('  Valid:', batchResult.validCount);
console.log('  Invalid:', batchResult.invalidCount);
console.log('  With Warnings:', batchResult.warningCount);
console.log('  Expected: 3 total, 2 valid, 1 invalid, 1 with warnings');
if (batchResult.totalCount === 3 &&
    batchResult.validCount === 2 &&
    batchResult.invalidCount === 1) {
    console.log('  Result: ✅ Batch validation working correctly');
}
else {
    console.log('  Result: ❌ Batch validation incorrect');
}
console.log('');
// Test 6: Type Validation
console.log('Test 6: Type Validation');
const wrongTypeArtifact = {
    id: 123, // Should be string
    type: 'medication',
    patient_id: 'patient_456',
    occurred_at: '2024-01-15T10:30:00.000Z',
    text: 'Test',
    source: 'https://demo-api.avonhealth.com/v2/medications/med_123',
};
const typeResult = validation_service_1.default.validate(wrongTypeArtifact);
console.log('  Valid:', typeResult.valid ? '✅' : '❌');
console.log('  Errors:', typeResult.errors.length);
console.log('  Expected: Should have type error for id field');
const hasTypeError = typeResult.errors.some((e) => e.field === 'id' && e.message.includes('must be a string'));
if (!typeResult.valid && hasTypeError) {
    console.log('  Result: ✅ Type validation error detected');
}
else {
    console.log('  Result: ❌ Type validation error not detected');
}
console.log('');
// Summary
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log('\n');
const tests = [
    validResult.valid && validResult.errors.length === 0,
    !missingResult.valid && missingResult.errors.length >= 4,
    !dateResult.valid && hasDateError,
    futureResult.valid && hasFutureWarning,
    batchResult.totalCount === 3 && batchResult.validCount === 2 && batchResult.invalidCount === 1,
    !typeResult.valid && hasTypeError,
];
const passed = tests.filter((t) => t).length;
const total = tests.length;
console.log(`Tests Passed: ${passed}/${total}`);
console.log('');
if (passed === total) {
    console.log('✅ ALL TESTS PASSED! Validation service is working correctly.');
}
else {
    console.log('❌ SOME TESTS FAILED. Please review validation implementation.');
}
console.log('\n');
console.log('='.repeat(80));
//# sourceMappingURL=test-validation.js.map