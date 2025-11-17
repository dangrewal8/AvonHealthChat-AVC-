"use strict";
/**
 * Detail Level Analyzer Service Usage Examples
 *
 * Demonstrates:
 * - Basic detail level assignment
 * - Yes/no question detection
 * - Simple fact lookup detection
 * - Complex analysis detection
 * - Multi-element detection
 * - Response guidelines retrieval
 * - Integration with intent and entities
 * - Batch processing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicDetailLevel = exampleBasicDetailLevel;
exports.exampleYesNoQuestions = exampleYesNoQuestions;
exports.exampleSimpleFactLookup = exampleSimpleFactLookup;
exports.exampleComplexAnalysis = exampleComplexAnalysis;
exports.exampleDetailLevelWithReasoning = exampleDetailLevelWithReasoning;
exports.exampleResponseGuidelines = exampleResponseGuidelines;
exports.exampleIntentBasedDetailLevel = exampleIntentBasedDetailLevel;
exports.exampleMultiElementDetection = exampleMultiElementDetection;
exports.exampleBatchProcessing = exampleBatchProcessing;
exports.exampleBatchWithReasoning = exampleBatchWithReasoning;
exports.exampleHelperMethods = exampleHelperMethods;
exports.exampleFullPipeline = exampleFullPipeline;
exports.exampleEdgeCases = exampleEdgeCases;
exports.exampleAllGuidelines = exampleAllGuidelines;
exports.runAllExamples = runAllExamples;
const detail_level_analyzer_service_1 = __importStar(require("../services/detail-level-analyzer.service"));
const intent_classifier_service_1 = __importStar(require("../services/intent-classifier.service"));
const entity_extractor_service_1 = __importDefault(require("../services/entity-extractor.service"));
/**
 * Example 1: Basic detail level assignment
 */
function exampleBasicDetailLevel() {
    console.log('Example 1: Basic Detail Level Assignment');
    console.log('-'.repeat(80));
    const queries = [
        { query: 'Is patient on aspirin?', expectedLevel: detail_level_analyzer_service_1.DetailLevel.MINIMAL },
        { query: 'What medications is patient taking?', expectedLevel: detail_level_analyzer_service_1.DetailLevel.BASIC },
        { query: 'Show me recent lab results', expectedLevel: detail_level_analyzer_service_1.DetailLevel.STANDARD },
        {
            query: 'Compare blood pressure trends over last 3 months',
            expectedLevel: detail_level_analyzer_service_1.DetailLevel.COMPREHENSIVE,
        },
    ];
    console.log('  Analyzing query detail levels:\n');
    queries.forEach(({ query, expectedLevel }, i) => {
        const intent = intent_classifier_service_1.default.classifyIntent(query).intent;
        const level = detail_level_analyzer_service_1.default.analyzeQuery(query, intent);
        const match = level === expectedLevel ? '✓' : '✗';
        console.log(`  Query ${i + 1}: "${query}"`);
        console.log(`    Assigned Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
        console.log(`    Expected Level: ${expectedLevel}`);
        console.log(`    Match: ${match}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Yes/no question detection
 */
function exampleYesNoQuestions() {
    console.log('Example 2: Yes/No Question Detection (Level 1)');
    console.log('-'.repeat(80));
    const queries = [
        'Is patient on aspirin?',
        'Did patient have surgery in 2023?',
        'Has patient been diagnosed with diabetes?',
        'Was patient admitted to hospital?',
        'Does patient have any allergies?',
        'Can patient take ibuprofen?',
        'Will patient need follow-up?',
    ];
    console.log('  Detecting yes/no questions:\n');
    queries.forEach((query, i) => {
        const intent = intent_classifier_service_1.default.classifyIntent(query).intent;
        const level = detail_level_analyzer_service_1.default.analyzeQuery(query, intent);
        const isMinimal = level === detail_level_analyzer_service_1.DetailLevel.MINIMAL;
        console.log(`  ${i + 1}. "${query}"`);
        console.log(`     Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
        console.log(`     Is Yes/No: ${isMinimal ? 'Yes' : 'No'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Simple fact lookup detection
 */
function exampleSimpleFactLookup() {
    console.log('Example 3: Simple Fact Lookup Detection (Level 2)');
    console.log('-'.repeat(80));
    const queries = [
        'What medications is patient taking?',
        'When was the last visit?',
        'Who is the primary care physician?',
        'Where was patient treated?',
        'Which medications were prescribed?',
    ];
    console.log('  Detecting simple fact lookups:\n');
    queries.forEach((query, i) => {
        const intent = intent_classifier_service_1.default.classifyIntent(query).intent;
        const level = detail_level_analyzer_service_1.default.analyzeQuery(query, intent);
        const isBasic = level === detail_level_analyzer_service_1.DetailLevel.BASIC;
        console.log(`  ${i + 1}. "${query}"`);
        console.log(`     Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
        console.log(`     Is Simple Fact: ${isBasic ? 'Yes' : 'No'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Complex analysis detection
 */
function exampleComplexAnalysis() {
    console.log('Example 4: Complex Analysis Detection (Level 5)');
    console.log('-'.repeat(80));
    const queries = [
        'Analyze blood pressure trends over the past year',
        'Compare medication effectiveness between metformin and insulin',
        'Explain why patient was hospitalized',
        'How does diet affect blood sugar levels?',
        'Evaluate the impact of exercise on heart rate',
        'What patterns emerge from lab results?',
    ];
    console.log('  Detecting complex analysis queries:\n');
    queries.forEach((query, i) => {
        const intent = intent_classifier_service_1.default.classifyIntent(query).intent;
        const level = detail_level_analyzer_service_1.default.analyzeQuery(query, intent);
        const isComprehensive = level === detail_level_analyzer_service_1.DetailLevel.COMPREHENSIVE;
        console.log(`  ${i + 1}. "${query}"`);
        console.log(`     Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
        console.log(`     Is Complex Analysis: ${isComprehensive ? 'Yes' : 'No'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Detail level with reasoning
 */
function exampleDetailLevelWithReasoning() {
    console.log('Example 5: Detail Level with Reasoning');
    console.log('-'.repeat(80));
    const queries = [
        'Is patient diabetic?',
        'What is current blood pressure?',
        'Show recent medications',
        'Compare A1C levels from January and June',
    ];
    console.log('  Analyzing queries with detailed reasoning:\n');
    queries.forEach((query, i) => {
        const intent = intent_classifier_service_1.default.classifyIntent(query).intent;
        const entities = entity_extractor_service_1.default.extractEntities(query);
        const analysis = detail_level_analyzer_service_1.default.analyzeWithReasoning(query, intent, entities);
        console.log(`  Query ${i + 1}: "${query}"`);
        console.log(`    Level: ${analysis.level} (${detail_level_analyzer_service_1.default.getLevelName(analysis.level)})`);
        console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
        console.log('    Reasoning:');
        analysis.reasoning.forEach((reason) => {
            console.log(`      - ${reason}`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Response guidelines
 */
function exampleResponseGuidelines() {
    console.log('Example 6: Response Guidelines by Detail Level');
    console.log('-'.repeat(80));
    const levels = [
        detail_level_analyzer_service_1.DetailLevel.MINIMAL,
        detail_level_analyzer_service_1.DetailLevel.BASIC,
        detail_level_analyzer_service_1.DetailLevel.STANDARD,
        detail_level_analyzer_service_1.DetailLevel.DETAILED,
        detail_level_analyzer_service_1.DetailLevel.COMPREHENSIVE,
    ];
    console.log('  Response guidelines for each detail level:\n');
    levels.forEach((level) => {
        const guidelines = detail_level_analyzer_service_1.default.getResponseGuidelines(level);
        const description = detail_level_analyzer_service_1.default.getDescription(level);
        console.log(`  Level ${level}: ${description}`);
        console.log(`    Max words (short answer): ${guidelines.short_answer_max_words}`);
        console.log(`    Summary bullets: ${guidelines.detailed_summary_bullets}`);
        console.log(`    Min sources: ${guidelines.min_sources}`);
        console.log(`    Include reasoning: ${guidelines.include_reasoning ? 'Yes' : 'No'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Intent-based detail level
 */
function exampleIntentBasedDetailLevel() {
    console.log('Example 7: Intent-Based Detail Level');
    console.log('-'.repeat(80));
    const queries = [
        'List all medications',
        'Summarize patient history',
        'Compare this month to last month',
        'Show care plans',
    ];
    console.log('  Detail levels influenced by intent:\n');
    queries.forEach((query, i) => {
        const classification = intent_classifier_service_1.default.classifyIntent(query);
        const entities = entity_extractor_service_1.default.extractEntities(query);
        const level = detail_level_analyzer_service_1.default.analyzeQuery(query, classification.intent, entities);
        console.log(`  Query ${i + 1}: "${query}"`);
        console.log(`    Intent: ${classification.intent}`);
        console.log(`    Detail Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
        console.log(`    Reasoning: ${detail_level_analyzer_service_1.default.requiresReasoning(level) ? 'Required' : 'Optional'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Multi-element detection
 */
function exampleMultiElementDetection() {
    console.log('Example 8: Multi-Element Detection (Level 4)');
    console.log('-'.repeat(80));
    const queries = [
        'Show medications for diabetes, hypertension, and high cholesterol',
        'Compare blood pressure from January, March, and June',
        'Patient with diabetes on metformin and lisinopril',
    ];
    console.log('  Detecting queries with multiple complex elements:\n');
    queries.forEach((query, i) => {
        const intent = intent_classifier_service_1.default.classifyIntent(query).intent;
        const entities = entity_extractor_service_1.default.extractEntities(query);
        const analysis = detail_level_analyzer_service_1.default.analyzeWithReasoning(query, intent, entities);
        console.log(`  Query ${i + 1}: "${query}"`);
        console.log(`    Entities found: ${entities.length}`);
        console.log(`    Detail Level: ${analysis.level} (${detail_level_analyzer_service_1.default.getLevelName(analysis.level)})`);
        console.log('    Detection reasoning:');
        analysis.reasoning.forEach((reason) => {
            console.log(`      - ${reason}`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Batch processing
 */
function exampleBatchProcessing() {
    console.log('Example 9: Batch Processing');
    console.log('-'.repeat(80));
    const queries = [
        { query: 'Is patient on aspirin?', intent: intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS },
        { query: 'What is blood pressure?', intent: intent_classifier_service_1.QueryIntent.RETRIEVE_ALL },
        { query: 'Show recent visits', intent: intent_classifier_service_1.QueryIntent.RETRIEVE_NOTES },
        { query: 'Analyze medication adherence trends', intent: intent_classifier_service_1.QueryIntent.COMPARISON },
    ];
    console.log(`  Batch processing ${queries.length} queries:\n`);
    const levels = detail_level_analyzer_service_1.default.analyzeBatch(queries);
    levels.forEach((level, i) => {
        console.log(`  Query ${i + 1}: "${queries[i].query}"`);
        console.log(`    Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Batch with reasoning
 */
function exampleBatchWithReasoning() {
    console.log('Example 10: Batch Processing with Reasoning');
    console.log('-'.repeat(80));
    const queries = [
        { query: 'Has patient been hospitalized?', intent: intent_classifier_service_1.QueryIntent.RETRIEVE_ALL },
        { query: 'Compare A1C from last two visits', intent: intent_classifier_service_1.QueryIntent.COMPARISON },
    ];
    console.log(`  Batch analyzing ${queries.length} queries with reasoning:\n`);
    const analyses = detail_level_analyzer_service_1.default.analyzeBatchWithReasoning(queries);
    analyses.forEach((analysis, i) => {
        console.log(`  Query ${i + 1}: "${queries[i].query}"`);
        console.log(`    Level: ${analysis.level} (${detail_level_analyzer_service_1.default.getLevelName(analysis.level)})`);
        console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
        console.log('    Reasoning:');
        analysis.reasoning.forEach((reason) => {
            console.log(`      - ${reason}`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Helper methods
 */
function exampleHelperMethods() {
    console.log('Example 11: Helper Methods');
    console.log('-'.repeat(80));
    const level = detail_level_analyzer_service_1.DetailLevel.STANDARD;
    console.log(`  Helper methods for Level ${level} (STANDARD):\n`);
    console.log(`    Level name: ${detail_level_analyzer_service_1.default.getLevelName(level)}`);
    console.log(`    Description: ${detail_level_analyzer_service_1.default.getDescription(level)}`);
    console.log(`    Requires reasoning: ${detail_level_analyzer_service_1.default.requiresReasoning(level)}`);
    console.log(`    Min sources: ${detail_level_analyzer_service_1.default.getMinSources(level)}`);
    console.log(`    Max answer words: ${detail_level_analyzer_service_1.default.getMaxAnswerWords(level)}`);
    console.log(`    Summary bullets: ${detail_level_analyzer_service_1.default.getSummaryBullets(level)}`);
    console.log('');
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Integration with full pipeline
 */
function exampleFullPipeline() {
    console.log('Example 12: Integration with Full Query Pipeline');
    console.log('-'.repeat(80));
    const query = 'Compare blood pressure trends between January and March 2024';
    console.log(`  Query: "${query}"\n`);
    // Step 1: Classify intent
    const classification = intent_classifier_service_1.default.classifyIntent(query);
    console.log(`  Step 1 - Intent Classification:`);
    console.log(`    Intent: ${classification.intent}`);
    console.log(`    Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
    console.log('');
    // Step 2: Extract entities
    const entities = entity_extractor_service_1.default.extractEntities(query);
    console.log(`  Step 2 - Entity Extraction:`);
    console.log(`    Entities found: ${entities.length}`);
    entities.forEach((entity) => {
        console.log(`      - [${entity.type}] ${entity.text}`);
    });
    console.log('');
    // Step 3: Analyze detail level
    const analysis = detail_level_analyzer_service_1.default.analyzeWithReasoning(query, classification.intent, entities);
    console.log(`  Step 3 - Detail Level Analysis:`);
    console.log(`    Level: ${analysis.level} (${detail_level_analyzer_service_1.default.getLevelName(analysis.level)})`);
    console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log('    Reasoning:');
    analysis.reasoning.forEach((reason) => {
        console.log(`      - ${reason}`);
    });
    console.log('');
    // Step 4: Get response guidelines
    const guidelines = analysis.guidelines;
    console.log('  Step 4 - Response Guidelines:');
    console.log(`    Max words: ${guidelines.short_answer_max_words}`);
    console.log(`    Summary bullets: ${guidelines.detailed_summary_bullets}`);
    console.log(`    Min sources: ${guidelines.min_sources}`);
    console.log(`    Include reasoning: ${guidelines.include_reasoning}`);
    console.log('');
    console.log('  Pipeline integration successful!');
    console.log('  ✅ Success\n');
}
/**
 * Example 13: Edge cases
 */
function exampleEdgeCases() {
    console.log('Example 13: Edge Cases and Special Scenarios');
    console.log('-'.repeat(80));
    const queries = [
        { query: '', description: 'Empty query' },
        { query: 'Patient?', description: 'Very short query' },
        {
            query: 'What are all the medications, conditions, symptoms, and procedures for this patient with diabetes, hypertension, and high cholesterol over the past 5 years including hospitalizations and surgeries?',
            description: 'Very long complex query',
        },
        { query: 'Show me everything', description: 'Vague query' },
    ];
    console.log('  Testing edge cases:\n');
    queries.forEach(({ query, description }, i) => {
        try {
            const intent = intent_classifier_service_1.default.classifyIntent(query || 'unknown').intent;
            const entities = entity_extractor_service_1.default.extractEntities(query || '');
            const level = detail_level_analyzer_service_1.default.analyzeQuery(query || '', intent, entities);
            console.log(`  Case ${i + 1}: ${description}`);
            console.log(`    Query: "${query}"`);
            console.log(`    Level: ${level} (${detail_level_analyzer_service_1.default.getLevelName(level)})`);
            console.log('    Status: ✓ Handled');
        }
        catch (error) {
            console.log(`  Case ${i + 1}: ${description}`);
            console.log(`    Query: "${query}"`);
            console.log(`    Status: ✗ Error - ${error}`);
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 14: All guidelines overview
 */
function exampleAllGuidelines() {
    console.log('Example 14: Complete Guidelines Overview');
    console.log('-'.repeat(80));
    const allGuidelines = detail_level_analyzer_service_1.default.getAllGuidelines();
    console.log('  Complete response guidelines reference:\n');
    Object.entries(allGuidelines).forEach(([level, guidelines]) => {
        console.log(`  ┌─ Level ${level}: ${detail_level_analyzer_service_1.default.getLevelName(Number(level))}`);
        console.log(`  │  Description: ${detail_level_analyzer_service_1.default.getDescription(Number(level))}`);
        console.log(`  │  Max words: ${guidelines.short_answer_max_words}`);
        console.log(`  │  Bullets: ${guidelines.detailed_summary_bullets}`);
        console.log(`  │  Sources: ${guidelines.min_sources}`);
        console.log(`  │  Reasoning: ${guidelines.include_reasoning}`);
        console.log('  └─');
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('DETAIL LEVEL ANALYZER SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBasicDetailLevel();
        exampleYesNoQuestions();
        exampleSimpleFactLookup();
        exampleComplexAnalysis();
        exampleDetailLevelWithReasoning();
        exampleResponseGuidelines();
        exampleIntentBasedDetailLevel();
        exampleMultiElementDetection();
        exampleBatchProcessing();
        exampleBatchWithReasoning();
        exampleHelperMethods();
        exampleFullPipeline();
        exampleEdgeCases();
        exampleAllGuidelines();
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
//# sourceMappingURL=detail-level-analyzer.example.js.map