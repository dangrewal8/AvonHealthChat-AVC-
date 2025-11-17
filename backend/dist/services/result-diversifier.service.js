"use strict";
/**
 * Result Diversification Service
 *
 * Implements diversity penalties per ChatGPT specification:
 * "Penalize nth chunk from same artifact by factor of 0.9^(n-1)"
 *
 * Ensures diverse results by penalizing multiple chunks from the same artifact.
 *
 * Penalty Formula:
 * - 1st chunk: 1.0 (no penalty)
 * - 2nd chunk: 0.9 (10% penalty)
 * - 3rd chunk: 0.81 (19% penalty)
 * - 4th chunk: 0.729 (27% penalty)
 * - 5th chunk: 0.656 (34% penalty)
 *
 * Minimum Diversity: Ensures at least 2 different sources in top-5 results
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Result Diversifier Class
 *
 * Applies diversity penalties to ensure varied results
 */
class ResultDiversifier {
    /**
     * Penalty base per ChatGPT specification
     * Formula: 0.9^(n-1)
     */
    PENALTY_BASE = 0.9;
    /**
     * Minimum sources required in top-K results
     */
    MIN_SOURCES_IN_TOP_K = 2;
    /**
     * Default top-K for minimum diversity check
     */
    DEFAULT_TOP_K = 5;
    /**
     * Diversify candidates by penalizing multiple chunks from same artifact
     *
     * @param candidates - Candidates to diversify
     * @returns Diversified candidates with penalties applied
     */
    diversify(candidates) {
        if (candidates.length === 0) {
            return [];
        }
        // Step 1: Group candidates by artifact_id
        const grouped = this.groupByArtifact(candidates);
        // Step 2: Apply diversity penalty within each group
        const penalized = [];
        for (const [_artifactId, chunks] of grouped.entries()) {
            chunks.forEach((chunk, index) => {
                const position = index + 1;
                const penalty = this.calculateDiversityPenalty(position);
                // Apply penalty to score
                const penalizedChunk = {
                    ...chunk,
                    original_score: chunk.score,
                    score: chunk.score * penalty,
                    diversity_penalty: penalty,
                    artifact_position: position,
                };
                penalized.push(penalizedChunk);
            });
        }
        // Step 3: Re-sort by penalized scores
        penalized.sort((a, b) => b.score - a.score);
        // Update ranks
        penalized.forEach((c, i) => {
            c.rank = i + 1;
        });
        return penalized;
    }
    /**
     * Calculate diversity penalty per ChatGPT specification
     *
     * Formula: 0.9^(n-1)
     *
     * @param position - Position within artifact (1-indexed)
     * @returns Penalty multiplier (0-1)
     */
    calculateDiversityPenalty(position) {
        // ChatGPT specification: 0.9^(n-1)
        // position = 1 → 0.9^0 = 1.0 (no penalty)
        // position = 2 → 0.9^1 = 0.9 (10% penalty)
        // position = 3 → 0.9^2 = 0.81 (19% penalty)
        // position = 4 → 0.9^3 = 0.729 (27% penalty)
        return Math.pow(this.PENALTY_BASE, position - 1);
    }
    /**
     * Group candidates by artifact_id
     *
     * @param candidates - Candidates to group
     * @returns Map of artifact_id → candidates
     */
    groupByArtifact(candidates) {
        const groups = new Map();
        for (const candidate of candidates) {
            const artifactId = candidate.chunk.artifact_id;
            if (!groups.has(artifactId)) {
                groups.set(artifactId, []);
            }
            groups.get(artifactId).push(candidate);
        }
        return groups;
    }
    /**
     * Ensure minimum diversity in top-K results per ChatGPT specification
     *
     * "Ensure at least 2 different sources in top-5 if available"
     *
     * @param results - Diversified results
     * @param topK - Number of top results to check (default: 5)
     * @param minSources - Minimum unique sources required (default: 2)
     * @returns Results with minimum diversity ensured
     */
    ensureMinimumDiversity(results, topK = this.DEFAULT_TOP_K, minSources = this.MIN_SOURCES_IN_TOP_K) {
        if (results.length <= topK) {
            return results; // Not enough results to ensure diversity
        }
        const top = results.slice(0, topK);
        const uniqueSources = new Set(top.map((c) => c.chunk.artifact_id));
        // Check if we have enough diversity
        if (uniqueSources.size >= minSources) {
            return results; // Already diverse enough
        }
        // Find candidates from different sources
        const remaining = results.slice(topK);
        const needed = minSources - uniqueSources.size;
        let added = 0;
        for (const candidate of remaining) {
            if (!uniqueSources.has(candidate.chunk.artifact_id)) {
                // Swap with lowest-scoring item in top-k
                top[topK - 1] = candidate;
                top.sort((a, b) => b.score - a.score);
                uniqueSources.add(candidate.chunk.artifact_id);
                added++;
                if (added >= needed)
                    break;
            }
        }
        // Update ranks
        top.forEach((c, i) => {
            c.rank = i + 1;
        });
        // Combine with remaining results
        const finalResults = [...top, ...remaining.filter((r) => !top.includes(r))];
        return finalResults;
    }
    /**
     * Calculate diversity statistics
     *
     * @param candidates - Candidates to analyze
     * @returns Diversity statistics
     */
    calculateDiversityStats(candidates) {
        if (candidates.length === 0) {
            return {
                total_candidates: 0,
                unique_artifacts: 0,
                avg_chunks_per_artifact: 0,
                max_chunks_from_single_artifact: 0,
                diversity_ratio: 0,
            };
        }
        const grouped = this.groupByArtifact(candidates);
        const uniqueArtifacts = grouped.size;
        const totalCandidates = candidates.length;
        const avgChunksPerArtifact = totalCandidates / uniqueArtifacts;
        let maxChunks = 0;
        for (const chunks of grouped.values()) {
            if (chunks.length > maxChunks) {
                maxChunks = chunks.length;
            }
        }
        const diversityRatio = uniqueArtifacts / totalCandidates;
        return {
            total_candidates: totalCandidates,
            unique_artifacts: uniqueArtifacts,
            avg_chunks_per_artifact: avgChunksPerArtifact,
            max_chunks_from_single_artifact: maxChunks,
            diversity_ratio: diversityRatio,
        };
    }
    /**
     * Compare diversity before and after
     *
     * @param original - Original candidates
     * @param diversified - Diversified candidates
     * @returns Comparison analysis
     */
    compareBeforeAfter(original, diversified) {
        const originalMap = new Map(original.map((c, i) => [c.chunk.chunk_id, i + 1]));
        const rankChanges = diversified.map((d) => {
            const originalRank = originalMap.get(d.chunk.chunk_id) || 0;
            const diversifiedRank = d.rank || 0;
            const rankChange = originalRank - diversifiedRank;
            return {
                chunk_id: d.chunk.chunk_id,
                artifact_id: d.chunk.artifact_id,
                original_rank: originalRank,
                diversified_rank: diversifiedRank,
                rank_change: rankChange,
                original_score: d.original_score,
                diversified_score: d.score,
                penalty: d.diversity_penalty,
            };
        });
        // Calculate summary
        let improved = 0;
        let degraded = 0;
        let unchanged = 0;
        for (const change of rankChanges) {
            if (change.rank_change > 0)
                improved++;
            else if (change.rank_change < 0)
                degraded++;
            else
                unchanged++;
        }
        const avgPenalty = diversified.reduce((sum, d) => sum + d.diversity_penalty, 0) / diversified.length;
        return {
            rank_changes: rankChanges,
            stats: {
                improved,
                degraded,
                unchanged,
                avg_penalty: avgPenalty,
            },
        };
    }
    /**
     * Explain diversification for a candidate
     *
     * @param candidate - Diversified candidate
     * @returns Human-readable explanation
     */
    explainDiversification(candidate) {
        const lines = [
            `Diversification Analysis: ${candidate.chunk.chunk_id}`,
            `${'='.repeat(60)}`,
            ``,
            `Artifact: ${candidate.chunk.artifact_id}`,
            `Position within artifact: ${candidate.artifact_position}`,
            ``,
            `Scores:`,
            `  Original Score: ${candidate.original_score.toFixed(4)}`,
            `  Penalty Factor: ${candidate.diversity_penalty.toFixed(4)} (0.9^${candidate.artifact_position - 1})`,
            `  Final Score:    ${candidate.score.toFixed(4)}`,
            ``,
            `Impact:`,
            `  Score Reduction: ${(candidate.original_score - candidate.score).toFixed(4)}`,
            `  Penalty %:       ${((1 - candidate.diversity_penalty) * 100).toFixed(1)}%`,
            ``,
            `Interpretation:`,
        ];
        if (candidate.artifact_position === 1) {
            lines.push(`  ✓ First chunk from artifact - no penalty`);
        }
        else if (candidate.artifact_position === 2) {
            lines.push(`  → Second chunk from artifact - 10% penalty`);
        }
        else if (candidate.artifact_position === 3) {
            lines.push(`  → Third chunk from artifact - 19% penalty`);
        }
        else if (candidate.artifact_position >= 4) {
            lines.push(`  ⚠ ${candidate.artifact_position}th chunk from artifact - ${((1 - candidate.diversity_penalty) * 100).toFixed(0)}% penalty`);
        }
        return lines.join('\n');
    }
    /**
     * Get penalty curve data points
     *
     * @param maxPosition - Maximum position (default: 10)
     * @returns Array of penalty curve points
     */
    getPenaltyCurve(maxPosition = 10) {
        const points = [];
        for (let pos = 1; pos <= maxPosition; pos++) {
            const penalty = this.calculateDiversityPenalty(pos);
            const penaltyPct = (1 - penalty) * 100;
            points.push({
                position: pos,
                penalty,
                penalty_pct: penaltyPct,
            });
        }
        return points;
    }
    /**
     * Check if top-K has minimum diversity
     *
     * @param results - Results to check
     * @param topK - Top K to check (default: 5)
     * @param minSources - Minimum sources (default: 2)
     * @returns True if minimum diversity met
     */
    hasMinimumDiversity(results, topK = this.DEFAULT_TOP_K, minSources = this.MIN_SOURCES_IN_TOP_K) {
        const top = results.slice(0, Math.min(topK, results.length));
        const uniqueSources = new Set(top.map((c) => c.chunk.artifact_id));
        return uniqueSources.size >= minSources;
    }
    /**
     * Find most penalized candidates
     *
     * @param diversified - Diversified candidates
     * @param threshold - Minimum penalty percentage (default: 20)
     * @returns Candidates with penalty >= threshold
     */
    findMostPenalized(diversified, threshold = 20) {
        return diversified.filter((c) => {
            const penaltyPct = (1 - c.diversity_penalty) * 100;
            return penaltyPct >= threshold;
        });
    }
    /**
     * Batch diversification
     *
     * @param candidateLists - Array of candidate lists
     * @returns Array of diversified lists
     */
    batchDiversify(candidateLists) {
        return candidateLists.map((candidates) => this.diversify(candidates));
    }
    /**
     * Get penalty base constant
     *
     * @returns Penalty base (0.9 per spec)
     */
    getPenaltyBase() {
        return this.PENALTY_BASE;
    }
    /**
     * Interleave groups for maximum diversity
     * (Alternative diversification strategy)
     *
     * @param groups - Grouped candidates
     * @returns Interleaved candidates
     */
    interleaveGroups(groups) {
        const interleaved = [];
        const artifactIds = Array.from(groups.keys());
        const groupArrays = artifactIds.map((id) => groups.get(id));
        // Interleave: take one from each group in round-robin
        let index = 0;
        let hasMore = true;
        while (hasMore) {
            hasMore = false;
            for (const group of groupArrays) {
                if (index < group.length) {
                    interleaved.push(group[index]);
                    hasMore = true;
                }
            }
            index++;
        }
        return interleaved;
    }
}
// Export singleton instance
const resultDiversifier = new ResultDiversifier();
exports.default = resultDiversifier;
//# sourceMappingURL=result-diversifier.service.js.map