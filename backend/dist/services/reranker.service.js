"use strict";
/**
 * Re-Ranker Service
 *
 * Refines initial retrieval rankings using additional relevance signals
 *
 * Features:
 * - Entity coverage scoring
 * - Query term overlap analysis
 * - Document position boosting
 * - Artifact type matching
 * - Rule-based re-ranking (no ML models)
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const intent_classifier_service_1 = require("./intent-classifier.service");
/**
 * Re-Ranker Class
 *
 * Refines retrieval results using additional relevance signals
 */
class ReRanker {
    DEFAULT_WEIGHTS = {
        original_score: 0.7,
        entity_coverage: 0.15,
        query_overlap: 0.10,
        type_match_bonus: 0.05,
    };
    TOP_K_FOR_RERANKING = 20; // Only re-rank top 20
    /**
     * Intent to artifact type preference for re-ranking
     */
    INTENT_TYPE_BONUS = {
        [intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS]: {
            medication_order: 1.0,
            prescription: 1.0,
            medication_list: 0.8,
            default: 0.3,
        },
        [intent_classifier_service_1.QueryIntent.RETRIEVE_CARE_PLANS]: {
            care_plan: 1.0,
            treatment_plan: 1.0,
            care_coordination: 0.8,
            default: 0.3,
        },
        [intent_classifier_service_1.QueryIntent.RETRIEVE_NOTES]: {
            progress_note: 1.0,
            clinical_note: 1.0,
            encounter: 0.8,
            visit_note: 0.8,
            default: 0.4,
        },
        [intent_classifier_service_1.QueryIntent.SUMMARY]: {
            default: 0.7,
        },
        [intent_classifier_service_1.QueryIntent.COMPARISON]: {
            default: 0.7,
        },
        [intent_classifier_service_1.QueryIntent.RETRIEVE_ALL]: {
            default: 0.7,
        },
        [intent_classifier_service_1.QueryIntent.UNKNOWN]: {
            default: 0.5,
        },
    };
    /**
     * Re-rank candidates to improve top results
     *
     * @param candidates - Initial retrieval candidates
     * @param query - Structured query
     * @param topK - Number of candidates to re-rank (default: 20)
     * @returns Re-ranked candidates
     */
    rerank(candidates, query, topK = this.TOP_K_FOR_RERANKING) {
        if (candidates.length === 0) {
            return candidates;
        }
        // Only re-rank top K candidates for efficiency
        const candidatesToRerank = candidates.slice(0, topK);
        const remainingCandidates = candidates.slice(topK);
        // Calculate re-ranking scores
        const reranked = candidatesToRerank.map((candidate, index) => {
            const originalScore = candidate.score;
            // Calculate individual signals
            const entityCoverage = this.boostByEntityMatch(candidate.chunk, query.entities);
            const queryOverlap = this.calculateQueryRelevance(candidate.chunk, query.original_query);
            const positionBoost = this.calculatePositionBoost(index, candidatesToRerank.length);
            const typeMatchBonus = this.calculateTypeMatchBonus(candidate.chunk.metadata.artifact_type, query.intent);
            // Combine scores with weights
            const rerankScore = this.combineScores(originalScore, entityCoverage, queryOverlap, typeMatchBonus);
            return {
                candidate,
                originalScore,
                rerankScore,
                signals: {
                    entityCoverage,
                    queryOverlap,
                    positionBoost,
                    typeMatchBonus,
                },
            };
        });
        // Sort by re-ranking score
        reranked.sort((a, b) => b.rerankScore - a.rerankScore);
        // Update candidates with new scores and ranks
        const finalCandidates = reranked.map((item, index) => ({
            ...item.candidate,
            score: item.rerankScore,
            rank: index + 1,
        }));
        // Append remaining candidates (not re-ranked)
        return [...finalCandidates, ...remainingCandidates];
    }
    /**
     * Re-rank with detailed results
     *
     * @param candidates - Initial retrieval candidates
     * @param query - Structured query
     * @param topK - Number of candidates to re-rank
     * @returns Detailed re-ranking results
     */
    rerankWithDetails(candidates, query, topK = this.TOP_K_FOR_RERANKING) {
        if (candidates.length === 0) {
            return [];
        }
        const candidatesToRerank = candidates.slice(0, topK);
        // Calculate re-ranking scores with details
        const results = candidatesToRerank.map((candidate, index) => {
            const originalScore = candidate.score;
            const originalRank = candidate.rank || index + 1;
            // Calculate signals
            const entity_coverage = this.boostByEntityMatch(candidate.chunk, query.entities);
            const query_overlap = this.calculateQueryRelevance(candidate.chunk, query.original_query);
            const position_boost = this.calculatePositionBoost(index, candidatesToRerank.length);
            const type_match_bonus = this.calculateTypeMatchBonus(candidate.chunk.metadata.artifact_type, query.intent);
            // Combined score
            const rerank_score = this.combineScores(originalScore, entity_coverage, query_overlap, type_match_bonus);
            return {
                candidate,
                original_score: originalScore,
                rerank_score,
                signals: {
                    entity_coverage,
                    query_overlap,
                    position_boost,
                    type_match_bonus,
                },
                original_rank: originalRank,
            };
        });
        // Sort by re-ranking score
        results.sort((a, b) => b.rerank_score - a.rerank_score);
        // Calculate rank changes
        return results.map((result, newIndex) => ({
            ...result,
            candidate: {
                ...result.candidate,
                score: result.rerank_score,
                rank: newIndex + 1,
            },
            rank_change: result.original_rank - (newIndex + 1),
        }));
    }
    /**
     * Calculate query relevance based on term overlap
     *
     * @param chunk - Chunk to score
     * @param query - Query string
     * @returns Query overlap score (0-1)
     */
    calculateQueryRelevance(chunk, query) {
        const queryTokens = this.tokenize(query.toLowerCase());
        const contentTokens = this.tokenize(chunk.content.toLowerCase());
        if (queryTokens.length === 0) {
            return 0;
        }
        // Count how many query tokens appear in content
        const contentSet = new Set(contentTokens);
        let matchCount = 0;
        for (const token of queryTokens) {
            if (contentSet.has(token)) {
                matchCount++;
            }
        }
        // Return percentage of query terms found
        return matchCount / queryTokens.length;
    }
    /**
     * Calculate boost based on entity matches
     *
     * @param chunk - Chunk to score
     * @param entities - Query entities
     * @returns Entity coverage score (0-1)
     */
    boostByEntityMatch(chunk, entities) {
        if (entities.length === 0) {
            return 0.5; // Neutral if no entities
        }
        const contentLower = chunk.content.toLowerCase();
        let matchCount = 0;
        for (const entity of entities) {
            // Check if entity text or normalized form appears in content
            if (contentLower.includes(entity.text.toLowerCase()) ||
                contentLower.includes(entity.normalized.toLowerCase())) {
                matchCount++;
            }
        }
        // Return percentage of entities found
        return matchCount / entities.length;
    }
    /**
     * Calculate position boost (earlier chunks get slight boost)
     *
     * @param position - Position in results (0-indexed)
     * @param totalResults - Total number of results
     * @returns Position boost (0-1)
     */
    calculatePositionBoost(position, totalResults) {
        if (totalResults <= 1) {
            return 1.0;
        }
        // Linear decay: first position gets 1.0, last gets 0.5
        const decay = 0.5 / (totalResults - 1);
        return 1.0 - decay * position;
    }
    /**
     * Calculate type match bonus
     *
     * @param artifactType - Chunk artifact type
     * @param intent - Query intent
     * @returns Type match bonus (0-1)
     */
    calculateTypeMatchBonus(artifactType, intent) {
        const bonuses = this.INTENT_TYPE_BONUS[intent];
        if (!bonuses) {
            return 0.5;
        }
        // Check for exact type match
        if (bonuses[artifactType] !== undefined) {
            return bonuses[artifactType];
        }
        // Use default bonus
        return bonuses.default || 0.5;
    }
    /**
     * Combine re-ranking scores with weights
     *
     * @param originalScore - Original retrieval score
     * @param entityCoverage - Entity coverage score
     * @param queryOverlap - Query overlap score
     * @param typeMatchBonus - Type match bonus
     * @param weights - Custom weights (optional)
     * @returns Combined re-ranking score
     */
    combineScores(originalScore, entityCoverage, queryOverlap, typeMatchBonus, weights = this.DEFAULT_WEIGHTS) {
        return (weights.original_score * originalScore +
            weights.entity_coverage * entityCoverage +
            weights.query_overlap * queryOverlap +
            weights.type_match_bonus * typeMatchBonus);
    }
    /**
     * Tokenize text
     *
     * @param text - Input text
     * @returns Array of tokens
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 0);
    }
    /**
     * Get default re-ranking weights
     *
     * @returns Default weights
     */
    getDefaultWeights() {
        return { ...this.DEFAULT_WEIGHTS };
    }
    /**
     * Explain re-ranking for a candidate
     *
     * @param result - Re-ranking result
     * @returns Human-readable explanation
     */
    explainReRanking(result) {
        const weights = this.DEFAULT_WEIGHTS;
        const lines = [
            `Re-Ranking Analysis: ${result.candidate.chunk.chunk_id}`,
            ``,
            'Original:',
            `  Rank: ${result.candidate.rank || 'N/A'}`,
            `  Score: ${result.original_score.toFixed(3)}`,
            ``,
            'Re-Ranking Signals:',
            `  Entity Coverage (${(weights.entity_coverage * 100).toFixed(0)}%): ${result.signals.entity_coverage.toFixed(3)}`,
            `  Query Overlap   (${(weights.query_overlap * 100).toFixed(0)}%): ${result.signals.query_overlap.toFixed(3)}`,
            `  Type Match      (${(weights.type_match_bonus * 100).toFixed(0)}%): ${result.signals.type_match_bonus.toFixed(3)}`,
            `  Position Boost: ${result.signals.position_boost.toFixed(3)}`,
            ``,
            'Final:',
            `  Re-rank Score: ${result.rerank_score.toFixed(3)}`,
            `  Rank Change: ${result.rank_change ? (result.rank_change > 0 ? '+' : '') + result.rank_change : 'N/A'}`,
        ];
        return lines.join('\n');
    }
    /**
     * Compare rankings before and after re-ranking
     *
     * @param originalCandidates - Original candidates
     * @param rerankedCandidates - Re-ranked candidates
     * @returns Comparison summary
     */
    compareRankings(originalCandidates, rerankedCandidates) {
        const changes = {
            improved: 0,
            degraded: 0,
            unchanged: 0,
            top_changes: [],
        };
        // Create mapping of chunk_id to original rank
        const originalRanks = new Map();
        originalCandidates.forEach((c, i) => {
            originalRanks.set(c.chunk.chunk_id, i + 1);
        });
        // Compare ranks
        rerankedCandidates.forEach((c, newIndex) => {
            const newRank = newIndex + 1;
            const oldRank = originalRanks.get(c.chunk.chunk_id) || newRank;
            const change = oldRank - newRank;
            if (change > 0) {
                changes.improved++;
            }
            else if (change < 0) {
                changes.degraded++;
            }
            else {
                changes.unchanged++;
            }
            // Track significant changes
            if (Math.abs(change) >= 3) {
                changes.top_changes.push({
                    chunk_id: c.chunk.chunk_id,
                    old_rank: oldRank,
                    new_rank: newRank,
                });
            }
        });
        // Sort top changes by magnitude
        changes.top_changes.sort((a, b) => Math.abs(b.old_rank - b.new_rank) - Math.abs(a.old_rank - a.new_rank));
        return changes;
    }
    /**
     * Batch re-rank multiple candidate lists
     *
     * @param candidateLists - Array of candidate lists
     * @param queries - Corresponding queries
     * @param topK - Number to re-rank per list
     * @returns Array of re-ranked lists
     */
    batchRerank(candidateLists, queries, topK = this.TOP_K_FOR_RERANKING) {
        if (candidateLists.length !== queries.length) {
            throw new Error('Candidate lists and queries must have same length');
        }
        return candidateLists.map((candidates, i) => this.rerank(candidates, queries[i], topK));
    }
}
// Export singleton instance
const reranker = new ReRanker();
exports.default = reranker;
//# sourceMappingURL=reranker.service.js.map