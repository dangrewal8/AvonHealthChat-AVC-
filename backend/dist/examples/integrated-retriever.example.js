"use strict";
/**
 * Integrated Retriever Service Usage Examples
 *
 * Demonstrates:
 * - Complete 7-stage retrieval pipeline
 * - Pipeline metrics and diagnostics
 * - Configuration options
 * - Error handling and fallbacks
 * - Cache behavior
 * - Batch processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleCompletePipeline = exampleCompletePipeline;
exports.exampleStageMetrics = exampleStageMetrics;
exports.examplePipelineSummary = examplePipelineSummary;
exports.exampleCustomConfiguration = exampleCustomConfiguration;
exports.exampleCacheBehavior = exampleCacheBehavior;
exports.exampleDiversification = exampleDiversification;
exports.exampleTimeDecay = exampleTimeDecay;
exports.exampleBatchRetrieval = exampleBatchRetrieval;
exports.exampleHighlights = exampleHighlights;
exports.examplePerformanceComparison = examplePerformanceComparison;
exports.exampleWithQueryUnderstanding = exampleWithQueryUnderstanding;
exports.runAllExamples = runAllExamples;
const integrated_retriever_service_1 = __importDefault(require("../services/integrated-retriever.service"));
const query_understanding_agent_service_1 = __importDefault(require("../services/query-understanding-agent.service"));
const intent_classifier_service_1 = require("../services/intent-classifier.service");
/**
 * Generate sample chunks for examples
 */
function generateSampleChunks() {
    return [
        {
            chunk_id: 'chunk_001',
            artifact_id: 'artifact_001',
            patient_id: 'patient_123',
            content: 'Patient prescribed metformin 500mg twice daily for type 2 diabetes management. ' +
                'Blood glucose monitoring recommended. Started 2024-10-20.',
            metadata: {
                artifact_type: 'medication_order',
                date: '2024-10-20T10:00:00Z',
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_002',
            artifact_id: 'artifact_002',
            patient_id: 'patient_123',
            content: 'Progress note: Patient continues metformin therapy for diabetes. Compliance good. ' +
                'A1C improved from 7.5% to 6.8%. No side effects reported.',
            metadata: {
                artifact_type: 'progress_note',
                date: '2024-09-15T14:00:00Z',
                author: 'Nurse Johnson',
            },
        },
        {
            chunk_id: 'chunk_003',
            artifact_id: 'artifact_003',
            patient_id: 'patient_123',
            content: 'Lab results: A1C 6.8%, fasting glucose 105 mg/dL. Diabetes well-controlled on current regimen. ' +
                'Continue metformin as prescribed.',
            metadata: {
                artifact_type: 'lab_result',
                date: '2024-08-01T09:00:00Z',
                author: 'Lab Tech',
            },
        },
        {
            chunk_id: 'chunk_004',
            artifact_id: 'artifact_004',
            patient_id: 'patient_123',
            content: 'Patient education: Discussed diabetes management, medication adherence, and lifestyle modifications. ' +
                'Patient verbalized understanding.',
            metadata: {
                artifact_type: 'progress_note',
                date: '2024-07-15T10:00:00Z',
                author: 'Nurse Williams',
            },
        },
        {
            chunk_id: 'chunk_005',
            artifact_id: 'artifact_005',
            patient_id: 'patient_123',
            content: 'Care plan update: Continue metformin 500mg BID for diabetes management. Schedule 3-month follow-up. ' +
                'Monitor blood glucose and A1C levels.',
            metadata: {
                artifact_type: 'care_plan',
                date: '2024-10-01T11:00:00Z',
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_006',
            artifact_id: 'artifact_006',
            patient_id: 'patient_123',
            content: 'Initial diabetes diagnosis: Type 2 diabetes mellitus. Started on metformin 500mg daily, ' +
                'titrated to 500mg BID. Patient counseled on diet and exercise.',
            metadata: {
                artifact_type: 'clinical_note',
                date: '2024-01-10T15:00:00Z',
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_007',
            artifact_id: 'artifact_007',
            patient_id: 'patient_123',
            content: 'Medication review: Current medications include metformin for diabetes, lisinopril for hypertension. ' +
                'No drug interactions noted. Patient tolerating well.',
            metadata: {
                artifact_type: 'medication_list',
                date: '2024-09-01T10:00:00Z',
                author: 'Pharmacist Brown',
            },
        },
        {
            chunk_id: 'chunk_008',
            artifact_id: 'artifact_008',
            patient_id: 'patient_456', // Different patient
            content: 'Patient on insulin therapy for type 1 diabetes. Blood glucose control challenging. ' +
                'Adjusting insulin doses.',
            metadata: {
                artifact_type: 'progress_note',
                date: '2024-10-15T09:00:00Z',
                author: 'Dr. Johnson',
            },
        },
    ];
}
/**
 * Generate sample structured query
 */
function generateSampleQuery() {
    return {
        original_query: 'metformin for diabetes',
        patient_id: 'patient_123',
        intent: intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [
            {
                text: 'metformin',
                type: 'medication',
                normalized: 'metformin',
                confidence: 0.95,
            },
            {
                text: 'diabetes',
                type: 'condition',
                normalized: 'diabetes',
                confidence: 0.90,
            },
        ],
        temporal_filter: null,
        filters: {
            artifact_types: ['medication_order', 'prescription', 'medication_list'],
        },
        detail_level: 3,
        query_id: 'query_001',
    };
}
/**
 * Example 1: Complete pipeline execution
 */
async function exampleCompletePipeline() {
    console.log('Example 1: Complete Pipeline Execution');
    console.log('-'.repeat(80));
    // Initialize with chunks
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    // Create query
    const query = generateSampleQuery();
    console.log(`  Query: "${query.original_query}"`);
    console.log(`  Patient: ${query.patient_id}`);
    console.log(`  Intent: ${query.intent}\n`);
    // Execute pipeline
    const result = await integrated_retriever_service_1.default.retrieve(query);
    console.log('  Pipeline Execution Complete!\n');
    console.log(`  Total Time: ${result.retrieval_time_ms}ms`);
    console.log(`  Candidates: ${result.candidates.length}`);
    console.log(`  Cache Hit: ${result.cache_hit}\n`);
    console.log('  Top 3 Results:\n');
    result.candidates.slice(0, 3).forEach((candidate) => {
        console.log(`    ${candidate.rank}. ${candidate.chunk.chunk_id}`);
        console.log(`       Score: ${candidate.score.toFixed(3)}`);
        console.log(`       Type: ${candidate.metadata.artifact_type}`);
        console.log(`       Snippet: ${candidate.snippet}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Pipeline stage metrics
 */
async function exampleStageMetrics() {
    console.log('Example 2: Pipeline Stage Metrics');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    const result = await integrated_retriever_service_1.default.retrieve(query);
    console.log('  Pipeline Stages Breakdown:\n');
    let totalTime = 0;
    result.stage_metrics.forEach((stage) => {
        totalTime += stage.duration_ms;
        const pct = ((stage.duration_ms / result.retrieval_time_ms) * 100).toFixed(1);
        console.log(`    ${stage.stage.padEnd(25)} ${String(stage.duration_ms).padStart(4)}ms (${pct.padStart(5)}%)`);
        console.log(`      Input: ${stage.input_count} → Output: ${stage.output_count}`);
        console.log('');
    });
    console.log(`  Total Pipeline Time: ${result.retrieval_time_ms}ms`);
    console.log(`  Sum of Stage Times: ${totalTime}ms\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Pipeline summary
 */
async function examplePipelineSummary() {
    console.log('Example 3: Pipeline Summary');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    const result = await integrated_retriever_service_1.default.retrieve(query);
    console.log('\n' + integrated_retriever_service_1.default.getPipelineSummary(result));
    console.log('\n  ✅ Success\n');
}
/**
 * Example 4: Custom pipeline configuration
 */
async function exampleCustomConfiguration() {
    console.log('Example 4: Custom Pipeline Configuration');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    // Default configuration
    console.log('  Configuration 1: Default (all stages enabled)\n');
    const result1 = await integrated_retriever_service_1.default.retrieve(query);
    console.log(`    Total Time: ${result1.retrieval_time_ms}ms`);
    console.log(`    Stages: ${result1.stage_metrics.length}`);
    console.log(`    Top Result: ${result1.candidates[0]?.chunk.chunk_id}\n`);
    // Minimal configuration (no reranking, diversification, time decay)
    console.log('  Configuration 2: Minimal (core stages only)\n');
    const result2 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_reranking: false,
        enable_diversification: false,
        enable_time_decay: false,
    });
    console.log(`    Total Time: ${result2.retrieval_time_ms}ms`);
    console.log(`    Stages: ${result2.stage_metrics.length}`);
    console.log(`    Top Result: ${result2.candidates[0]?.chunk.chunk_id}\n`);
    // Custom hybrid search weights
    console.log('  Configuration 3: Custom hybrid weights\n');
    const result3 = await integrated_retriever_service_1.default.retrieve(query, {
        hybrid_alpha: 0.5, // 50% semantic, 50% keyword
        k: 5, // Return only top 5
    });
    console.log(`    Total Time: ${result3.retrieval_time_ms}ms`);
    console.log(`    Candidates: ${result3.candidates.length}`);
    console.log(`    Top Result: ${result3.candidates[0]?.chunk.chunk_id}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Cache behavior
 */
async function exampleCacheBehavior() {
    console.log('Example 5: Cache Behavior');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    // Clear cache first
    integrated_retriever_service_1.default.clearCache();
    // First call - cache miss
    console.log('  First Call (cache miss):\n');
    const result1 = await integrated_retriever_service_1.default.retrieve(query);
    console.log(`    Time: ${result1.retrieval_time_ms}ms`);
    console.log(`    Cache Hit: ${result1.cache_hit}\n`);
    // Second call - cache hit
    console.log('  Second Call (cache hit):\n');
    const result2 = await integrated_retriever_service_1.default.retrieve(query);
    console.log(`    Time: ${result2.retrieval_time_ms}ms`);
    console.log(`    Cache Hit: ${result2.cache_hit}`);
    console.log(`    Speedup: ${(result1.retrieval_time_ms / Math.max(1, result2.retrieval_time_ms)).toFixed(0)}x\n`);
    // Cache stats
    const stats = integrated_retriever_service_1.default.getCacheStats();
    console.log('  Cache Statistics:\n');
    console.log(`    Size: ${stats.size} entries`);
    console.log(`    TTL: ${stats.ttl_ms}ms (${(stats.ttl_ms / 60000).toFixed(0)} minutes)\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Diversification impact
 */
async function exampleDiversification() {
    console.log('Example 6: Diversification Impact');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    // Without diversification
    console.log('  Without Diversification:\n');
    const result1 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_diversification: false,
    });
    result1.candidates.slice(0, 5).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} - ${c.score.toFixed(3)}`);
    });
    console.log('\n  With Diversification:\n');
    const result2 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_diversification: true,
        diversity_threshold: 0.85,
    });
    result2.candidates.slice(0, 5).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} - ${c.score.toFixed(3)}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 7: Time decay effect
 */
async function exampleTimeDecay() {
    console.log('Example 7: Time Decay Effect');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    // Without time decay
    console.log('  Without Time Decay:\n');
    const result1 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_time_decay: false,
    });
    result1.candidates.slice(0, 5).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
        console.log(`       Score: ${c.score.toFixed(3)}, Date: ${c.metadata.date.substring(0, 10)}`);
    });
    console.log('\n  With Time Decay (boosts recent):\n');
    const result2 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_time_decay: true,
    });
    result2.candidates.slice(0, 5).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
        console.log(`       Score: ${c.score.toFixed(3)}, Date: ${c.metadata.date.substring(0, 10)}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 8: Batch retrieval
 */
async function exampleBatchRetrieval() {
    console.log('Example 8: Batch Retrieval');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const queries = [
        {
            original_query: 'medications',
            patient_id: 'patient_123',
            intent: intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
            entities: [],
            temporal_filter: null,
            filters: {},
            detail_level: 3,
            query_id: 'batch_001',
        },
        {
            original_query: 'lab results',
            patient_id: 'patient_123',
            intent: intent_classifier_service_1.QueryIntent.RETRIEVE_ALL,
            entities: [],
            temporal_filter: null,
            filters: { artifact_types: ['lab_result'] },
            detail_level: 3,
            query_id: 'batch_002',
        },
        {
            original_query: 'care plan',
            patient_id: 'patient_123',
            intent: intent_classifier_service_1.QueryIntent.RETRIEVE_CARE_PLANS,
            entities: [],
            temporal_filter: null,
            filters: {},
            detail_level: 3,
            query_id: 'batch_003',
        },
    ];
    console.log(`  Processing ${queries.length} queries in batch...\n`);
    const results = await integrated_retriever_service_1.default.batchRetrieve(queries);
    results.forEach((result, i) => {
        console.log(`  Query ${i + 1}: "${queries[i].original_query}"`);
        console.log(`    Time: ${result.retrieval_time_ms}ms`);
        console.log(`    Candidates: ${result.candidates.length}`);
        console.log(`    Top: ${result.candidates[0]?.chunk.chunk_id || 'None'}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Highlight generation
 */
async function exampleHighlights() {
    console.log('Example 9: Highlight Generation');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    const result = await integrated_retriever_service_1.default.retrieve(query);
    console.log(`  Query: "${query.original_query}"\n`);
    result.candidates.slice(0, 3).forEach((candidate) => {
        console.log(`  ${candidate.rank}. ${candidate.chunk.chunk_id}`);
        console.log(`     Snippet: ${candidate.snippet}`);
        console.log(`     Highlights: ${candidate.highlights.length} query terms found`);
        if (candidate.highlights.length > 0) {
            console.log(`     Terms:`);
            candidate.highlights.slice(0, 3).forEach((h) => {
                console.log(`       - "${h.text}" at position ${h.start}`);
            });
        }
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Performance comparison
 */
async function examplePerformanceComparison() {
    console.log('Example 10: Performance Comparison');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    const query = generateSampleQuery();
    console.log('  Comparing different pipeline configurations:\n');
    // Full pipeline
    const start1 = Date.now();
    const result1 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_reranking: true,
        enable_diversification: true,
        enable_time_decay: true,
    });
    const time1 = Date.now() - start1;
    console.log('  Full Pipeline (all stages):');
    console.log(`    Time: ${time1}ms`);
    console.log(`    Stages: ${result1.stage_metrics.length}`);
    console.log(`    Top: ${result1.candidates[0]?.chunk.chunk_id}\n`);
    // Minimal pipeline
    const start2 = Date.now();
    const result2 = await integrated_retriever_service_1.default.retrieve(query, {
        enable_reranking: false,
        enable_diversification: false,
        enable_time_decay: false,
    });
    const time2 = Date.now() - start2;
    console.log('  Minimal Pipeline (core only):');
    console.log(`    Time: ${time2}ms`);
    console.log(`    Stages: ${result2.stage_metrics.length}`);
    console.log(`    Top: ${result2.candidates[0]?.chunk.chunk_id}\n`);
    console.log(`  Speedup: ${((time1 / time2) * 100 - 100).toFixed(0)}% slower for full pipeline`);
    console.log(`  (but potentially better quality)\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Using with Query Understanding Agent
 */
async function exampleWithQueryUnderstanding() {
    console.log('Example 11: Integration with Query Understanding');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    integrated_retriever_service_1.default.initialize(chunks);
    // Parse natural language query
    const userQuery = 'What medications is the patient taking for diabetes?';
    const patientId = 'patient_123';
    console.log(`  User Query: "${userQuery}"`);
    console.log(`  Patient: ${patientId}\n`);
    // Parse query
    console.log('  Step 1: Parse query with Query Understanding Agent...\n');
    const structuredQuery = query_understanding_agent_service_1.default.parse(userQuery, patientId);
    console.log('  Parsed Query:');
    console.log(`    Intent: ${structuredQuery.intent}`);
    console.log(`    Entities: ${structuredQuery.entities.map((e) => e.text).join(', ')}`);
    console.log(`    Detail Level: ${structuredQuery.detail_level}\n`);
    // Retrieve
    console.log('  Step 2: Execute integrated retrieval pipeline...\n');
    const result = await integrated_retriever_service_1.default.retrieve(structuredQuery);
    console.log('  Results:');
    console.log(`    Time: ${result.retrieval_time_ms}ms`);
    console.log(`    Candidates: ${result.candidates.length}\n`);
    console.log('  Top 3 Results:\n');
    result.candidates.slice(0, 3).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
        console.log(`       Type: ${c.metadata.artifact_type}`);
        console.log(`       Score: ${c.score.toFixed(3)}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('INTEGRATED RETRIEVER SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await exampleCompletePipeline();
        await exampleStageMetrics();
        await examplePipelineSummary();
        await exampleCustomConfiguration();
        await exampleCacheBehavior();
        await exampleDiversification();
        await exampleTimeDecay();
        await exampleBatchRetrieval();
        await exampleHighlights();
        await examplePerformanceComparison();
        await exampleWithQueryUnderstanding();
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
//# sourceMappingURL=integrated-retriever.example.js.map