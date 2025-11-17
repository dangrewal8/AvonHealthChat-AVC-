"use strict";
/**
 * Result Diversifier Usage Examples
 *
 * Demonstrates:
 * - Diversity penalty application (0.9^(n-1))
 * - Grouping by artifact
 * - Minimum diversity enforcement
 * - Before/after comparison
 * - Penalty curve analysis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicDiversification = exampleBasicDiversification;
exports.examplePenaltyCalculation = examplePenaltyCalculation;
exports.exampleGrouping = exampleGrouping;
exports.exampleDiversityStats = exampleDiversityStats;
exports.exampleBeforeAfterComparison = exampleBeforeAfterComparison;
exports.exampleMinimumDiversity = exampleMinimumDiversity;
exports.examplePenaltyCurve = examplePenaltyCurve;
exports.exampleExplainDiversification = exampleExplainDiversification;
exports.exampleMostPenalized = exampleMostPenalized;
exports.exampleCheckDiversity = exampleCheckDiversity;
exports.exampleBatchDiversification = exampleBatchDiversification;
exports.exampleInterleaving = exampleInterleaving;
exports.runAllExamples = runAllExamples;
const result_diversifier_service_1 = __importDefault(require("../services/result-diversifier.service"));
/**
 * Generate sample candidates with multiple chunks per artifact
 */
function generateSampleCandidates() {
    const candidates = [];
    // Artifact 1: 4 chunks (high scores)
    for (let i = 0; i < 4; i++) {
        const chunk = {
            chunk_id: `art1_chunk_${i + 1}`,
            artifact_id: 'artifact_001',
            patient_id: 'patient_123',
            content: `Artifact 1, Chunk ${i + 1}: Important medical information.`,
            metadata: {
                artifact_type: 'clinical_note',
                date: '2024-10-20T10:00:00Z',
                author: 'Dr. Smith',
            },
        };
        candidates.push({
            chunk,
            score: 0.9 - i * 0.05, // Decreasing scores: 0.9, 0.85, 0.8, 0.75
            snippet: chunk.content,
            highlights: [],
            metadata: chunk.metadata,
            rank: i + 1,
        });
    }
    // Artifact 2: 3 chunks (medium scores)
    for (let i = 0; i < 3; i++) {
        const chunk = {
            chunk_id: `art2_chunk_${i + 1}`,
            artifact_id: 'artifact_002',
            patient_id: 'patient_123',
            content: `Artifact 2, Chunk ${i + 1}: Relevant medical data.`,
            metadata: {
                artifact_type: 'lab_result',
                date: '2024-10-15T14:00:00Z',
                author: 'Lab Tech',
            },
        };
        candidates.push({
            chunk,
            score: 0.7 - i * 0.05, // 0.7, 0.65, 0.6
            snippet: chunk.content,
            highlights: [],
            metadata: chunk.metadata,
            rank: i + 5,
        });
    }
    // Artifact 3: 2 chunks (lower scores)
    for (let i = 0; i < 2; i++) {
        const chunk = {
            chunk_id: `art3_chunk_${i + 1}`,
            artifact_id: 'artifact_003',
            patient_id: 'patient_123',
            content: `Artifact 3, Chunk ${i + 1}: Additional information.`,
            metadata: {
                artifact_type: 'progress_note',
                date: '2024-10-10T09:00:00Z',
                author: 'Nurse Johnson',
            },
        };
        candidates.push({
            chunk,
            score: 0.55 - i * 0.05, // 0.55, 0.5
            snippet: chunk.content,
            highlights: [],
            metadata: chunk.metadata,
            rank: i + 8,
        });
    }
    return candidates;
}
/**
 * Example 1: Basic diversification
 */
function exampleBasicDiversification() {
    console.log('Example 1: Basic Diversification');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    console.log('  Original Rankings:\n');
    candidates.forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} (${c.chunk.artifact_id})`);
        console.log(`       Score: ${c.score.toFixed(3)}`);
    });
    console.log('\n  Applying diversity penalties...\n');
    const diversified = result_diversifier_service_1.default.diversify(candidates);
    console.log('  After Diversification:\n');
    diversified.forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} (${c.chunk.artifact_id})`);
        console.log(`       Original: ${c.original_score.toFixed(3)}`);
        console.log(`       Penalty:  ${c.diversity_penalty.toFixed(3)} (position ${c.artifact_position})`);
        console.log(`       Final:    ${c.score.toFixed(3)}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Penalty calculation
 */
function examplePenaltyCalculation() {
    console.log('Example 2: Penalty Calculation');
    console.log('-'.repeat(80));
    console.log('  Diversity Penalty Formula: 0.9^(n-1)\n');
    const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    console.log('  Position │ Penalty │ Reduction │ Interpretation');
    console.log('  ─'.repeat(55));
    positions.forEach((pos) => {
        const penalty = result_diversifier_service_1.default.calculateDiversityPenalty(pos);
        const reduction = (1 - penalty) * 100;
        let interpretation = '';
        if (pos === 1)
            interpretation = 'No penalty';
        else if (pos === 2)
            interpretation = '10% penalty';
        else if (pos === 3)
            interpretation = '19% penalty';
        else if (pos === 4)
            interpretation = '27% penalty';
        else
            interpretation = `${reduction.toFixed(0)}% penalty`;
        console.log(`  ${String(pos).padStart(8)} │ ${penalty.toFixed(4).padStart(7)} │ ${reduction.toFixed(1).padStart(9)}% │ ${interpretation}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 3: Grouping by artifact
 */
function exampleGrouping() {
    console.log('Example 3: Grouping by Artifact');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const grouped = result_diversifier_service_1.default.groupByArtifact(candidates);
    console.log(`  Found ${grouped.size} unique artifacts:\n`);
    for (const [artifactId, chunks] of grouped.entries()) {
        console.log(`    ${artifactId}: ${chunks.length} chunks`);
        chunks.forEach((chunk, i) => {
            console.log(`      ${i + 1}. ${chunk.chunk.chunk_id} (score: ${chunk.score.toFixed(3)})`);
        });
        console.log('');
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Diversity statistics
 */
function exampleDiversityStats() {
    console.log('Example 4: Diversity Statistics');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const statsBefore = result_diversifier_service_1.default.calculateDiversityStats(candidates);
    console.log('  Before Diversification:\n');
    console.log(`    Total Candidates: ${statsBefore.total_candidates}`);
    console.log(`    Unique Artifacts: ${statsBefore.unique_artifacts}`);
    console.log(`    Avg Chunks per Artifact: ${statsBefore.avg_chunks_per_artifact.toFixed(2)}`);
    console.log(`    Max Chunks from Single Artifact: ${statsBefore.max_chunks_from_single_artifact}`);
    console.log(`    Diversity Ratio: ${(statsBefore.diversity_ratio * 100).toFixed(1)}%\n`);
    const diversified = result_diversifier_service_1.default.diversify(candidates);
    const statsAfter = result_diversifier_service_1.default.calculateDiversityStats(diversified);
    console.log('  After Diversification:\n');
    console.log(`    Total Candidates: ${statsAfter.total_candidates}`);
    console.log(`    Unique Artifacts: ${statsAfter.unique_artifacts}`);
    console.log(`    Avg Chunks per Artifact: ${statsAfter.avg_chunks_per_artifact.toFixed(2)}`);
    console.log(`    Max Chunks from Single Artifact: ${statsAfter.max_chunks_from_single_artifact}`);
    console.log(`    Diversity Ratio: ${(statsAfter.diversity_ratio * 100).toFixed(1)}%\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Before/After comparison
 */
function exampleBeforeAfterComparison() {
    console.log('Example 5: Before/After Comparison');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const diversified = result_diversifier_service_1.default.diversify(candidates);
    const comparison = result_diversifier_service_1.default.compareBeforeAfter(candidates, diversified);
    console.log('  Ranking Changes:\n');
    comparison.rank_changes.slice(0, 5).forEach((change) => {
        const arrow = change.rank_change > 0 ? '↑' : change.rank_change < 0 ? '↓' : '─';
        console.log(`    ${change.chunk_id}:`);
        console.log(`      Artifact: ${change.artifact_id}`);
        console.log(`      Rank: ${change.original_rank} → ${change.diversified_rank} ${arrow}`);
        console.log(`      Score: ${change.original_score.toFixed(3)} → ${change.diversified_score.toFixed(3)}`);
        console.log(`      Penalty: ${change.penalty.toFixed(3)}`);
        console.log('');
    });
    console.log('  Summary:\n');
    console.log(`    Improved:  ${comparison.stats.improved} candidates`);
    console.log(`    Degraded:  ${comparison.stats.degraded} candidates`);
    console.log(`    Unchanged: ${comparison.stats.unchanged} candidates`);
    console.log(`    Avg Penalty: ${comparison.stats.avg_penalty.toFixed(3)}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Minimum diversity enforcement
 */
function exampleMinimumDiversity() {
    console.log('Example 6: Minimum Diversity Enforcement');
    console.log('-'.repeat(80));
    // Create biased candidates (all from same artifact in top-5)
    const biasedCandidates = [];
    // 5 chunks from artifact_001 with high scores
    for (let i = 0; i < 5; i++) {
        const chunk = {
            chunk_id: `art1_chunk_${i + 1}`,
            artifact_id: 'artifact_001',
            patient_id: 'patient_123',
            content: `Content ${i + 1}`,
            metadata: { artifact_type: 'note', date: '2024-10-20', author: 'Dr. A' },
        };
        biasedCandidates.push({
            chunk,
            score: 0.9 - i * 0.05,
            snippet: '',
            highlights: [],
            metadata: chunk.metadata,
            rank: i + 1,
        });
    }
    // 2 chunks from artifact_002 with lower scores
    for (let i = 0; i < 2; i++) {
        const chunk = {
            chunk_id: `art2_chunk_${i + 1}`,
            artifact_id: 'artifact_002',
            patient_id: 'patient_123',
            content: `Other content ${i + 1}`,
            metadata: { artifact_type: 'note', date: '2024-10-15', author: 'Dr. B' },
        };
        biasedCandidates.push({
            chunk,
            score: 0.6 - i * 0.05,
            snippet: '',
            highlights: [],
            metadata: chunk.metadata,
            rank: i + 6,
        });
    }
    console.log('  Before Minimum Diversity Enforcement:\n');
    biasedCandidates.slice(0, 5).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} (${c.chunk.artifact_id})`);
    });
    const uniqueBefore = new Set(biasedCandidates.slice(0, 5).map((c) => c.chunk.artifact_id));
    console.log(`\n    Unique artifacts in top-5: ${uniqueBefore.size}\n`);
    const diversified = result_diversifier_service_1.default.diversify(biasedCandidates);
    const ensured = result_diversifier_service_1.default.ensureMinimumDiversity(diversified, 5, 2);
    console.log('  After Minimum Diversity Enforcement:\n');
    ensured.slice(0, 5).forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} (${c.chunk.artifact_id})`);
    });
    const uniqueAfter = new Set(ensured.slice(0, 5).map((c) => c.chunk.artifact_id));
    console.log(`\n    Unique artifacts in top-5: ${uniqueAfter.size}`);
    console.log(`    Minimum diversity requirement (2): ${uniqueAfter.size >= 2 ? 'MET ✓' : 'NOT MET'}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Penalty curve visualization
 */
function examplePenaltyCurve() {
    console.log('Example 7: Penalty Curve Visualization');
    console.log('-'.repeat(80));
    const curve = result_diversifier_service_1.default.getPenaltyCurve(10);
    console.log('  Diversity Penalty Curve (0.9^(n-1)):\n');
    curve.forEach((point) => {
        const barLength = Math.round(point.penalty * 50);
        const bar = '█'.repeat(barLength);
        console.log(`    Pos ${point.position.toString().padStart(2)}: ${bar.padEnd(50)} ${point.penalty.toFixed(3)} (-${point.penalty_pct.toFixed(0)}%)`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 8: Explain diversification
 */
function exampleExplainDiversification() {
    console.log('Example 8: Explain Diversification');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const diversified = result_diversifier_service_1.default.diversify(candidates);
    // Explain for a candidate with penalty (position > 1)
    const penalizedCandidate = diversified.find((c) => c.artifact_position > 1);
    if (penalizedCandidate) {
        console.log('\n' + result_diversifier_service_1.default.explainDiversification(penalizedCandidate) + '\n');
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Most penalized candidates
 */
function exampleMostPenalized() {
    console.log('Example 9: Most Penalized Candidates');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const diversified = result_diversifier_service_1.default.diversify(candidates);
    // Find candidates with >20% penalty
    const mostPenalized = result_diversifier_service_1.default.findMostPenalized(diversified, 20);
    console.log(`  Candidates with >20% Diversity Penalty:\n`);
    if (mostPenalized.length === 0) {
        console.log('    (None found)\n');
    }
    else {
        mostPenalized.forEach((c) => {
            const penaltyPct = (1 - c.diversity_penalty) * 100;
            console.log(`    ${c.chunk.chunk_id}:`);
            console.log(`      Artifact: ${c.chunk.artifact_id}`);
            console.log(`      Position: ${c.artifact_position}`);
            console.log(`      Penalty: ${penaltyPct.toFixed(1)}%`);
            console.log(`      Score: ${c.original_score.toFixed(3)} → ${c.score.toFixed(3)}`);
            console.log('');
        });
    }
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Check minimum diversity
 */
function exampleCheckDiversity() {
    console.log('Example 10: Check Minimum Diversity');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const diversified = result_diversifier_service_1.default.diversify(candidates);
    const hasDiversity = result_diversifier_service_1.default.hasMinimumDiversity(diversified, 5, 2);
    console.log('  Diversity Check:\n');
    console.log(`    Top-K: 5`);
    console.log(`    Minimum Sources Required: 2`);
    console.log(`    Result: ${hasDiversity ? 'PASS ✓' : 'FAIL ✗'}\n`);
    const top5 = diversified.slice(0, 5);
    const uniqueSources = new Set(top5.map((c) => c.chunk.artifact_id));
    console.log('  Top-5 Artifacts:\n');
    top5.forEach((c) => {
        console.log(`    ${c.rank}. ${c.chunk.chunk_id} → ${c.chunk.artifact_id}`);
    });
    console.log(`\n    Unique Sources: ${uniqueSources.size}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Batch diversification
 */
function exampleBatchDiversification() {
    console.log('Example 11: Batch Diversification');
    console.log('-'.repeat(80));
    const candidateLists = [
        generateSampleCandidates(),
        generateSampleCandidates(),
        generateSampleCandidates(),
    ];
    console.log(`  Processing ${candidateLists.length} candidate lists...\n`);
    const diversifiedLists = result_diversifier_service_1.default.batchDiversify(candidateLists);
    diversifiedLists.forEach((diversified, i) => {
        const avgPenalty = diversified.reduce((sum, c) => sum + c.diversity_penalty, 0) / diversified.length;
        const stats = result_diversifier_service_1.default.calculateDiversityStats(diversified);
        console.log(`  List ${i + 1}:`);
        console.log(`    Candidates: ${diversified.length}`);
        console.log(`    Unique Artifacts: ${stats.unique_artifacts}`);
        console.log(`    Avg Penalty: ${avgPenalty.toFixed(3)}`);
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Interleaving strategy
 */
function exampleInterleaving() {
    console.log('Example 12: Interleaving Strategy');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    // Group by artifact
    const grouped = result_diversifier_service_1.default.groupByArtifact(candidates);
    console.log('  Original Order (by score):\n');
    candidates.slice(0, 6).forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.chunk.chunk_id} (${c.chunk.artifact_id}) - ${c.score.toFixed(3)}`);
    });
    const interleaved = result_diversifier_service_1.default.interleaveGroups(grouped);
    console.log('\n  Interleaved Order (round-robin by artifact):\n');
    interleaved.slice(0, 6).forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.chunk.chunk_id} (${c.chunk.artifact_id}) - ${c.score.toFixed(3)}`);
    });
    console.log('\n  Note: Interleaving ensures maximum spread across artifacts\n');
    console.log('  ✅ Success\n');
}
/**
 * Run all examples
 */
function runAllExamples() {
    console.log('='.repeat(80));
    console.log('RESULT DIVERSIFIER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBasicDiversification();
        examplePenaltyCalculation();
        exampleGrouping();
        exampleDiversityStats();
        exampleBeforeAfterComparison();
        exampleMinimumDiversity();
        examplePenaltyCurve();
        exampleExplainDiversification();
        exampleMostPenalized();
        exampleCheckDiversity();
        exampleBatchDiversification();
        exampleInterleaving();
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
//# sourceMappingURL=result-diversifier.example.js.map