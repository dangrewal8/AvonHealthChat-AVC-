"use strict";
/**
 * Retrieval Scorer Service
 *
 * Combines multiple scoring signals for ranking retrieval candidates
 *
 * Features:
 * - Semantic similarity scoring (vector search)
 * - Keyword matching (BM25/TF-IDF)
 * - Recency boost (time decay)
 * - Type preference (intent-based)
 * - Weighted score combination
 * - Score normalization
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const intent_classifier_service_1 = require("./intent-classifier.service");
/**
 * Retrieval Scorer Class
 *
 * Scores and ranks retrieval candidates using multiple signals
 */
class RetrievalScorer {
    DEFAULT_WEIGHTS = {
        semantic: 0.4,
        keyword: 0.3,
        recency: 0.2,
        type_preference: 0.1,
    };
    BM25_PARAMS = {
        k1: 1.5,
        b: 0.75,
    };
    /**
     * Intent to artifact type preference mapping
     * Higher scores for matching types
     */
    INTENT_TYPE_PREFERENCE = {
        [intent_classifier_service_1.QueryIntent.RETRIEVE_MEDICATIONS]: {
            medication_order: 1.0,
            prescription: 1.0,
            medication_list: 0.9,
            progress_note: 0.5,
            default: 0.3,
        },
        [intent_classifier_service_1.QueryIntent.RETRIEVE_CARE_PLANS]: {
            care_plan: 1.0,
            treatment_plan: 1.0,
            care_coordination: 0.9,
            progress_note: 0.6,
            default: 0.3,
        },
        [intent_classifier_service_1.QueryIntent.RETRIEVE_NOTES]: {
            progress_note: 1.0,
            clinical_note: 1.0,
            encounter: 0.9,
            visit_note: 0.9,
            default: 0.4,
        },
        [intent_classifier_service_1.QueryIntent.SUMMARY]: {
            default: 0.8, // All types equally relevant for summary
        },
        [intent_classifier_service_1.QueryIntent.COMPARISON]: {
            default: 0.8, // All types equally relevant for comparison
        },
        [intent_classifier_service_1.QueryIntent.RETRIEVE_ALL]: {
            default: 0.8, // No preference
        },
        [intent_classifier_service_1.QueryIntent.UNKNOWN]: {
            default: 0.5, // Neutral
        },
    };
    /**
     * Score a candidate chunk against a structured query
     *
     * @param chunk - Candidate chunk with semantic similarity
     * @param query - Structured query
     * @param semanticSimilarity - Similarity score from vector search (0-1)
     * @returns Candidate with all scores
     */
    scoreCandidate(chunk, query, semanticSimilarity) {
        // Calculate individual scores
        const keywordMatch = this.calculateKeywordMatch(chunk.content, query.original_query);
        const recencyBoost = this.calculateRecencyBoost(chunk.metadata.date);
        const typePreference = this.calculateTypePreference(chunk.metadata.artifact_type, query.intent);
        // Combine scores
        const combined = this.combineScores(semanticSimilarity, keywordMatch, recencyBoost, typePreference);
        return {
            chunk,
            scores: {
                semantic_similarity: semanticSimilarity,
                keyword_match: keywordMatch,
                recency_boost: recencyBoost,
                type_preference: typePreference,
                combined,
            },
        };
    }
    /**
     * Combine multiple scoring signals with weights
     *
     * @param semantic - Semantic similarity (0-1)
     * @param keyword - Keyword match score (0-1)
     * @param recency - Recency boost (0-1)
     * @param typePreference - Type preference (0-1)
     * @param weights - Optional custom weights
     * @returns Combined score (0-1)
     */
    combineScores(semantic, keyword, recency, typePreference, weights = this.DEFAULT_WEIGHTS) {
        // Validate inputs are in [0, 1] range
        semantic = Math.max(0, Math.min(1, semantic));
        keyword = Math.max(0, Math.min(1, keyword));
        recency = Math.max(0, Math.min(1, recency));
        typePreference = Math.max(0, Math.min(1, typePreference));
        // Weighted combination
        const combined = weights.semantic * semantic +
            weights.keyword * keyword +
            weights.recency * recency +
            weights.type_preference * typePreference;
        return combined;
    }
    /**
     * Calculate keyword match score using simplified BM25
     *
     * @param content - Chunk content
     * @param query - Query string
     * @returns Keyword match score (0-1)
     */
    calculateKeywordMatch(content, query) {
        // Tokenize and normalize
        const contentTokens = this.tokenize(content.toLowerCase());
        const queryTokens = this.tokenize(query.toLowerCase());
        if (queryTokens.length === 0) {
            return 0;
        }
        // Calculate term frequencies
        const contentTF = this.calculateTermFrequencies(contentTokens);
        const docLength = contentTokens.length;
        const avgDocLength = 100; // Assumed average document length
        // BM25 scoring
        let score = 0;
        for (const term of queryTokens) {
            const tf = contentTF.get(term) || 0;
            if (tf > 0) {
                // Simplified BM25 formula (without IDF, assuming equal importance)
                const numerator = tf * (this.BM25_PARAMS.k1 + 1);
                const denominator = tf + this.BM25_PARAMS.k1 * (1 - this.BM25_PARAMS.b + this.BM25_PARAMS.b * (docLength / avgDocLength));
                score += numerator / denominator;
            }
        }
        // Normalize by query length
        const normalizedScore = score / queryTokens.length;
        // Map to [0, 1] range (BM25 typically ranges 0-2 per term)
        return Math.min(1, normalizedScore / 2);
    }
    /**
     * Calculate recency boost using exponential time decay
     *
     * @param dateString - ISO 8601 date string
     * @returns Recency boost score (0-1)
     */
    calculateRecencyBoost(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            if (isNaN(date.getTime())) {
                return 0.5; // Neutral score for invalid dates
            }
            // Calculate days ago
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysAgo = (now.getTime() - date.getTime()) / msPerDay;
            // Exponential decay: exp(-0.01 * days_ago)
            // Recent items (< 30 days) get high boost
            // Older items decay exponentially
            const decayRate = 0.01;
            const boost = Math.exp(-decayRate * daysAgo);
            return boost;
        }
        catch (error) {
            return 0.5; // Neutral score on error
        }
    }
    /**
     * Calculate type preference based on query intent
     *
     * @param artifactType - Artifact type
     * @param intent - Query intent
     * @returns Type preference score (0-1)
     */
    calculateTypePreference(artifactType, intent) {
        const preferences = this.INTENT_TYPE_PREFERENCE[intent];
        if (!preferences) {
            return 0.5; // Neutral if intent unknown
        }
        // Check for exact type match
        if (preferences[artifactType] !== undefined) {
            return preferences[artifactType];
        }
        // Use default preference
        return preferences.default || 0.5;
    }
    /**
     * Normalize scores to [0, 1] range
     *
     * @param candidates - Array of candidates
     * @returns Candidates with normalized scores
     */
    normalizeScores(candidates) {
        if (candidates.length === 0) {
            return candidates;
        }
        // Find min and max combined scores
        const scores = candidates.map((c) => c.scores.combined);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        // If all scores are the same, return as-is
        if (maxScore === minScore) {
            return candidates;
        }
        // Normalize to [0, 1]
        return candidates.map((candidate) => ({
            ...candidate,
            scores: {
                ...candidate.scores,
                combined: (candidate.scores.combined - minScore) / (maxScore - minScore),
            },
        }));
    }
    /**
     * Rank candidates by combined score
     *
     * @param candidates - Array of candidates
     * @param topK - Number of top candidates to return
     * @returns Sorted and ranked candidates
     */
    rankCandidates(candidates, topK) {
        // Sort by combined score (descending)
        const sorted = [...candidates].sort((a, b) => b.scores.combined - a.scores.combined);
        // Add rank
        const ranked = sorted.map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
        }));
        // Return top K if specified
        if (topK !== undefined && topK > 0) {
            return ranked.slice(0, topK);
        }
        return ranked;
    }
    /**
     * Score and rank multiple candidates
     *
     * @param chunks - Array of chunks with semantic similarities
     * @param query - Structured query
     * @param similarities - Corresponding semantic similarity scores
     * @param topK - Number of top candidates to return
     * @returns Ranked candidates
     */
    scoreAndRank(chunks, query, similarities, topK) {
        if (chunks.length !== similarities.length) {
            throw new Error('Chunks and similarities arrays must have the same length');
        }
        // Score all candidates
        const candidates = chunks.map((chunk, index) => this.scoreCandidate(chunk, query, similarities[index]));
        // Rank candidates
        return this.rankCandidates(candidates, topK);
    }
    /**
     * Tokenize text into words
     *
     * @param text - Input text
     * @returns Array of tokens
     */
    tokenize(text) {
        // Simple tokenization: split by whitespace and punctuation
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 0);
    }
    /**
     * Calculate term frequencies
     *
     * @param tokens - Array of tokens
     * @returns Map of term frequencies
     */
    calculateTermFrequencies(tokens) {
        const frequencies = new Map();
        for (const token of tokens) {
            frequencies.set(token, (frequencies.get(token) || 0) + 1);
        }
        return frequencies;
    }
    /**
     * Get default scoring weights
     *
     * @returns Default weights
     */
    getDefaultWeights() {
        return { ...this.DEFAULT_WEIGHTS };
    }
    /**
     * Set custom scoring weights
     *
     * Weights should sum to 1.0 for proper normalization
     *
     * @param weights - Custom weights
     * @returns Normalized weights
     */
    setWeights(weights) {
        const newWeights = {
            ...this.DEFAULT_WEIGHTS,
            ...weights,
        };
        // Validate weights sum to ~1.0
        const sum = newWeights.semantic + newWeights.keyword + newWeights.recency + newWeights.type_preference;
        if (Math.abs(sum - 1.0) > 0.01) {
            console.warn(`Scoring weights sum to ${sum.toFixed(2)}, expected 1.0. Consider normalizing weights.`);
        }
        return newWeights;
    }
    /**
     * Calculate score breakdown for analysis
     *
     * @param candidate - Candidate to analyze
     * @param weights - Scoring weights
     * @returns Score breakdown
     */
    getScoreBreakdown(candidate, weights = this.DEFAULT_WEIGHTS) {
        return {
            semantic_contribution: weights.semantic * candidate.scores.semantic_similarity,
            keyword_contribution: weights.keyword * candidate.scores.keyword_match,
            recency_contribution: weights.recency * candidate.scores.recency_boost,
            type_contribution: weights.type_preference * candidate.scores.type_preference,
            total: candidate.scores.combined,
        };
    }
    /**
     * Explain ranking for debugging
     *
     * @param candidate - Candidate to explain
     * @returns Human-readable explanation
     */
    explainRanking(candidate) {
        const breakdown = this.getScoreBreakdown(candidate);
        const weights = this.DEFAULT_WEIGHTS;
        const lines = [
            `Rank: ${candidate.rank || 'N/A'}`,
            `Combined Score: ${candidate.scores.combined.toFixed(3)}`,
            '',
            'Score Breakdown:',
            `  Semantic (${(weights.semantic * 100).toFixed(0)}%): ${candidate.scores.semantic_similarity.toFixed(3)} → ${breakdown.semantic_contribution.toFixed(3)}`,
            `  Keyword  (${(weights.keyword * 100).toFixed(0)}%): ${candidate.scores.keyword_match.toFixed(3)} → ${breakdown.keyword_contribution.toFixed(3)}`,
            `  Recency  (${(weights.recency * 100).toFixed(0)}%): ${candidate.scores.recency_boost.toFixed(3)} → ${breakdown.recency_contribution.toFixed(3)}`,
            `  Type     (${(weights.type_preference * 100).toFixed(0)}%): ${candidate.scores.type_preference.toFixed(3)} → ${breakdown.type_contribution.toFixed(3)}`,
            '',
            `Chunk: ${candidate.chunk.chunk_id}`,
            `Type: ${candidate.chunk.metadata.artifact_type}`,
            `Date: ${candidate.chunk.metadata.date}`,
        ];
        return lines.join('\n');
    }
    /**
     * Batch score candidates
     *
     * @param chunks - Array of chunks
     * @param query - Structured query
     * @param similarities - Semantic similarity scores
     * @returns Array of candidates
     */
    batchScore(chunks, query, similarities) {
        return chunks.map((chunk, index) => this.scoreCandidate(chunk, query, similarities[index]));
    }
    /**
     * Re-rank candidates with custom weights
     *
     * @param candidates - Existing candidates
     * @param weights - New weights
     * @returns Re-ranked candidates
     */
    rerank(candidates, weights) {
        // Recalculate combined scores with new weights
        const rescored = candidates.map((candidate) => ({
            ...candidate,
            scores: {
                ...candidate.scores,
                combined: this.combineScores(candidate.scores.semantic_similarity, candidate.scores.keyword_match, candidate.scores.recency_boost, candidate.scores.type_preference, weights),
            },
        }));
        // Re-rank
        return this.rankCandidates(rescored);
    }
    /**
     * Calculate diversity-aware ranking
     *
     * Promotes diversity by penalizing similar chunks
     *
     * @param candidates - Ranked candidates
     * @param diversityWeight - Weight for diversity (0-1, default: 0.3)
     * @returns Diversity-ranked candidates
     */
    diversityRank(candidates, diversityWeight = 0.3) {
        if (candidates.length <= 1) {
            return candidates;
        }
        const diversityScores = candidates.map((candidate, index) => {
            let diversityPenalty = 0;
            // Compare with previously selected candidates
            for (let j = 0; j < index; j++) {
                const prev = candidates[j];
                // Penalize if same artifact type and similar date
                if (candidate.chunk.metadata.artifact_type === prev.chunk.metadata.artifact_type) {
                    diversityPenalty += 0.2;
                    // Additional penalty if same artifact
                    if (candidate.chunk.artifact_id === prev.chunk.artifact_id) {
                        diversityPenalty += 0.3;
                    }
                }
            }
            // Combine original score with diversity
            const diversityAdjusted = (1 - diversityWeight) * candidate.scores.combined - diversityWeight * diversityPenalty;
            return {
                ...candidate,
                scores: {
                    ...candidate.scores,
                    combined: Math.max(0, diversityAdjusted),
                },
            };
        });
        // Re-rank with diversity scores
        return this.rankCandidates(diversityScores);
    }
}
// Export singleton instance
const retrievalScorer = new RetrievalScorer();
exports.default = retrievalScorer;
//# sourceMappingURL=retrieval-scorer.service.js.map