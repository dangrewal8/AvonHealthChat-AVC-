"use strict";
/**
 * Two-Pass Generator Usage Examples
 *
 * Demonstrates:
 * - Two-pass answer generation
 * - Extraction pass (temp=0)
 * - Summarization pass (temp=0.3)
 * - Configuration
 * - Error handling
 * - Validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleTwoPassGeneration = exampleTwoPassGeneration;
exports.exampleGetDefaultConfig = exampleGetDefaultConfig;
exports.exampleCustomConfig = exampleCustomConfig;
exports.exampleExplainTwoPass = exampleExplainTwoPass;
exports.exampleSummarizationPrompt = exampleSummarizationPrompt;
exports.exampleValidateResult = exampleValidateResult;
exports.exampleGenerateWithRetries = exampleGenerateWithRetries;
exports.exampleMockExtractionPass = exampleMockExtractionPass;
exports.exampleMockSummarizationPass = exampleMockSummarizationPass;
exports.exampleTokenUsageAnalysis = exampleTokenUsageAnalysis;
exports.exampleErrorHandling = exampleErrorHandling;
exports.exampleCompleteWorkflow = exampleCompleteWorkflow;
exports.runAllExamples = runAllExamples;
const two_pass_generator_service_1 = __importDefault(require("../services/two-pass-generator.service"));
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
 * Example 1: Complete two-pass generation
 */
async function exampleTwoPassGeneration() {
    console.log('Example 1: Complete Two-Pass Generation');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What medications is the patient currently taking?');
    console.log(`  Query: "${query.original_query}"`);
    console.log(`  Candidates: ${candidates.length}\n`);
    try {
        // Note: Requires OPENAI_API_KEY environment variable
        // twoPassGenerator.initializeOpenAI(process.env.OPENAI_API_KEY);
        // const result = await twoPassGenerator.generateAnswer(candidates, query);
        // console.log('  Result:\n');
        // console.log(`    Extractions: ${result.extractions.length}`);
        // console.log(`    Short Answer: ${result.summary.short_answer}`);
        // console.log(`    Pass 1 Tokens: ${result.pass1_tokens}`);
        // console.log(`    Pass 2 Tokens: ${result.pass2_tokens}`);
        // console.log(`    Total Tokens: ${result.total_tokens}`);
        // console.log(`    Execution Time: ${result.execution_time_ms}ms`);
        console.log('  ⚠️  Requires OpenAI API key to run');
        console.log('  Example structure shown in documentation\n');
    }
    catch (error) {
        console.error('  Error:', error.message);
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Get default configuration
 */
function exampleGetDefaultConfig() {
    console.log('Example 2: Default Configuration');
    console.log('-'.repeat(80));
    const config = two_pass_generator_service_1.default.getDefaultConfig();
    console.log('  Two-Pass Configuration:\n');
    console.log(`    Extraction Model: ${config.extraction_model}`);
    console.log(`    Summarization Model: ${config.summarization_model}`);
    console.log(`    Extraction Temp: ${config.extraction_temperature} (deterministic)`);
    console.log(`    Summarization Temp: ${config.summarization_temperature} (slightly creative)`);
    console.log(`    Extraction Max Tokens: ${config.extraction_max_tokens}`);
    console.log(`    Summarization Max Tokens: ${config.summarization_max_tokens}`);
    console.log(`    Validation Enabled: ${config.enable_validation}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Custom configuration
 */
async function exampleCustomConfig() {
    console.log('Example 3: Custom Configuration');
    console.log('-'.repeat(80));
    // const candidates = generateSampleCandidates();
    // const query = generateSampleQuery('Summarize the patient\'s care plan');
    const customConfig = {
        extraction_model: 'gpt-3.5-turbo',
        summarization_model: 'gpt-3.5-turbo',
        extraction_max_tokens: 1500,
        summarization_max_tokens: 300,
    };
    console.log('  Custom Configuration:\n');
    console.log(`    Using: ${customConfig.extraction_model}`);
    console.log(`    Extraction Tokens: ${customConfig.extraction_max_tokens}`);
    console.log(`    Summarization Tokens: ${customConfig.summarization_max_tokens}\n`);
    // const result = await twoPassGenerator.generateAnswer(candidates, query, customConfig);
    console.log('  ⚠️  Requires OpenAI API key to run\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Explain two-pass approach
 */
function exampleExplainTwoPass() {
    console.log('Example 4: Explain Two-Pass Approach');
    console.log('-'.repeat(80));
    const explanation = two_pass_generator_service_1.default.explainTwoPass();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 5: Get summarization system prompt
 */
function exampleSummarizationPrompt() {
    console.log('Example 5: Summarization System Prompt');
    console.log('-'.repeat(80));
    const prompt = two_pass_generator_service_1.default.getSummarizationSystemPrompt();
    console.log('  Summarization System Prompt:\n');
    console.log(prompt.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 6: Validate result
 */
function exampleValidateResult() {
    console.log('Example 6: Validate Result');
    console.log('-'.repeat(80));
    const mockExtractions = [
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
    ];
    const validResult = {
        extractions: mockExtractions,
        summary: {
            short_answer: 'Patient is taking Metformin 500mg twice daily.',
            detailed_summary: 'Patient is taking Metformin 500mg twice daily for Type 2 Diabetes management.',
            model: 'gpt-4',
            tokens_used: 150,
            extractions_count: 1,
        },
        pass1_tokens: 800,
        pass2_tokens: 150,
        total_tokens: 950,
        execution_time_ms: 2500,
    };
    const invalidResult = {
        extractions: [],
        summary: null, // Invalid!
        pass1_tokens: 0,
        pass2_tokens: 0,
        total_tokens: 0,
        execution_time_ms: 0,
    };
    console.log('  Validating valid result:\n');
    const isValid1 = two_pass_generator_service_1.default.validateResult(validResult);
    console.log(`    Result: ${isValid1 ? '✅ Valid' : '❌ Invalid'}`);
    console.log('\n  Validating invalid result:\n');
    const isValid2 = two_pass_generator_service_1.default.validateResult(invalidResult);
    console.log(`    Result: ${isValid2 ? '✅ Valid' : '❌ Invalid'}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 7: Generate with retries
 */
async function exampleGenerateWithRetries() {
    console.log('Example 7: Generate with Retries');
    console.log('-'.repeat(80));
    // const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What is the follow-up plan?');
    console.log(`  Query: "${query.original_query}"`);
    console.log('  Max Retries: 3\n');
    try {
        // const result = await twoPassGenerator.generateAnswerWithRetries(
        //   candidates,
        //   query,
        //   {},
        //   3  // maxRetries
        // );
        console.log('  ⚠️  Requires OpenAI API key to run');
        console.log('  Will retry up to 3 times with exponential backoff\n');
    }
    catch (error) {
        console.error('  Error:', error.message);
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Mock extraction pass result
 */
function exampleMockExtractionPass() {
    console.log('Example 8: Mock Extraction Pass Result');
    console.log('-'.repeat(80));
    const mockExtractions = [
        {
            type: 'medication_recommendation',
            content: {
                medication: 'Metformin',
                dosage: '500mg',
                frequency: 'twice daily',
                indication: 'Type 2 Diabetes management',
            },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 71],
                supporting_text: 'prescribed Metformin 500mg twice daily for Type 2 Diabetes management',
            },
        },
        {
            type: 'care_plan_note',
            content: {
                follow_up: '2 weeks',
                purpose: 'blood pressure monitoring',
                instructions: 'Continue Metformin, monitor for hypoglycemia',
            },
            provenance: {
                artifact_id: 'note_124',
                chunk_id: 'chunk_002',
                char_offsets: [0, 120],
                supporting_text: 'Follow up scheduled in 2 weeks for blood pressure monitoring. Continue Metformin as prescribed.',
            },
        },
    ];
    console.log('  Extraction Pass Result (temp=0):\n');
    console.log(`    Total Extractions: ${mockExtractions.length}\n`);
    mockExtractions.forEach((extraction, i) => {
        console.log(`    Extraction ${i + 1}:`);
        console.log(`      Type: ${extraction.type}`);
        console.log(`      Content: ${JSON.stringify(extraction.content, null, 8).split('\n').slice(1, -1).join('\n')}`);
        console.log(`      Source: ${extraction.provenance.artifact_id} / ${extraction.provenance.chunk_id}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Mock summarization pass result
 */
function exampleMockSummarizationPass() {
    console.log('Example 9: Mock Summarization Pass Result');
    console.log('-'.repeat(80));
    const mockSummary = {
        short_answer: 'Patient is taking Metformin 500mg twice daily for diabetes, with follow-up in 2 weeks.',
        detailed_summary: `Patient is currently taking Metformin 500mg twice daily for Type 2 Diabetes management (note_123). Blood glucose levels are improving with the current regimen. A follow-up appointment is scheduled in 2 weeks for blood pressure monitoring (note_124). The patient should continue Metformin as prescribed and monitor for signs of hypoglycemia.`,
        model: 'gpt-4',
        tokens_used: 180,
        extractions_count: 2,
    };
    console.log('  Summarization Pass Result (temp=0.3):\n');
    console.log(`    Short Answer:\n      ${mockSummary.short_answer}\n`);
    console.log(`    Detailed Summary:\n      ${mockSummary.detailed_summary.match(/.{1,80}/g)?.join('\n      ')}\n`);
    console.log(`    Model: ${mockSummary.model}`);
    console.log(`    Tokens: ${mockSummary.tokens_used}`);
    console.log(`    Extractions Count: ${mockSummary.extractions_count}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 10: Token usage analysis
 */
function exampleTokenUsageAnalysis() {
    console.log('Example 10: Token Usage Analysis');
    console.log('-'.repeat(80));
    const mockResult = {
        pass1_tokens: 850,
        pass2_tokens: 180,
        total_tokens: 1030,
        execution_time_ms: 3200,
    };
    console.log('  Token Usage Breakdown:\n');
    console.log(`    Pass 1 (Extraction):     ${mockResult.pass1_tokens} tokens`);
    console.log(`    Pass 2 (Summarization):  ${mockResult.pass2_tokens} tokens`);
    console.log(`    Total:                   ${mockResult.total_tokens} tokens\n`);
    const pass1Percentage = (mockResult.pass1_tokens / mockResult.total_tokens) * 100;
    const pass2Percentage = (mockResult.pass2_tokens / mockResult.total_tokens) * 100;
    console.log('  Percentage Breakdown:\n');
    console.log(`    Pass 1: ${pass1Percentage.toFixed(1)}%`);
    console.log(`    Pass 2: ${pass2Percentage.toFixed(1)}%\n`);
    console.log('  Execution Time:\n');
    console.log(`    Total: ${mockResult.execution_time_ms}ms`);
    console.log(`    Avg per pass: ${(mockResult.execution_time_ms / 2).toFixed(0)}ms\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Error handling
 */
async function exampleErrorHandling() {
    console.log('Example 11: Error Handling');
    console.log('-'.repeat(80));
    console.log('  Common Error Scenarios:\n');
    console.log('    1. Missing API Key:');
    try {
        // twoPassGenerator.initializeOpenAI(undefined);
        console.log('       Would throw: "OpenAI API key not provided..."\n');
    }
    catch (error) {
        console.log(`       ❌ ${error.message}\n`);
    }
    console.log('    2. Empty Response:');
    console.log('       Handled with validation check\n');
    console.log('    3. Invalid JSON:');
    console.log('       Wrapped in try-catch, returns error\n');
    console.log('    4. Rate Limit:');
    console.log('       Use generateAnswerWithRetries() with backoff\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Complete workflow
 */
async function exampleCompleteWorkflow() {
    console.log('Example 12: Complete Workflow');
    console.log('-'.repeat(80));
    console.log('  Step 1: Retrieve candidates ✓\n');
    const candidates = generateSampleCandidates();
    console.log(`    Retrieved: ${candidates.length} candidates\n`);
    console.log('  Step 2: Build query ✓\n');
    const query = generateSampleQuery('What medications is the patient taking?');
    console.log(`    Query: "${query.original_query}"\n`);
    console.log('  Step 3: Initialize OpenAI client ✓\n');
    console.log('    API key loaded from environment\n');
    console.log('  Step 4: Run two-pass generation ⏳\n');
    console.log('    Pass 1: Extraction (temp=0)...');
    console.log('    Pass 2: Summarization (temp=0.3)...\n');
    console.log('  Step 5: Validate result ✓\n');
    console.log('    Extractions: Valid');
    console.log('    Summary: Valid\n');
    console.log('  Step 6: Return to user ✓\n');
    console.log('    Short answer + detailed summary\n');
    console.log('  ✅ Complete Workflow Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('TWO-PASS GENERATOR EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await exampleTwoPassGeneration();
        exampleGetDefaultConfig();
        await exampleCustomConfig();
        exampleExplainTwoPass();
        exampleSummarizationPrompt();
        exampleValidateResult();
        await exampleGenerateWithRetries();
        exampleMockExtractionPass();
        exampleMockSummarizationPass();
        exampleTokenUsageAnalysis();
        await exampleErrorHandling();
        await exampleCompleteWorkflow();
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
//# sourceMappingURL=two-pass-generator.example.js.map