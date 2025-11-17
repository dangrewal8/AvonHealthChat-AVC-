"use strict";
/**
 * Normalization Service Usage Examples
 *
 * This file demonstrates how to use the artifact normalization service
 * to convert raw EMR data into standardized Artifact format.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleNormalizeCarePlan = exampleNormalizeCarePlan;
exports.exampleNormalizeMedication = exampleNormalizeMedication;
exports.exampleNormalizeNote = exampleNormalizeNote;
exports.exampleMissingFields = exampleMissingFields;
exports.exampleDateConversion = exampleDateConversion;
exports.exampleNestedText = exampleNestedText;
exports.exampleValidation = exampleValidation;
exports.exampleBatchNormalization = exampleBatchNormalization;
exports.exampleTextExtraction = exampleTextExtraction;
exports.exampleIntegrationWithEMR = exampleIntegrationWithEMR;
exports.exampleMedicationNormalization = exampleMedicationNormalization;
exports.exampleSourceUrls = exampleSourceUrls;
const normalization_service_1 = __importDefault(require("../services/normalization.service"));
/**
 * Example 1: Normalize a care plan
 */
function exampleNormalizeCarePlan() {
    const rawCarePlan = {
        id: 'cp_123',
        patient_id: 'patient_456',
        title: 'Diabetes Management Plan',
        description: 'Comprehensive care plan for managing Type 2 diabetes',
        created_at: '2024-01-15T10:30:00Z',
        author: 'Dr. Smith',
        goals: ['Control blood sugar', 'Reduce A1C'],
        status: 'active',
    };
    const artifact = normalization_service_1.default.normalizeCarePlan(rawCarePlan);
    console.log('Normalized Care Plan:', artifact);
    /*
    {
      id: 'cp_123',
      type: 'care_plan',
      patient_id: 'patient_456',
      author: 'Dr. Smith',
      occurred_at: '2024-01-15T10:30:00.000Z',
      title: 'Diabetes Management Plan',
      text: 'Comprehensive care plan for managing Type 2 diabetes',
      source: 'https://demo-api.avonhealth.com/v2/care_plans/cp_123',
      meta: { goals: [...], status: 'active' }
    }
    */
    return artifact;
}
/**
 * Example 2: Normalize a medication
 */
function exampleNormalizeMedication() {
    const rawMedication = {
        id: 'med_789',
        patient_id: 'patient_456',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        prescribed_at: '2024-01-20T14:00:00Z',
        prescriber: 'Dr. Johnson',
        instructions: 'Take with food',
        indication: 'Type 2 Diabetes',
    };
    const artifact = normalization_service_1.default.normalizeMedication(rawMedication);
    console.log('Normalized Medication:', artifact);
    /*
    {
      id: 'med_789',
      type: 'medication',
      patient_id: 'patient_456',
      author: 'Dr. Johnson',
      occurred_at: '2024-01-20T14:00:00.000Z',
      title: 'Metformin 500mg',
      text: 'Medication: Metformin. Dosage: 500mg. Frequency: twice daily. Instructions: Take with food. Indication: Type 2 Diabetes',
      source: 'https://demo-api.avonhealth.com/v2/medications/med_789',
      meta: { ... }
    }
    */
    return artifact;
}
/**
 * Example 3: Normalize a clinical note
 */
function exampleNormalizeNote() {
    const rawNote = {
        id: 'note_321',
        patient_id: 'patient_456',
        title: 'Follow-up Consultation',
        content: 'Patient reports improved blood sugar control. A1C decreased from 8.5 to 7.2.',
        created_at: '2024-02-10T09:15:00Z',
        author: 'Dr. Smith',
        note_type: 'progress_note',
    };
    const artifact = normalization_service_1.default.normalizeNote(rawNote);
    console.log('Normalized Note:', artifact);
    return artifact;
}
/**
 * Example 4: Handle missing fields with defaults
 */
function exampleMissingFields() {
    const rawData = {
        // Missing id, patient_id, date
        description: 'Some medical note',
    };
    const artifact = normalization_service_1.default.normalizeNote(rawData);
    console.log('Artifact with defaults:', artifact);
    // id: 'unknown', patient_id: '', occurred_at: current timestamp
}
/**
 * Example 5: Date format conversion
 */
function exampleDateConversion() {
    const testDates = [
        { created_at: '2024-01-15T10:30:00Z' }, // ISO 8601
        { created_at: '2024-01-15' }, // Date only
        { created_at: 1705315800 }, // Unix timestamp (seconds)
        { created_at: 1705315800000 }, // Unix timestamp (milliseconds)
        { created_at: new Date('2024-01-15') }, // Date object
    ];
    testDates.forEach((rawData, index) => {
        const artifact = normalization_service_1.default.normalizeNote({
            id: `note_${index}`,
            patient_id: 'patient_123',
            content: 'Test note',
            ...rawData,
        });
        console.log(`Date ${index}:`, artifact.occurred_at);
        // All converted to ISO 8601 format
    });
}
/**
 * Example 6: Text extraction from nested objects
 */
function exampleNestedText() {
    const rawData = {
        id: 'note_999',
        patient_id: 'patient_123',
        content: {
            main: 'Patient presents with symptoms',
            details: 'Chest pain and shortness of breath',
        },
        created_at: '2024-01-15T10:30:00Z',
    };
    const artifact = normalization_service_1.default.normalizeNote(rawData);
    console.log('Extracted text:', artifact.text);
    // Should extract and combine text from nested object
}
/**
 * Example 7: Validation with errors
 */
function exampleValidation() {
    const invalidData = {
        // Missing id
        patient_id: '',
        content: '', // Empty text
        created_at: 'invalid-date',
    };
    const result = normalization_service_1.default.normalize(invalidData, 'note');
    console.log('Validation result:', result.validation);
    /*
    {
      valid: false,
      errors: [
        { field: 'id', message: '...', value: 'unknown' },
        { field: 'patient_id', message: '...', value: '' },
        { field: 'text', message: '...', value: '' },
        { field: 'occurred_at', message: '...', value: '...' }
      ],
      warnings: [...]
    }
    */
    return result;
}
/**
 * Example 8: Batch normalization
 */
function exampleBatchNormalization() {
    const rawCarePlans = [
        {
            id: 'cp_1',
            patient_id: 'patient_123',
            description: 'Plan 1',
            created_at: '2024-01-01T10:00:00Z',
        },
        {
            id: 'cp_2',
            patient_id: 'patient_123',
            description: 'Plan 2',
            created_at: '2024-01-02T10:00:00Z',
        },
        {
            id: 'cp_3',
            patient_id: 'patient_123',
            description: 'Plan 3',
            created_at: '2024-01-03T10:00:00Z',
        },
    ];
    const normalized = normalization_service_1.default.normalizeBatch(rawCarePlans, 'care_plan');
    console.log(`Normalized ${normalized.length} care plans`);
    return normalized;
}
/**
 * Example 9: Handle various text field locations
 */
function exampleTextExtraction() {
    const testCases = [
        { content: 'Direct content field' },
        { text: 'Direct text field' },
        { description: 'Description field' },
        { body: 'Body field' },
        { content: { text: 'Nested text' } },
        { data: { content: 'Deeply nested' } },
    ];
    testCases.forEach((rawData, index) => {
        const artifact = normalization_service_1.default.normalizeNote({
            id: `note_${index}`,
            patient_id: 'patient_123',
            created_at: '2024-01-15T10:30:00Z',
            ...rawData,
        });
        console.log(`Case ${index}:`, artifact.text);
    });
}
/**
 * Example 10: Integration with EMR service
 */
async function exampleIntegrationWithEMR() {
    // This would typically be used within the EMR service
    const rawCarePlans = [
    /* fetched from API */
    ];
    // Normalize all fetched care plans
    const normalizedCarePlans = normalization_service_1.default.normalizeBatch(rawCarePlans, 'care_plan');
    // Filter out invalid artifacts
    const validArtifacts = normalizedCarePlans.filter((artifact) => {
        const validation = normalization_service_1.default.validateArtifact(artifact);
        if (!validation.valid) {
            console.warn(`Invalid artifact ${artifact.id}:`, validation.errors);
            return false;
        }
        return true;
    });
    console.log(`${validArtifacts.length} valid artifacts out of ${rawCarePlans.length}`);
    return validArtifacts;
}
/**
 * Example 11: Medication-specific normalization
 */
function exampleMedicationNormalization() {
    const medications = [
        {
            id: 'med_1',
            patient_id: 'patient_123',
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'daily',
            prescribed_at: '2024-01-01T10:00:00Z',
        },
        {
            id: 'med_2',
            patient_id: 'patient_123',
            medication_name: 'Lisinopril',
            dose: '10mg',
            schedule: 'once daily',
            start_date: '2024-01-05T10:00:00Z',
            prescriber: 'Dr. Jones',
        },
    ];
    const normalized = medications.map((med) => normalization_service_1.default.normalizeMedication(med));
    normalized.forEach((artifact) => {
        console.log('Medication:', artifact.title);
        console.log('Text:', artifact.text);
        console.log('---');
    });
    return normalized;
}
/**
 * Example 12: Source URL construction
 */
function exampleSourceUrls() {
    const artifacts = [
        normalization_service_1.default.normalizeCarePlan({
            id: 'cp_123',
            patient_id: 'p1',
            description: 'Plan',
            created_at: '2024-01-01T10:00:00Z',
        }),
        normalization_service_1.default.normalizeMedication({
            id: 'med_456',
            patient_id: 'p1',
            name: 'Drug',
            prescribed_at: '2024-01-01T10:00:00Z',
        }),
        normalization_service_1.default.normalizeNote({
            id: 'note_789',
            patient_id: 'p1',
            content: 'Note',
            created_at: '2024-01-01T10:00:00Z',
        }),
    ];
    artifacts.forEach((artifact) => {
        console.log(`${artifact.type}: ${artifact.source}`);
    });
    /*
    Output:
    care_plan: https://demo-api.avonhealth.com/v2/care_plans/cp_123
    medication: https://demo-api.avonhealth.com/v2/medications/med_456
    note: https://demo-api.avonhealth.com/v2/notes/note_789
    */
}
//# sourceMappingURL=normalization.example.js.map