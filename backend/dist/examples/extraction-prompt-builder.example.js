"use strict";
/**
 * Extraction Prompt Builder Usage Examples
 *
 * Demonstrates:
 * - Building extraction prompts
 * - Formatting candidates
 * - System prompt generation
 * - Temperature configuration
 * - Full prompt building
 * - Validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleSystemPrompt = exampleSystemPrompt;
exports.exampleFormatCandidates = exampleFormatCandidates;
exports.exampleBuildExtractionPrompt = exampleBuildExtractionPrompt;
exports.exampleBuildFullPrompt = exampleBuildFullPrompt;
exports.exampleConfigComparison = exampleConfigComparison;
exports.exampleSummarizationPrompt = exampleSummarizationPrompt;
exports.exampleFormatSingleCandidate = exampleFormatSingleCandidate;
exports.exampleEnhancedPrompt = exampleEnhancedPrompt;
exports.exampleValidateExtraction = exampleValidateExtraction;
exports.exampleFewShotExamples = exampleFewShotExamples;
exports.examplePromptWithExamples = examplePromptWithExamples;
exports.exampleTruncateCandidates = exampleTruncateCandidates;
exports.exampleCompleteWorkflow = exampleCompleteWorkflow;
exports.exampleExtractionTypes = exampleExtractionTypes;
exports.exampleTokenEstimation = exampleTokenEstimation;
exports.runAllExamples = runAllExamples;
const extraction_prompt_builder_service_1 = __importDefault(require("../services/extraction-prompt-builder.service"));
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
            content: 'Patient prescribed Metformin 500mg twice daily for diabetes management. Blood glucose levels improving.',
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
            content: 'Follow up in 2 weeks for blood pressure check. Continue current medications. Monitor for side effects.',
            metadata: {
                artifact_type: 'care_plan',
                date: '2024-01-16T14:00:00Z',
                author: 'Dr. Johnson',
            },
        },
        {
            chunk_id: 'chunk_003',
            artifact_id: 'note_125',
            patient_id: 'patient_456',
            content: 'Patient reports no adverse reactions to Metformin. Tolerating medication well.',
            metadata: {
                artifact_type: 'clinical_note',
                date: '2024-01-20T09:00:00Z',
                author: 'Dr. Smith',
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
 * Example 1: Basic system prompt
 */
function exampleSystemPrompt() {
    console.log('Example 1: System Prompt');
    console.log('-'.repeat(80));
    const systemPrompt = extraction_prompt_builder_service_1.default.buildSystemPrompt();
    console.log('  System Prompt:\n');
    console.log(systemPrompt.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 2: Format candidates
 */
function exampleFormatCandidates() {
    console.log('Example 2: Format Candidates');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    console.log(`  Formatting ${candidates.length} candidates...\n`);
    const formatted = extraction_prompt_builder_service_1.default.formatCandidates(candidates);
    console.log('  Formatted Output:\n');
    console.log(formatted.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Build extraction prompt
 */
function exampleBuildExtractionPrompt() {
    console.log('Example 3: Build Extraction Prompt');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What medications is the patient taking?');
    console.log(`  Query: "${query.original_query}"\n`);
    const prompt = extraction_prompt_builder_service_1.default.buildExtractionPrompt(candidates, query);
    console.log('  Extraction Prompt:\n');
    console.log(prompt.split('\n').slice(0, 20).map(line => `    ${line}`).join('\n'));
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Build full prompt
 */
function exampleBuildFullPrompt() {
    console.log('Example 4: Build Full Prompt');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What is the care plan for this patient?');
    const fullPrompt = extraction_prompt_builder_service_1.default.buildFullPrompt(candidates, query, 'extraction');
    console.log(`  Query: "${query.original_query}"\n`);
    console.log('  Full Prompt Result:\n');
    console.log(`    Total Chunks: ${fullPrompt.total_chunks}`);
    console.log(`    Estimated Tokens: ${fullPrompt.estimated_tokens}`);
    console.log(`    Temperature: ${fullPrompt.config.temperature}`);
    console.log(`    Max Tokens: ${fullPrompt.config.max_tokens}`);
    console.log(`    Mode: ${fullPrompt.config.mode}`);
    console.log('');
    console.log('    System Prompt Length:', fullPrompt.system_prompt.length, 'chars');
    console.log('    User Prompt Length:', fullPrompt.user_prompt.length, 'chars');
    console.log('\n  ✅ Success\n');
}
/**
 * Example 5: Extraction vs Summarization config
 */
function exampleConfigComparison() {
    console.log('Example 5: Extraction vs Summarization Config');
    console.log('-'.repeat(80));
    const extractionConfig = extraction_prompt_builder_service_1.default.getExtractionConfig();
    const summarizationConfig = extraction_prompt_builder_service_1.default.getSummarizationConfig();
    console.log('  Extraction Config:\n');
    console.log(`    Temperature: ${extractionConfig.temperature} (deterministic)`);
    console.log(`    Max Tokens: ${extractionConfig.max_tokens}`);
    console.log(`    Mode: ${extractionConfig.mode}`);
    console.log('\n  Summarization Config:\n');
    console.log(`    Temperature: ${summarizationConfig.temperature} (slightly creative)`);
    console.log(`    Max Tokens: ${summarizationConfig.max_tokens}`);
    console.log(`    Mode: ${summarizationConfig.mode}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 6: Build summarization prompt
 */
function exampleSummarizationPrompt() {
    console.log('Example 6: Summarization Prompt');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('Summarize the patient\'s medication history');
    const prompt = extraction_prompt_builder_service_1.default.buildSummarizationPrompt(candidates, query);
    console.log(`  Query: "${query.original_query}"\n`);
    console.log('  Summarization Prompt:\n');
    console.log(prompt.split('\n').slice(0, 15).map(line => `    ${line}`).join('\n'));
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Format single candidate
 */
function exampleFormatSingleCandidate() {
    console.log('Example 7: Format Single Candidate');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const candidate = candidates[0];
    console.log('  Without highlighting:\n');
    const formatted1 = extraction_prompt_builder_service_1.default.formatSingleCandidate(candidate, 0);
    console.log(formatted1.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  With highlighting:\n');
    const formatted2 = extraction_prompt_builder_service_1.default.formatSingleCandidate(candidate, 0, ['Metformin', 'diabetes']);
    console.log(formatted2.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Enhanced prompt with scores
 */
function exampleEnhancedPrompt() {
    console.log('Example 8: Enhanced Prompt with Scores');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What medications is the patient on?');
    const enhancedPrompt = extraction_prompt_builder_service_1.default.buildEnhancedPrompt(candidates, query, true);
    console.log(`  Query: "${query.original_query}"\n`);
    console.log('  Enhanced Prompt (with scores):\n');
    console.log(enhancedPrompt.split('\n').slice(0, 20).map(line => `    ${line}`).join('\n'));
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Validate extraction result
 */
function exampleValidateExtraction() {
    console.log('Example 9: Validate Extraction Result');
    console.log('-'.repeat(80));
    const validResult = {
        extractions: [
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
                    supporting_text: 'prescribed Metformin 500mg twice daily for diabetes management',
                },
            },
        ],
    };
    const invalidResult = {
        extractions: [
            {
                type: 'medication_recommendation',
                content: {},
                // Missing provenance!
            },
        ],
    };
    console.log('  Validating valid result:\n');
    const isValid1 = extraction_prompt_builder_service_1.default.validateExtractionResult(validResult);
    console.log(`    Result: ${isValid1 ? '✅ Valid' : '❌ Invalid'}`);
    console.log('\n  Validating invalid result:\n');
    const isValid2 = extraction_prompt_builder_service_1.default.validateExtractionResult(invalidResult);
    console.log(`    Result: ${isValid2 ? '✅ Valid' : '❌ Invalid'}`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 10: Few-shot examples
 */
function exampleFewShotExamples() {
    console.log('Example 10: Few-Shot Examples');
    console.log('-'.repeat(80));
    const examples = extraction_prompt_builder_service_1.default.buildFewShotExamples();
    console.log('  Few-Shot Examples:\n');
    console.log(examples.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 11: Prompt with few-shot examples
 */
function examplePromptWithExamples() {
    console.log('Example 11: Prompt with Few-Shot Examples');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What medications is the patient taking?');
    const prompt = extraction_prompt_builder_service_1.default.buildPromptWithExamples(candidates, query);
    console.log(`  Query: "${query.original_query}"\n`);
    console.log('  Prompt with Examples (first 25 lines):\n');
    console.log(prompt.split('\n').slice(0, 25).map(line => `    ${line}`).join('\n'));
    console.log('    ...\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Truncate candidates to fit token limit
 */
function exampleTruncateCandidates() {
    console.log('Example 12: Truncate Candidates');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    console.log(`  Original candidates: ${candidates.length}\n`);
    const truncated = extraction_prompt_builder_service_1.default.truncateCandidates(candidates, 2000);
    console.log(`  Truncated candidates: ${truncated.length}`);
    console.log(`  Removed: ${candidates.length - truncated.length}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 13: Complete workflow
 */
function exampleCompleteWorkflow() {
    console.log('Example 13: Complete Extraction Workflow');
    console.log('-'.repeat(80));
    // Step 1: Generate candidates
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What medications is the patient currently taking?');
    console.log('  Step 1: Generate candidates ✓\n');
    console.log(`    Candidates: ${candidates.length}`);
    console.log(`    Query: "${query.original_query}"\n`);
    // Step 2: Truncate if needed
    const truncated = extraction_prompt_builder_service_1.default.truncateCandidates(candidates, 4000);
    console.log('  Step 2: Truncate candidates ✓\n');
    console.log(`    Truncated: ${truncated.length} candidates\n`);
    // Step 3: Build full prompt
    const fullPrompt = extraction_prompt_builder_service_1.default.buildFullPrompt(truncated, query, 'extraction');
    console.log('  Step 3: Build full prompt ✓\n');
    console.log(`    System prompt: ${fullPrompt.system_prompt.length} chars`);
    console.log(`    User prompt: ${fullPrompt.user_prompt.length} chars`);
    console.log(`    Estimated tokens: ${fullPrompt.estimated_tokens}\n`);
    // Step 4: Get config
    const config = fullPrompt.config;
    console.log('  Step 4: Get configuration ✓\n');
    console.log(`    Temperature: ${config.temperature}`);
    console.log(`    Max tokens: ${config.max_tokens}`);
    console.log(`    Mode: ${config.mode}\n`);
    console.log('  Step 5: Ready for LLM call ✓\n');
    console.log('    Prompt ready to send to LLM API\n');
    console.log('  ✅ Complete Workflow Success\n');
}
/**
 * Example 14: Different extraction types
 */
function exampleExtractionTypes() {
    console.log('Example 14: Extraction Types');
    console.log('-'.repeat(80));
    const types = ['medication_recommendation', 'care_plan_note', 'general_note'];
    console.log('  Supported Extraction Types:\n');
    types.forEach((type, i) => {
        console.log(`    ${i + 1}. ${type}`);
        switch (type) {
            case 'medication_recommendation':
                console.log('       Use for: Medications, dosages, prescriptions');
                break;
            case 'care_plan_note':
                console.log('       Use for: Treatment plans, care instructions, follow-ups');
                break;
            case 'general_note':
                console.log('       Use for: Other clinical information, observations');
                break;
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 15: Token estimation
 */
function exampleTokenEstimation() {
    console.log('Example 15: Token Estimation');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const query = generateSampleQuery('What is the patient\'s medication history?');
    const fullPrompt1 = extraction_prompt_builder_service_1.default.buildFullPrompt(candidates.slice(0, 1), query);
    const fullPrompt2 = extraction_prompt_builder_service_1.default.buildFullPrompt(candidates.slice(0, 2), query);
    const fullPrompt3 = extraction_prompt_builder_service_1.default.buildFullPrompt(candidates, query);
    console.log('  Token Estimation for Different Chunk Counts:\n');
    console.log(`    1 chunk:  ~${fullPrompt1.estimated_tokens} tokens`);
    console.log(`    2 chunks: ~${fullPrompt2.estimated_tokens} tokens`);
    console.log(`    3 chunks: ~${fullPrompt3.estimated_tokens} tokens\n`);
    console.log('  Note: Estimation uses ~4 chars/token approximation\n');
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('EXTRACTION PROMPT BUILDER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleSystemPrompt();
        exampleFormatCandidates();
        exampleBuildExtractionPrompt();
        exampleBuildFullPrompt();
        exampleConfigComparison();
        exampleSummarizationPrompt();
        exampleFormatSingleCandidate();
        exampleEnhancedPrompt();
        exampleValidateExtraction();
        exampleFewShotExamples();
        examplePromptWithExamples();
        exampleTruncateCandidates();
        exampleCompleteWorkflow();
        exampleExtractionTypes();
        exampleTokenEstimation();
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
//# sourceMappingURL=extraction-prompt-builder.example.js.map