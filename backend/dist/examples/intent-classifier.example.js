"use strict";
/**
 * Intent Classifier Service Usage Examples
 *
 * Demonstrates:
 * - Medication retrieval intent classification
 * - Care plan retrieval intent classification
 * - Notes retrieval intent classification
 * - Summary intent classification
 * - Comparison intent classification
 * - Ambiguous query handling
 * - Confidence scoring
 * - Batch classification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleMedicationQueries = exampleMedicationQueries;
exports.exampleCarePlanQueries = exampleCarePlanQueries;
exports.exampleNotesQueries = exampleNotesQueries;
exports.exampleSummaryQueries = exampleSummaryQueries;
exports.exampleComparisonQueries = exampleComparisonQueries;
exports.exampleAmbiguousQueries = exampleAmbiguousQueries;
exports.exampleUnknownQueries = exampleUnknownQueries;
exports.exampleBatchClassification = exampleBatchClassification;
exports.exampleIntentKeywords = exampleIntentKeywords;
exports.exampleConfiguration = exampleConfiguration;
exports.exampleMedicalQueries = exampleMedicalQueries;
exports.runAllExamples = runAllExamples;
const intent_classifier_service_1 = __importDefault(require("../services/intent-classifier.service"));
/**
 * Example 1: Medication retrieval queries
 */
function exampleMedicationQueries() {
    console.log('Example 1: Medication Retrieval Queries');
    console.log('-'.repeat(80));
    const queries = [
        'What medications is the patient taking?',
        'Show me all prescriptions',
        'List current drugs',
        'What was prescribed for diabetes?',
        'Patient medications',
        'Is the patient on metformin?',
    ];
    console.log('  Classifying medication-related queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        if (result.ambiguousIntents && result.ambiguousIntents.length > 0) {
            console.log(`    Ambiguous intents:`);
            result.ambiguousIntents.forEach((ambiguous) => {
                console.log(`      - ${ambiguous.intent} (${(ambiguous.confidence * 100).toFixed(1)}%)`);
            });
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Care plan retrieval queries
 */
function exampleCarePlanQueries() {
    console.log('Example 2: Care Plan Retrieval Queries');
    console.log('-'.repeat(80));
    const queries = [
        'Show me the treatment plan',
        'What is the care plan for this patient?',
        'Diabetes management plan',
        'Current treatment goals',
        'Care coordination recommendations',
        'What interventions are planned?',
    ];
    console.log('  Classifying care plan-related queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Notes retrieval queries
 */
function exampleNotesQueries() {
    console.log('Example 3: Notes Retrieval Queries');
    console.log('-'.repeat(80));
    const queries = [
        'Show recent progress notes',
        'What was documented in the last visit?',
        'Clinical notes from January',
        'All encounter documentation',
        'Recent appointments',
        'What did the doctor note about blood pressure?',
    ];
    console.log('  Classifying notes-related queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Summary queries
 */
function exampleSummaryQueries() {
    console.log('Example 4: Summary Queries');
    console.log('-'.repeat(80));
    const queries = [
        'Give me a summary of the patient',
        "What's the overview of this case?",
        'Summarize the medical history',
        'Brief highlights of treatment',
        'Tell me about this patient',
        'Provide a comprehensive overview',
    ];
    console.log('  Classifying summary-related queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Comparison queries
 */
function exampleComparisonQueries() {
    console.log('Example 5: Comparison Queries');
    console.log('-'.repeat(80));
    const queries = [
        'What changed in the medication regimen?',
        'Compare blood pressure readings from June to August',
        'Show differences between previous and current care plan',
        'How did HbA1c change over time?',
        'Before and after treatment comparison',
        'What are the trends in glucose levels?',
    ];
    console.log('  Classifying comparison-related queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Ambiguous queries
 */
function exampleAmbiguousQueries() {
    console.log('Example 6: Ambiguous Queries');
    console.log('-'.repeat(80));
    const queries = [
        'Show me everything about the patient',
        'What do we have for this patient?',
        'Patient records',
        'All information',
    ];
    console.log('  Classifying ambiguous queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        if (result.ambiguousIntents && result.ambiguousIntents.length > 0) {
            console.log(`    ⚠️  Ambiguous! Other possible intents:`);
            result.ambiguousIntents.forEach((ambiguous) => {
                console.log(`      - ${ambiguous.intent} (${(ambiguous.confidence * 100).toFixed(1)}%)`);
            });
        }
        console.log('');
    });
    console.log('  Note: Ambiguous queries default to RETRIEVE_ALL\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Unknown/edge case queries
 */
function exampleUnknownQueries() {
    console.log('Example 7: Unknown/Edge Case Queries');
    console.log('-'.repeat(80));
    const queries = [
        '', // Empty query
        'Hello', // Greeting
        'How are you?', // Conversational
        'xyz123', // Gibberish
        'The weather is nice', // Unrelated
    ];
    console.log('  Classifying unknown/edge case queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ') || 'none'}`);
        console.log('');
    });
    console.log('  Note: Low-confidence queries default to RETRIEVE_ALL or UNKNOWN\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Batch classification
 */
function exampleBatchClassification() {
    console.log('Example 8: Batch Classification');
    console.log('-'.repeat(80));
    const queries = [
        'What medications is the patient on?',
        'Show me the treatment plan',
        'Recent visit notes',
        'Summarize the case',
        'What changed in blood pressure?',
    ];
    console.log('  Classifying multiple queries in batch:\n');
    const results = intent_classifier_service_1.default.classifyBatch(queries);
    results.forEach((result, i) => {
        console.log(`  Query ${i + 1}: "${queries[i]}"`);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Intent keyword inspection
 */
function exampleIntentKeywords() {
    console.log('Example 9: Intent Keyword Inspection');
    console.log('-'.repeat(80));
    console.log('  Retrieving keyword mappings for all intents:\n');
    const keywords = intent_classifier_service_1.default.getIntentKeywords();
    for (const [intent, intentKeywords] of Object.entries(keywords)) {
        if (intentKeywords.length > 0) {
            console.log(`  ${intent}:`);
            console.log(`    Keywords: ${intentKeywords.slice(0, 10).join(', ')}...`);
            console.log(`    Total: ${intentKeywords.length} keywords\n`);
        }
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Configuration inspection
 */
function exampleConfiguration() {
    console.log('Example 10: Configuration Inspection');
    console.log('-'.repeat(80));
    console.log('  Classifier configuration:\n');
    console.log(`    Minimum confidence threshold: ${intent_classifier_service_1.default.getConfidenceThreshold()}`);
    console.log(`    Ambiguity threshold: ${intent_classifier_service_1.default.getAmbiguityThreshold()}`);
    console.log('');
    console.log('  Explanation:');
    console.log('    - Queries below min confidence threshold default to RETRIEVE_ALL');
    console.log('    - Intents within ambiguity threshold are flagged as ambiguous\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Medical domain-specific queries
 */
function exampleMedicalQueries() {
    console.log('Example 11: Medical Domain-Specific Queries');
    console.log('-'.repeat(80));
    const queries = [
        'Show me HbA1c results from the last 3 months',
        'What medications were prescribed for hypertension?',
        'Diabetes management plan and goals',
        'Recent blood pressure readings documented',
        'Compare glucose levels between visits',
        'Summarize diabetic care',
    ];
    console.log('  Classifying medical domain-specific queries:\n');
    queries.forEach((query, i) => {
        console.log(`  Query ${i + 1}: "${query}"`);
        const result = intent_classifier_service_1.default.classifyIntent(query);
        console.log(`    Intent: ${result.intent}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`    Matched keywords: ${result.matchedKeywords.join(', ')}`);
        if (result.ambiguousIntents && result.ambiguousIntents.length > 0) {
            console.log(`    Also matches:`);
            result.ambiguousIntents.forEach((ambiguous) => {
                console.log(`      - ${ambiguous.intent} (${(ambiguous.confidence * 100).toFixed(1)}%)`);
            });
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('INTENT CLASSIFIER SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleMedicationQueries();
        exampleCarePlanQueries();
        exampleNotesQueries();
        exampleSummaryQueries();
        exampleComparisonQueries();
        exampleAmbiguousQueries();
        exampleUnknownQueries();
        exampleBatchClassification();
        exampleIntentKeywords();
        exampleConfiguration();
        exampleMedicalQueries();
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
//# sourceMappingURL=intent-classifier.example.js.map