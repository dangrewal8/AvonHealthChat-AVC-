"use strict";
/**
 * Entity Extractor Service Usage Examples
 *
 * Demonstrates:
 * - Medication entity extraction
 * - Condition entity extraction
 * - Symptom entity extraction
 * - Date entity extraction
 * - Person entity extraction
 * - Entity normalization
 * - Confidence scoring
 * - Mixed entity extraction
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleMedicationExtraction = exampleMedicationExtraction;
exports.exampleConditionExtraction = exampleConditionExtraction;
exports.exampleSymptomExtraction = exampleSymptomExtraction;
exports.exampleDateExtraction = exampleDateExtraction;
exports.examplePersonExtraction = examplePersonExtraction;
exports.exampleMixedEntityExtraction = exampleMixedEntityExtraction;
exports.exampleEntityNormalization = exampleEntityNormalization;
exports.exampleAbbreviationExpansion = exampleAbbreviationExpansion;
exports.exampleConfidenceScoring = exampleConfidenceScoring;
exports.exampleEntityTypeChecking = exampleEntityTypeChecking;
exports.exampleEntityPatternInspection = exampleEntityPatternInspection;
exports.exampleComplexMedicalQuery = exampleComplexMedicalQuery;
exports.runAllExamples = runAllExamples;
const entity_extractor_service_1 = __importDefault(require("../services/entity-extractor.service"));
/**
 * Example 1: Medication extraction
 */
function exampleMedicationExtraction() {
    console.log('Example 1: Medication Extraction');
    console.log('-'.repeat(80));
    const queries = [
        'Patient is on metformin 500mg twice daily',
        'Prescribed ibuprofen for pain',
        'Taking aspirin and atorvastatin',
        'Started on beta-blocker and ace inhibitor',
        'Current medications include Lipitor and Zestril',
    ];
    console.log('  Extracting medication entities:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const medications = entity_extractor_service_1.default.extractByType(query, 'medication');
        if (medications.length > 0) {
            console.log(`    Found ${medications.length} medication(s):`);
            medications.forEach((med) => {
                console.log(`      - ${med.text} (normalized: ${med.normalized})`);
                console.log(`        Confidence: ${(med.confidence * 100).toFixed(0)}%`);
            });
        }
        else {
            console.log('    No medications found');
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Condition extraction
 */
function exampleConditionExtraction() {
    console.log('Example 2: Condition Extraction');
    console.log('-'.repeat(80));
    const queries = [
        'Patient with diabetes and hypertension',
        'History of coronary artery disease',
        'Type 2 diabetes mellitus diagnosed in 2020',
        'COPD and CHF exacerbation',
        'Recent stroke with left-sided weakness',
    ];
    console.log('  Extracting condition entities:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const conditions = entity_extractor_service_1.default.extractByType(query, 'condition');
        if (conditions.length > 0) {
            console.log(`    Found ${conditions.length} condition(s):`);
            conditions.forEach((condition) => {
                console.log(`      - ${condition.text} (normalized: ${condition.normalized})`);
                console.log(`        Confidence: ${(condition.confidence * 100).toFixed(0)}%`);
            });
        }
        else {
            console.log('    No conditions found');
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Symptom extraction
 */
function exampleSymptomExtraction() {
    console.log('Example 3: Symptom Extraction');
    console.log('-'.repeat(80));
    const queries = [
        'Patient complains of chest pain and shortness of breath',
        'Experiencing nausea and vomiting',
        'Reports headache and dizziness',
        'Fever and cough for 3 days',
        'Abdominal pain with bloating',
    ];
    console.log('  Extracting symptom entities:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const symptoms = entity_extractor_service_1.default.extractByType(query, 'symptom');
        if (symptoms.length > 0) {
            console.log(`    Found ${symptoms.length} symptom(s):`);
            symptoms.forEach((symptom) => {
                console.log(`      - ${symptom.text} (normalized: ${symptom.normalized})`);
                console.log(`        Confidence: ${(symptom.confidence * 100).toFixed(0)}%`);
            });
        }
        else {
            console.log('    No symptoms found');
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Date extraction
 */
function exampleDateExtraction() {
    console.log('Example 4: Date Extraction');
    console.log('-'.repeat(80));
    const queries = [
        'Blood work from last week',
        'Visit scheduled for next Monday',
        'Medication started in January 2024',
        'Symptoms began 3 days ago',
        'Follow-up in 2 weeks',
    ];
    console.log('  Extracting date entities:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const dates = entity_extractor_service_1.default.extractByType(query, 'date');
        if (dates.length > 0) {
            console.log(`    Found ${dates.length} date(s):`);
            dates.forEach((date) => {
                console.log(`      - ${date.text}`);
                console.log(`        Normalized: ${date.normalized}`);
                console.log(`        Confidence: ${(date.confidence * 100).toFixed(0)}%`);
            });
        }
        else {
            console.log('    No dates found');
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Person extraction
 */
function examplePersonExtraction() {
    console.log('Example 5: Person Extraction');
    console.log('-'.repeat(80));
    const queries = [
        'Dr. Smith prescribed new medication',
        'Patient saw cardiologist last month',
        'Referred to endocrinologist for diabetes management',
        'Nurse practitioner adjusted dosage',
        'Follow-up with surgeon next week',
    ];
    console.log('  Extracting person entities:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const persons = entity_extractor_service_1.default.extractByType(query, 'person');
        if (persons.length > 0) {
            console.log(`    Found ${persons.length} person(s):`);
            persons.forEach((person) => {
                console.log(`      - ${person.text} (normalized: ${person.normalized})`);
                console.log(`        Confidence: ${(person.confidence * 100).toFixed(0)}%`);
            });
        }
        else {
            console.log('    No persons found');
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Mixed entity extraction
 */
function exampleMixedEntityExtraction() {
    console.log('Example 6: Mixed Entity Extraction');
    console.log('-'.repeat(80));
    const queries = [
        'Patient with diabetes on metformin 500mg twice daily',
        'Hypertension treated with lisinopril, started last month',
        'Chest pain yesterday, prescribed aspirin by Dr. Smith',
        'COPD exacerbation with shortness of breath, given albuterol',
    ];
    console.log('  Extracting all entity types:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const entities = entity_extractor_service_1.default.extractEntities(query);
        if (entities.length > 0) {
            console.log(`    Found ${entities.length} entity/entities:\n`);
            entities.forEach((entity) => {
                console.log(`      [${entity.type.toUpperCase()}] ${entity.text}`);
                console.log(`        Normalized: ${entity.normalized}`);
                console.log(`        Confidence: ${(entity.confidence * 100).toFixed(0)}%`);
                if (entity.position) {
                    console.log(`        Position: ${entity.position.start}-${entity.position.end}`);
                }
                console.log('');
            });
        }
        else {
            console.log('    No entities found\n');
        }
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Entity normalization
 */
function exampleEntityNormalization() {
    console.log('Example 7: Entity Normalization');
    console.log('-'.repeat(80));
    const queries = [
        'Patient taking Ibuprofen 400MG Q6H PRN',
        'DM controlled with metformin BID',
        'HTN managed with ACE inhibitor',
        'Recent MI with chest pain',
    ];
    console.log('  Demonstrating entity normalization:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const entities = entity_extractor_service_1.default.extractEntities(query);
        if (entities.length > 0) {
            console.log('    Entities with normalization:\n');
            entities.forEach((entity) => {
                console.log(`      Original: "${entity.text}"`);
                console.log(`      Normalized: "${entity.normalized}"`);
                console.log(`      Type: ${entity.type}`);
                console.log('');
            });
        }
    });
    console.log('  Note: Normalization includes:');
    console.log('    - Lowercase conversion');
    console.log('    - Abbreviation expansion (mg → milligram, HTN → hypertension)');
    console.log('    - Simple stemming (removing common suffixes)\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Abbreviation expansion
 */
function exampleAbbreviationExpansion() {
    console.log('Example 8: Abbreviation Expansion');
    console.log('-'.repeat(80));
    console.log('  Common medical abbreviations:\n');
    const abbreviations = entity_extractor_service_1.default.getAbbreviations();
    // Show sample abbreviations
    const sampleAbbrs = [
        'mg',
        'bid',
        'prn',
        'po',
        'htn',
        'dm',
        'cad',
        'copd',
        'sob',
    ];
    sampleAbbrs.forEach((abbr) => {
        if (abbreviations[abbr]) {
            console.log(`    ${abbr.toUpperCase()} → ${abbreviations[abbr]}`);
        }
    });
    console.log('\n  Testing abbreviation expansion in queries:\n');
    const queries = [
        'Take 500mg PO BID',
        'HTN and DM controlled',
        'Give albuterol PRN for SOB',
    ];
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const entities = entity_extractor_service_1.default.extractEntities(query);
        entities.forEach((entity) => {
            if (entity.text.toLowerCase() !== entity.normalized) {
                console.log(`    Expanded: "${entity.text}" → "${entity.normalized}"`);
            }
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Confidence scoring
 */
function exampleConfidenceScoring() {
    console.log('Example 9: Confidence Scoring');
    console.log('-'.repeat(80));
    const query = 'Patient with diabetes experiencing chest pain, taking metformin 500mg BID, saw Dr. Smith yesterday';
    console.log(`  Query: "${query}"\n`);
    const entities = entity_extractor_service_1.default.extractEntities(query);
    console.log('  Entities grouped by confidence:\n');
    // Group by confidence level
    const highConfidence = entities.filter((e) => e.confidence >= 0.9);
    const mediumConfidence = entities.filter((e) => e.confidence >= 0.7 && e.confidence < 0.9);
    const lowConfidence = entities.filter((e) => e.confidence < 0.7);
    if (highConfidence.length > 0) {
        console.log(`  High Confidence (≥90%):`);
        highConfidence.forEach((e) => {
            console.log(`    - [${e.type}] ${e.text} (${(e.confidence * 100).toFixed(0)}%)`);
        });
        console.log('');
    }
    if (mediumConfidence.length > 0) {
        console.log(`  Medium Confidence (70-90%):`);
        mediumConfidence.forEach((e) => {
            console.log(`    - [${e.type}] ${e.text} (${(e.confidence * 100).toFixed(0)}%)`);
        });
        console.log('');
    }
    if (lowConfidence.length > 0) {
        console.log(`  Low Confidence (<70%):`);
        lowConfidence.forEach((e) => {
            console.log(`    - [${e.type}] ${e.text} (${(e.confidence * 100).toFixed(0)}%)`);
        });
        console.log('');
    }
    console.log('  Note: Confidence varies by entity type and match quality\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Entity type checking
 */
function exampleEntityTypeChecking() {
    console.log('Example 10: Entity Type Checking');
    console.log('-'.repeat(80));
    const queries = [
        'Patient on metformin for diabetes',
        'Experiencing chest pain and shortness of breath',
        'Follow-up visit next Monday',
        'No medications currently',
    ];
    console.log('  Checking for specific entity types:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const hasMedication = entity_extractor_service_1.default.hasEntityType(query, 'medication');
        const hasCondition = entity_extractor_service_1.default.hasEntityType(query, 'condition');
        const hasSymptom = entity_extractor_service_1.default.hasEntityType(query, 'symptom');
        const hasDate = entity_extractor_service_1.default.hasEntityType(query, 'date');
        console.log(`    Contains medication: ${hasMedication ? 'Yes' : 'No'}`);
        console.log(`    Contains condition: ${hasCondition ? 'Yes' : 'No'}`);
        console.log(`    Contains symptom: ${hasSymptom ? 'Yes' : 'No'}`);
        console.log(`    Contains date: ${hasDate ? 'Yes' : 'No'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Entity pattern inspection
 */
function exampleEntityPatternInspection() {
    console.log('Example 11: Entity Pattern Inspection');
    console.log('-'.repeat(80));
    console.log('  Inspecting entity patterns by type:\n');
    const types = [
        'medication',
        'condition',
        'symptom',
        'person',
    ];
    types.forEach((type) => {
        const patterns = entity_extractor_service_1.default.getEntityPatterns(type);
        console.log(`  ${type.toUpperCase()}:`);
        console.log(`    Total patterns: ${patterns.length}`);
        console.log(`    Sample: ${patterns.slice(0, 5).join(', ')}...`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Complex medical query
 */
function exampleComplexMedicalQuery() {
    console.log('Example 12: Complex Medical Query');
    console.log('-'.repeat(80));
    const query = 'Patient with type 2 diabetes and hypertension on metformin 1000mg BID and lisinopril 10mg QD. ' +
        'Recent HbA1c 7.2%. Complains of fatigue and frequent urination. ' +
        'Last visit 3 weeks ago with Dr. Johnson. ' +
        'Also taking aspirin 81mg daily for CAD prevention.';
    console.log(`  Query: "${query}"\n`);
    const entities = entity_extractor_service_1.default.extractEntities(query);
    console.log(`  Extracted ${entities.length} entities:\n`);
    // Group by type
    const byType = {};
    entities.forEach((entity) => {
        if (!byType[entity.type]) {
            byType[entity.type] = [];
        }
        byType[entity.type].push(entity);
    });
    // Display grouped by type
    Object.keys(byType)
        .sort()
        .forEach((type) => {
        console.log(`  ${type.toUpperCase()} (${byType[type].length}):`);
        byType[type].forEach((entity) => {
            console.log(`    - ${entity.text} (normalized: ${entity.normalized})`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('ENTITY EXTRACTOR SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleMedicationExtraction();
        exampleConditionExtraction();
        exampleSymptomExtraction();
        exampleDateExtraction();
        examplePersonExtraction();
        exampleMixedEntityExtraction();
        exampleEntityNormalization();
        exampleAbbreviationExpansion();
        exampleConfidenceScoring();
        exampleEntityTypeChecking();
        exampleEntityPatternInspection();
        exampleComplexMedicalQuery();
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
//# sourceMappingURL=entity-extractor.example.js.map