"use strict";
/**
 * Retrieval Scorer Service Usage Examples
 *
 * Demonstrates:
 * - Basic candidate scoring
 * - Keyword matching (BM25)
 * - Recency boost (time decay)
 * - Type preference
 * - Score combination
 * - Ranking and normalization
 * - Custom weights
 * - Score explanations
 * - Diversity ranking
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicScoring = exampleBasicScoring;
exports.exampleKeywordMatching = exampleKeywordMatching;
exports.exampleRecencyBoost = exampleRecencyBoost;
exports.exampleTypePreference = exampleTypePreference;
exports.exampleScoreCombination = exampleScoreCombination;
exports.exampleRanking = exampleRanking;
exports.exampleNormalization = exampleNormalization;
exports.exampleCustomWeights = exampleCustomWeights;
exports.exampleScoreExplanation = exampleScoreExplanation;
exports.exampleScoreBreakdown = exampleScoreBreakdown;
exports.exampleDiversityRanking = exampleDiversityRanking;
exports.exampleTopK = exampleTopK;
exports.exampleBatchScoring = exampleBatchScoring;
exports.exampleFullPipeline = exampleFullPipeline;
exports.runAllExamples = runAllExamples;
const retrieval_scorer_service_1 = __importDefault(require("../services/retrieval-scorer.service"));
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
            content: 'Patient prescribed metformin 500mg twice daily for type 2 diabetes management. Good glycemic control.',
            metadata: {
                artifact_type: 'medication_order',
                date: '2024-10-20T10:00:00Z', // Very recent (3 days ago)
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_002',
            artifact_id: 'artifact_002',
            patient_id: 'patient_123',
            content: 'Blood pressure measured at 120/80 mmHg. Patient continues on metformin. No side effects reported.',
            metadata: {
                artifact_type: 'progress_note',
                date: '2024-09-15T14:00:00Z', // 38 days ago
                author: 'Nurse Johnson',
            },
        },
        {
            chunk_id: 'chunk_003',
            artifact_id: 'artifact_003',
            patient_id: 'patient_123',
            content: 'A1C level: 6.8%. Improved from previous reading of 7.2%. Metformin therapy effective.',
            metadata: {
                artifact_type: 'lab_result',
                date: '2024-08-01T09:00:00Z', // 83 days ago
                author: 'Lab Tech',
            },
        },
        {
            chunk_id: 'chunk_004',
            artifact_id: 'artifact_004',
            patient_id: 'patient_123',
            content: 'Care plan: Continue metformin 500mg BID. Monitor blood glucose levels weekly.',
            metadata: {
                artifact_type: 'care_plan',
                date: '2024-10-01T11:00:00Z', // 22 days ago
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_005',
            artifact_id: 'artifact_005',
            patient_id: 'patient_123',
            content: 'Patient education provided on diabetes management and medication adherence.',
            metadata: {
                artifact_type: 'progress_note',
                date: '2024-07-15T10:00:00Z', // 100 days ago
                author: 'Nurse Williams',
            },
        },
    ];
}
/**
 * Generate sample structured query
 */
function generateSampleQuery() {
    return {
        original_query: 'What medications for diabetes?',
        patient_id: 'patient_123',
        intent: intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        entities: [],
        temporal_filter: null,
        filters: {
            artifact_types: ['medication_order', 'prescription'],
        },
        detail_level: 3,
        query_id: 'query_001',
    };
}
/**
 * Example 1: Basic candidate scoring
 */
function exampleBasicScoring() {
    console.log('Example 1: Basic Candidate Scoring');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    // Simulate semantic similarities from vector search
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    console.log(`  Scoring ${chunks.length} candidates\n`);
    chunks.forEach((chunk, i) => {
        const candidate = retrieval_scorer_service_1.default.scoreCandidate(chunk, query, similarities[i]);
        console.log(`  Candidate ${i + 1}: ${chunk.chunk_id}`);
        console.log(`    Semantic: ${candidate.scores.semantic_similarity.toFixed(3)}`);
        console.log(`    Keyword:  ${candidate.scores.keyword_match.toFixed(3)}`);
        console.log(`    Recency:  ${candidate.scores.recency_boost.toFixed(3)}`);
        console.log(`    Type:     ${candidate.scores.type_preference.toFixed(3)}`);
        console.log(`    Combined: ${candidate.scores.combined.toFixed(3)}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Keyword matching demonstration
 */
function exampleKeywordMatching() {
    console.log('Example 2: Keyword Matching (BM25)');
    console.log('-'.repeat(80));
    const queries = ['metformin diabetes', 'blood pressure', 'A1C glucose level'];
    const chunks = generateSampleChunks();
    console.log('  Testing keyword matching:\n');
    queries.forEach((queryText, i) => {
        console.log(`  Query ${i + 1}: "${queryText}"\n`);
        chunks.forEach((chunk) => {
            const score = retrieval_scorer_service_1.default.calculateKeywordMatch(chunk.content, queryText);
            console.log(`    ${chunk.chunk_id}: ${score.toFixed(3)}`);
            console.log(`      Content: ${chunk.content.substring(0, 60)}...`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Recency boost with time decay
 */
function exampleRecencyBoost() {
    console.log('Example 3: Recency Boost (Time Decay)');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    console.log('  Recency scores (exponential decay):\n');
    chunks.forEach((chunk) => {
        const recencyBoost = retrieval_scorer_service_1.default.calculateRecencyBoost(chunk.metadata.date);
        const date = new Date(chunk.metadata.date);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  ${chunk.chunk_id}:`);
        console.log(`    Date: ${chunk.metadata.date}`);
        console.log(`    Days ago: ${daysAgo}`);
        console.log(`    Recency boost: ${recencyBoost.toFixed(3)}`);
        console.log('');
    });
    console.log('  Note: Recent items (< 30 days) get higher boost');
    console.log('  Formula: exp(-0.01 * days_ago)\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Type preference based on intent
 */
function exampleTypePreference() {
    console.log('Example 4: Type Preference (Intent-Based)');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const intents = [
        intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS,
        intent_classifier_service_1.QueryIntent.RETRIEVE_NOTES,
        intent_classifier_service_1.QueryIntent.RETRIEVE_CARE_PLANS,
        intent_classifier_service_1.QueryIntent.SUMMARY,
    ];
    console.log('  Type preferences for different intents:\n');
    intents.forEach((intent) => {
        console.log(`  Intent: ${intent}`);
        chunks.forEach((chunk) => {
            const typeScore = retrieval_scorer_service_1.default.calculateTypePreference(chunk.metadata.artifact_type, intent);
            console.log(`    ${chunk.metadata.artifact_type.padEnd(20)} → ${typeScore.toFixed(1)}`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Score combination
 */
function exampleScoreCombination() {
    console.log('Example 5: Score Combination');
    console.log('-'.repeat(80));
    const scores = [
        { semantic: 0.9, keyword: 0.8, recency: 0.95, type: 1.0 },
        { semantic: 0.7, keyword: 0.9, recency: 0.3, type: 0.5 },
        { semantic: 0.95, keyword: 0.5, recency: 0.2, type: 0.8 },
    ];
    const weights = retrieval_scorer_service_1.default.getDefaultWeights();
    console.log('  Default weights:');
    console.log(`    Semantic: ${(weights.semantic * 100).toFixed(0)}%`);
    console.log(`    Keyword:  ${(weights.keyword * 100).toFixed(0)}%`);
    console.log(`    Recency:  ${(weights.recency * 100).toFixed(0)}%`);
    console.log(`    Type:     ${(weights.type_preference * 100).toFixed(0)}%`);
    console.log('\n  Score combinations:\n');
    scores.forEach((score, i) => {
        const combined = retrieval_scorer_service_1.default.combineScores(score.semantic, score.keyword, score.recency, score.type);
        console.log(`  Example ${i + 1}:`);
        console.log(`    Semantic: ${score.semantic.toFixed(2)} × 0.4 = ${(score.semantic * 0.4).toFixed(3)}`);
        console.log(`    Keyword:  ${score.keyword.toFixed(2)} × 0.3 = ${(score.keyword * 0.3).toFixed(3)}`);
        console.log(`    Recency:  ${score.recency.toFixed(2)} × 0.2 = ${(score.recency * 0.2).toFixed(3)}`);
        console.log(`    Type:     ${score.type.toFixed(2)} × 0.1 = ${(score.type * 0.1).toFixed(3)}`);
        console.log(`    Combined: ${combined.toFixed(3)}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Ranking candidates
 */
function exampleRanking() {
    console.log('Example 6: Ranking Candidates');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    console.log('  Scoring and ranking candidates:\n');
    const ranked = retrieval_scorer_service_1.default.scoreAndRank(chunks, query, similarities);
    ranked.forEach((candidate) => {
        console.log(`  Rank ${candidate.rank}: ${candidate.chunk.chunk_id}`);
        console.log(`    Combined score: ${candidate.scores.combined.toFixed(3)}`);
        console.log(`    Type: ${candidate.chunk.metadata.artifact_type}`);
        console.log(`    Date: ${candidate.chunk.metadata.date}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Score normalization
 */
function exampleNormalization() {
    console.log('Example 7: Score Normalization');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    const candidates = chunks.map((chunk, i) => retrieval_scorer_service_1.default.scoreCandidate(chunk, query, similarities[i]));
    console.log('  Before normalization:\n');
    candidates.forEach((c, i) => {
        console.log(`    ${i + 1}. Combined score: ${c.scores.combined.toFixed(3)}`);
    });
    const normalized = retrieval_scorer_service_1.default.normalizeScores(candidates);
    console.log('\n  After normalization (0-1 range):\n');
    normalized.forEach((c, i) => {
        console.log(`    ${i + 1}. Combined score: ${c.scores.combined.toFixed(3)}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 8: Custom weights
 */
function exampleCustomWeights() {
    console.log('Example 8: Custom Scoring Weights');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    // Scenario 1: Emphasize recency (time-sensitive query)
    const recencyWeights = {
        semantic: 0.3,
        keyword: 0.2,
        recency: 0.4, // Increased recency weight
        type_preference: 0.1,
    };
    console.log('  Scenario 1: Emphasize Recency (40%)\n');
    const ranked1 = retrieval_scorer_service_1.default.scoreAndRank(chunks, query, similarities, 3);
    ranked1.forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} - Score: ${c.scores.combined.toFixed(3)}`);
    });
    // Re-rank with recency emphasis
    const reranked = retrieval_scorer_service_1.default.rerank(ranked1, recencyWeights);
    console.log('\n  Re-ranked with recency emphasis:\n');
    reranked.forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} - Score: ${c.scores.combined.toFixed(3)}`);
    });
    // Scenario 2: Emphasize keyword matching
    const keywordWeights = {
        semantic: 0.3,
        keyword: 0.5, // Increased keyword weight
        recency: 0.1,
        type_preference: 0.1,
    };
    console.log('\n  Scenario 2: Emphasize Keywords (50%)\n');
    const ranked2 = retrieval_scorer_service_1.default.rerank(ranked1, keywordWeights);
    ranked2.forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} - Score: ${c.scores.combined.toFixed(3)}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 9: Score explanation
 */
function exampleScoreExplanation() {
    console.log('Example 9: Score Explanation');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    const ranked = retrieval_scorer_service_1.default.scoreAndRank(chunks, query, similarities, 2);
    console.log('  Detailed explanations for top 2 candidates:\n');
    ranked.forEach((candidate, i) => {
        console.log(`  === Candidate ${i + 1} ===`);
        console.log(retrieval_scorer_service_1.default.explainRanking(candidate));
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Score breakdown
 */
function exampleScoreBreakdown() {
    console.log('Example 10: Score Breakdown Analysis');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    const candidates = chunks.map((chunk, i) => retrieval_scorer_service_1.default.scoreCandidate(chunk, query, similarities[i]));
    console.log('  Score contributions by component:\n');
    candidates.forEach((candidate, i) => {
        const breakdown = retrieval_scorer_service_1.default.getScoreBreakdown(candidate);
        console.log(`  Candidate ${i + 1}: ${candidate.chunk.chunk_id}`);
        console.log(`    Semantic:     ${breakdown.semantic_contribution.toFixed(3)}`);
        console.log(`    Keyword:      ${breakdown.keyword_contribution.toFixed(3)}`);
        console.log(`    Recency:      ${breakdown.recency_contribution.toFixed(3)}`);
        console.log(`    Type:         ${breakdown.type_contribution.toFixed(3)}`);
        console.log(`    Total:        ${breakdown.total.toFixed(3)}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Diversity ranking
 */
function exampleDiversityRanking() {
    console.log('Example 11: Diversity-Aware Ranking');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.92, 0.91, 0.90, 0.89]; // Similar semantic scores
    console.log('  Standard ranking:\n');
    const ranked = retrieval_scorer_service_1.default.scoreAndRank(chunks, query, similarities);
    ranked.slice(0, 3).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
        console.log(`       Type: ${c.chunk.metadata.artifact_type}`);
        console.log(`       Score: ${c.scores.combined.toFixed(3)}`);
    });
    console.log('\n  Diversity ranking (promotes variety):\n');
    const diversityRanked = retrieval_scorer_service_1.default.diversityRank(ranked);
    diversityRanked.slice(0, 3).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
        console.log(`       Type: ${c.chunk.metadata.artifact_type}`);
        console.log(`       Score: ${c.scores.combined.toFixed(3)}`);
    });
    console.log('\n  Note: Diversity ranking penalizes similar artifact types\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Top-K retrieval
 */
function exampleTopK() {
    console.log('Example 12: Top-K Retrieval');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    const topKValues = [3, 5, 10];
    topKValues.forEach((k) => {
        const topK = retrieval_scorer_service_1.default.scoreAndRank(chunks, query, similarities, k);
        console.log(`  Top ${k} results:`);
        topK.forEach((c) => {
            console.log(`    ${c.rank}. ${c.chunk.chunk_id} - ${c.scores.combined.toFixed(3)}`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 13: Batch scoring
 */
function exampleBatchScoring() {
    console.log('Example 13: Batch Scoring');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    console.log(`  Batch scoring ${chunks.length} candidates...\n`);
    const startTime = Date.now();
    const candidates = retrieval_scorer_service_1.default.batchScore(chunks, query, similarities);
    const endTime = Date.now();
    console.log(`  Scored ${candidates.length} candidates in ${endTime - startTime}ms\n`);
    candidates.forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.chunk.chunk_id} - Combined: ${c.scores.combined.toFixed(3)}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 14: Full pipeline integration
 */
function exampleFullPipeline() {
    console.log('Example 14: Full Retrieval Pipeline');
    console.log('-'.repeat(80));
    const chunks = generateSampleChunks();
    const query = generateSampleQuery();
    console.log('  Simulating full retrieval pipeline:\n');
    // Step 1: Vector search (simulated)
    console.log('  Step 1: Vector Search');
    const similarities = [0.92, 0.78, 0.85, 0.81, 0.65];
    console.log(`    Found ${chunks.length} candidates\n`);
    // Step 2: Score candidates
    console.log('  Step 2: Score Candidates');
    const candidates = retrieval_scorer_service_1.default.batchScore(chunks, query, similarities);
    console.log(`    Scored ${candidates.length} candidates\n`);
    // Step 3: Rank candidates
    console.log('  Step 3: Rank Candidates');
    const ranked = retrieval_scorer_service_1.default.rankCandidates(candidates, 3);
    console.log(`    Top 3 results:\n`);
    ranked.forEach((c) => {
        console.log(`      ${c.rank}. ${c.chunk.chunk_id}`);
        console.log(`         Score: ${c.scores.combined.toFixed(3)}`);
        console.log(`         Type: ${c.chunk.metadata.artifact_type}`);
        console.log(`         Content: ${c.chunk.content.substring(0, 60)}...`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('RETRIEVAL SCORER SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBasicScoring();
        exampleKeywordMatching();
        exampleRecencyBoost();
        exampleTypePreference();
        exampleScoreCombination();
        exampleRanking();
        exampleNormalization();
        exampleCustomWeights();
        exampleScoreExplanation();
        exampleScoreBreakdown();
        exampleDiversityRanking();
        exampleTopK();
        exampleBatchScoring();
        exampleFullPipeline();
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
//# sourceMappingURL=retrieval-scorer.example.js.map