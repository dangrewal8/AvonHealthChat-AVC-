"use strict";
/**
 * Time Decay Scoring Service
 *
 * Implements exponential time decay per ChatGPT specification:
 * Formula: e^(-0.01 * days_ago)
 *
 * Recent documents get higher scores, older documents are penalized.
 *
 * Decay Curve:
 * - 0 days:   1.00 (no penalty)
 * - 7 days:   0.93 (7% penalty)
 * - 30 days:  0.74 (26% penalty)
 * - 90 days:  0.41 (59% penalty)
 * - 180 days: 0.17 (83% penalty)
 * - 365 days: 0.03 (97% penalty)
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Time Decay Scorer Class
 *
 * Applies exponential time decay to retrieval scores
 */
class TimeDecayScorer {
    /**
     * Decay rate constant per ChatGPT specification
     * Formula: e^(-DECAY_RATE * days_ago)
     */
    DECAY_RATE = 0.01;
    /**
     * Apply time decay to candidates
     *
     * @param candidates - Candidates to score
     * @param referenceDate - Reference date (default: now)
     * @returns Candidates with time decay applied
     */
    applyTimeDecay(candidates, referenceDate = new Date()) {
        // Apply decay to each candidate
        const decayed = candidates.map((candidate) => {
            const decayFactor = this.calculateDecayFactor(candidate.metadata.date, referenceDate);
            const daysAgo = this.calculateDaysAgo(candidate.metadata.date, referenceDate);
            return {
                ...candidate,
                original_score: candidate.score,
                score: candidate.score * decayFactor,
                time_decay_factor: decayFactor,
                days_ago: daysAgo,
            };
        });
        // Re-sort by decayed score
        decayed.sort((a, b) => b.score - a.score);
        // Update ranks
        decayed.forEach((c, i) => {
            c.rank = i + 1;
        });
        return decayed;
    }
    /**
     * Calculate time decay factor
     *
     * Per ChatGPT specification: e^(-0.01 * days_ago)
     *
     * @param occurredAt - ISO date string when event occurred
     * @param referenceDate - Reference date (default: now)
     * @returns Decay factor (0-1)
     */
    calculateDecayFactor(occurredAt, referenceDate = new Date()) {
        const occurredDate = new Date(occurredAt);
        const diffMs = referenceDate.getTime() - occurredDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        // Handle future dates
        if (diffDays < 0) {
            return 1.0; // No penalty for future dates
        }
        // ChatGPT specification: e^(-0.01 * days_ago)
        const decayFactor = Math.exp(-this.DECAY_RATE * diffDays);
        return decayFactor;
    }
    /**
     * Calculate days ago from a date
     *
     * @param occurredAt - ISO date string
     * @param referenceDate - Reference date (default: now)
     * @returns Days ago (negative for future dates)
     */
    calculateDaysAgo(occurredAt, referenceDate = new Date()) {
        const occurredDate = new Date(occurredAt);
        const diffMs = referenceDate.getTime() - occurredDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return Math.round(diffDays);
    }
    /**
     * Analyze time decay for a specific date
     *
     * @param occurredAt - Date to analyze
     * @param referenceDate - Reference date (default: now)
     * @returns Decay analysis
     */
    analyzeDecay(occurredAt, referenceDate = new Date()) {
        const daysAgo = this.calculateDaysAgo(occurredAt, referenceDate);
        const decayFactor = this.calculateDecayFactor(occurredAt, referenceDate);
        const penaltyPercentage = (1 - decayFactor) * 100;
        return {
            date: occurredAt,
            days_ago: daysAgo,
            decay_factor: decayFactor,
            penalty_percentage: penaltyPercentage,
            score_example: {
                original: 0.8,
                decayed: 0.8 * decayFactor,
            },
        };
    }
    /**
     * Generate decay curve data points
     *
     * @param maxDays - Maximum days to analyze (default: 365)
     * @param stepSize - Days between data points (default: 10)
     * @returns Array of decay curve points
     */
    getDecayCurve(maxDays = 365, stepSize = 10) {
        const points = [];
        for (let days = 0; days <= maxDays; days += stepSize) {
            const decayFactor = Math.exp(-this.DECAY_RATE * days);
            const penaltyPct = (1 - decayFactor) * 100;
            points.push({
                days_ago: days,
                decay_factor: decayFactor,
                penalty_pct: penaltyPct,
            });
        }
        return points;
    }
    /**
     * Get standard decay milestones per specification
     *
     * @returns Key decay curve points
     */
    getDecayMilestones() {
        const milestones = [0, 7, 30, 90, 180, 365];
        return milestones.map((days) => {
            const decayFactor = Math.exp(-this.DECAY_RATE * days);
            const penaltyPct = (1 - decayFactor) * 100;
            return {
                days_ago: days,
                decay_factor: decayFactor,
                penalty_pct: penaltyPct,
            };
        });
    }
    /**
     * Compare candidates before and after time decay
     *
     * @param candidates - Original candidates
     * @param decayed - Candidates with time decay
     * @returns Comparison analysis
     */
    compareBeforeAfter(candidates, decayed) {
        const originalMap = new Map(candidates.map((c, i) => [c.chunk.chunk_id, i + 1]));
        const rankChanges = decayed.map((d) => {
            const originalRank = originalMap.get(d.chunk.chunk_id) || 0;
            const decayedRank = d.rank || 0;
            const rankChange = originalRank - decayedRank;
            return {
                chunk_id: d.chunk.chunk_id,
                original_rank: originalRank,
                decayed_rank: decayedRank,
                rank_change: rankChange,
                original_score: d.original_score,
                decayed_score: d.score,
                days_ago: d.days_ago,
            };
        });
        // Calculate summary statistics
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
        const avgDecayFactor = decayed.reduce((sum, d) => sum + d.time_decay_factor, 0) / decayed.length;
        return {
            rank_changes: rankChanges,
            summary: {
                improved,
                degraded,
                unchanged,
                avg_decay_factor: avgDecayFactor,
            },
        };
    }
    /**
     * Explain time decay for a candidate
     *
     * @param candidate - Candidate with time decay
     * @returns Human-readable explanation
     */
    explainDecay(candidate) {
        const lines = [
            `Time Decay Analysis: ${candidate.chunk.chunk_id}`,
            `${'='.repeat(60)}`,
            ``,
            `Document Date: ${candidate.metadata.date}`,
            `Days Ago: ${candidate.days_ago}`,
            ``,
            `Scores:`,
            `  Original Score: ${candidate.original_score.toFixed(4)}`,
            `  Decay Factor:   ${candidate.time_decay_factor.toFixed(4)} (e^(-0.01 * ${candidate.days_ago}))`,
            `  Decayed Score:  ${candidate.score.toFixed(4)}`,
            ``,
            `Impact:`,
            `  Penalty: ${((1 - candidate.time_decay_factor) * 100).toFixed(1)}%`,
            `  Score Loss: ${(candidate.original_score - candidate.score).toFixed(4)}`,
            ``,
            `Interpretation:`,
        ];
        if (candidate.days_ago < 7) {
            lines.push(`  ✓ Very recent (< 1 week) - minimal penalty`);
        }
        else if (candidate.days_ago < 30) {
            lines.push(`  → Recent (< 1 month) - small penalty`);
        }
        else if (candidate.days_ago < 90) {
            lines.push(`  → Moderate age (< 3 months) - moderate penalty`);
        }
        else if (candidate.days_ago < 180) {
            lines.push(`  ⚠ Old (< 6 months) - significant penalty`);
        }
        else {
            lines.push(`  ⚠ Very old (> 6 months) - large penalty`);
        }
        return lines.join('\n');
    }
    /**
     * Generate decay curve visualization (ASCII)
     *
     * @param width - Chart width in characters (default: 60)
     * @returns ASCII visualization
     */
    visualizeDecayCurve(width = 60) {
        const points = this.getDecayCurve(365, 30);
        const lines = [
            `Time Decay Curve: e^(-0.01 * days_ago)`,
            `${'='.repeat(width)}`,
            ``,
        ];
        for (const point of points) {
            const barLength = Math.round(point.decay_factor * width);
            const bar = '█'.repeat(barLength);
            const spaces = ' '.repeat(width - barLength);
            lines.push(`${String(point.days_ago).padStart(3)}d │${bar}${spaces}│ ${point.decay_factor.toFixed(3)} (-${point.penalty_pct.toFixed(0)}%)`);
        }
        lines.push(``, `     └${'─'.repeat(width)}┘`, `      0.0${' '.repeat(width - 10)}1.0`, ``, `Legend: Days ago → Decay factor (penalty %)`);
        return lines.join('\n');
    }
    /**
     * Get decay rate constant
     *
     * @returns Decay rate (0.01 per spec)
     */
    getDecayRate() {
        return this.DECAY_RATE;
    }
    /**
     * Batch apply time decay to multiple candidate lists
     *
     * @param candidateLists - Array of candidate lists
     * @param referenceDate - Reference date (default: now)
     * @returns Array of decayed candidate lists
     */
    batchApplyTimeDecay(candidateLists, referenceDate = new Date()) {
        return candidateLists.map((candidates) => this.applyTimeDecay(candidates, referenceDate));
    }
    /**
     * Find candidates most affected by time decay
     *
     * @param decayed - Candidates with time decay
     * @param threshold - Minimum penalty percentage (default: 50)
     * @returns Candidates with penalty >= threshold
     */
    findMostAffected(decayed, threshold = 50) {
        return decayed.filter((c) => {
            const penaltyPct = (1 - c.time_decay_factor) * 100;
            return penaltyPct >= threshold;
        });
    }
}
// Export singleton instance
const timeDecayScorer = new TimeDecayScorer();
exports.default = timeDecayScorer;
//# sourceMappingURL=time-decay-scorer.service.js.map