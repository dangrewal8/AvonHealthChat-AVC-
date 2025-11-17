/**
 * Enrichment Metrics Service (Phase 8)
 *
 * Collects and tracks metrics for enrichment features to enable:
 * - Performance monitoring
 * - Quality tracking
 * - A/B testing
 * - Gradual rollout decisions
 *
 * Metrics Tracked:
 * - Latency (p50, p95, p99)
 * - Error rates
 * - Enrichment usage
 * - Quality scores
 */

interface QueryMetrics {
  query_id: string;
  patient_id: string;
  timestamp: Date;
  enrichment_enabled: boolean;
  multi_hop_enabled: boolean;
  reasoning_enabled: boolean;

  // Performance
  total_time_ms: number;
  retrieval_time_ms: number;
  generation_time_ms: number;

  // Quality
  candidates_count: number;
  enriched_chunks_count: number;
  avg_enrichment_score: number;
  hop_stats?: {
    initial_chunks: number;
    hop_1_chunks: number;
    hop_2_chunks: number;
    total_relationships_followed: number;
  };

  // Outcome
  success: boolean;
  error?: string;
}

interface AggregatedMetrics {
  total_queries: number;
  success_rate: number;
  error_rate: number;

  // Latency (milliseconds)
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  latency_avg: number;

  // Enrichment usage
  enrichment_usage_rate: number;
  multi_hop_usage_rate: number;
  reasoning_usage_rate: number;

  // Quality
  avg_enrichment_score: number;
  avg_enriched_chunks_per_query: number;
  avg_relationships_per_query: number;

  // Time window
  window_start: Date;
  window_end: Date;
}

class EnrichmentMetricsService {
  private metrics: QueryMetrics[] = [];
  private maxMetricsSize = 10000; // Keep last 10k queries in memory

  /**
   * Record metrics for a query
   */
  recordQuery(metrics: QueryMetrics): void {
    this.metrics.push(metrics);

    // Trim to max size (FIFO)
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    console.log(
      `[Metrics] Recorded query ${metrics.query_id}: enrichment=${metrics.enrichment_enabled}, ` +
      `latency=${metrics.total_time_ms}ms, success=${metrics.success}`
    );
  }

  /**
   * Get aggregated metrics for a time window
   */
  getAggregatedMetrics(windowMinutes: number = 60): AggregatedMetrics {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Filter to time window
    const windowMetrics = this.metrics.filter(m => m.timestamp >= windowStart);

    if (windowMetrics.length === 0) {
      return this.emptyMetrics(windowStart, now);
    }

    // Calculate success rate
    const successCount = windowMetrics.filter(m => m.success).length;
    const successRate = successCount / windowMetrics.length;
    const errorRate = 1 - successRate;

    // Calculate latency percentiles
    const latencies = windowMetrics.map(m => m.total_time_ms).sort((a, b) => a - b);
    const p50 = this.percentile(latencies, 50);
    const p95 = this.percentile(latencies, 95);
    const p99 = this.percentile(latencies, 99);
    const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;

    // Calculate enrichment usage
    const enrichmentCount = windowMetrics.filter(m => m.enrichment_enabled).length;
    const multiHopCount = windowMetrics.filter(m => m.multi_hop_enabled).length;
    const reasoningCount = windowMetrics.filter(m => m.reasoning_enabled).length;

    // Calculate quality metrics
    const enrichedMetrics = windowMetrics.filter(m => m.enrichment_enabled);
    const avgEnrichmentScore = enrichedMetrics.length > 0
      ? enrichedMetrics.reduce((sum, m) => sum + m.avg_enrichment_score, 0) / enrichedMetrics.length
      : 0;

    const avgEnrichedChunks = enrichedMetrics.length > 0
      ? enrichedMetrics.reduce((sum, m) => sum + m.enriched_chunks_count, 0) / enrichedMetrics.length
      : 0;

    const avgRelationships = enrichedMetrics.length > 0
      ? enrichedMetrics.reduce((sum, m) => sum + (m.hop_stats?.total_relationships_followed || 0), 0) / enrichedMetrics.length
      : 0;

    return {
      total_queries: windowMetrics.length,
      success_rate: successRate,
      error_rate: errorRate,
      latency_p50: p50,
      latency_p95: p95,
      latency_p99: p99,
      latency_avg: avg,
      enrichment_usage_rate: enrichmentCount / windowMetrics.length,
      multi_hop_usage_rate: multiHopCount / windowMetrics.length,
      reasoning_usage_rate: reasoningCount / windowMetrics.length,
      avg_enrichment_score: avgEnrichmentScore,
      avg_enriched_chunks_per_query: avgEnrichedChunks,
      avg_relationships_per_query: avgRelationships,
      window_start: windowStart,
      window_end: now,
    };
  }

  /**
   * Compare enriched vs non-enriched queries
   */
  compareEnrichedVsStandard(windowMinutes: number = 60): {
    enriched: AggregatedMetrics;
    standard: AggregatedMetrics;
    comparison: {
      latency_diff_ms: number;
      latency_diff_percent: number;
      quality_improvement: number;
    };
  } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const enrichedMetrics = this.metrics.filter(
      m => m.timestamp >= windowStart && m.enrichment_enabled
    );

    const standardMetrics = this.metrics.filter(
      m => m.timestamp >= windowStart && !m.enrichment_enabled
    );

    const enrichedAgg = this.aggregateMetricsList(enrichedMetrics, windowStart, now);
    const standardAgg = this.aggregateMetricsList(standardMetrics, windowStart, now);

    const latencyDiff = enrichedAgg.latency_avg - standardAgg.latency_avg;
    const latencyDiffPercent = standardAgg.latency_avg > 0
      ? (latencyDiff / standardAgg.latency_avg) * 100
      : 0;

    const qualityImprovement = enrichedAgg.avg_enrichment_score;

    return {
      enriched: enrichedAgg,
      standard: standardAgg,
      comparison: {
        latency_diff_ms: latencyDiff,
        latency_diff_percent: latencyDiffPercent,
        quality_improvement: qualityImprovement,
      },
    };
  }

  /**
   * Check if metrics meet production thresholds
   */
  checkHealthThresholds(): {
    healthy: boolean;
    issues: string[];
    warnings: string[];
  } {
    const metrics = this.getAggregatedMetrics(15); // Last 15 minutes
    const issues: string[] = [];
    const warnings: string[] = [];

    // Error rate threshold
    const errorThreshold = parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '0.05');
    if (metrics.error_rate > errorThreshold) {
      issues.push(`Error rate ${(metrics.error_rate * 100).toFixed(2)}% exceeds threshold ${(errorThreshold * 100).toFixed(2)}%`);
    }

    // Latency P95 threshold
    const p95Threshold = parseInt(process.env.ALERT_LATENCY_P95_THRESHOLD_MS || '3000');
    if (metrics.latency_p95 > p95Threshold) {
      warnings.push(`P95 latency ${metrics.latency_p95}ms exceeds threshold ${p95Threshold}ms`);
    }

    // Latency P99 threshold
    const p99Threshold = parseInt(process.env.ALERT_LATENCY_P99_THRESHOLD_MS || '5000');
    if (metrics.latency_p99 > p99Threshold) {
      issues.push(`P99 latency ${metrics.latency_p99}ms exceeds threshold ${p99Threshold}ms`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Get rollout recommendation based on metrics
   */
  getRolloutRecommendation(): {
    current_percentage: number;
    recommended_action: 'increase' | 'maintain' | 'decrease' | 'rollback';
    reasoning: string;
    next_percentage?: number;
  } {
    const currentPercentage = parseInt(process.env.ENRICHMENT_ROLLOUT_PERCENTAGE || '0');
    const health = this.checkHealthThresholds();
    const comparison = this.compareEnrichedVsStandard(60);

    // Critical issues - recommend rollback
    if (!health.healthy && health.issues.length > 0) {
      return {
        current_percentage: currentPercentage,
        recommended_action: 'rollback',
        reasoning: `Critical issues detected: ${health.issues.join(', ')}. Recommend rollback to 0%.`,
        next_percentage: 0,
      };
    }

    // Warnings but no critical issues - maintain
    if (health.warnings.length > 0) {
      return {
        current_percentage: currentPercentage,
        recommended_action: 'maintain',
        reasoning: `Warnings detected: ${health.warnings.join(', ')}. Monitor before increasing.`,
      };
    }

    // Excessive latency increase - decrease
    if (comparison.comparison.latency_diff_percent > 50) {
      return {
        current_percentage: currentPercentage,
        recommended_action: 'decrease',
        reasoning: `Latency increased by ${comparison.comparison.latency_diff_percent.toFixed(1)}%. Recommend reducing rollout.`,
        next_percentage: Math.max(0, currentPercentage - 10),
      };
    }

    // Healthy and at 100% - maintain
    if (currentPercentage >= 100) {
      return {
        current_percentage: currentPercentage,
        recommended_action: 'maintain',
        reasoning: 'Full rollout (100%) with healthy metrics. Continue monitoring.',
      };
    }

    // Healthy and below 100% - increase
    return {
      current_percentage: currentPercentage,
      recommended_action: 'increase',
      reasoning: `Metrics healthy. Latency impact: +${comparison.comparison.latency_diff_percent.toFixed(1)}%. Quality improvement: ${(comparison.comparison.quality_improvement * 100).toFixed(1)}%. Safe to increase rollout.`,
      next_percentage: Math.min(100, currentPercentage + 10),
    };
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('[Metrics] All metrics cleared');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (p / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedArray[lower];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private aggregateMetricsList(
    metricsList: QueryMetrics[],
    windowStart: Date,
    windowEnd: Date
  ): AggregatedMetrics {
    if (metricsList.length === 0) {
      return this.emptyMetrics(windowStart, windowEnd);
    }

    const successCount = metricsList.filter(m => m.success).length;
    const latencies = metricsList.map(m => m.total_time_ms).sort((a, b) => a - b);

    return {
      total_queries: metricsList.length,
      success_rate: successCount / metricsList.length,
      error_rate: 1 - (successCount / metricsList.length),
      latency_p50: this.percentile(latencies, 50),
      latency_p95: this.percentile(latencies, 95),
      latency_p99: this.percentile(latencies, 99),
      latency_avg: latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
      enrichment_usage_rate: metricsList.filter(m => m.enrichment_enabled).length / metricsList.length,
      multi_hop_usage_rate: metricsList.filter(m => m.multi_hop_enabled).length / metricsList.length,
      reasoning_usage_rate: metricsList.filter(m => m.reasoning_enabled).length / metricsList.length,
      avg_enrichment_score: metricsList.reduce((sum, m) => sum + m.avg_enrichment_score, 0) / metricsList.length,
      avg_enriched_chunks_per_query: metricsList.reduce((sum, m) => sum + m.enriched_chunks_count, 0) / metricsList.length,
      avg_relationships_per_query: metricsList.reduce((sum, m) => sum + (m.hop_stats?.total_relationships_followed || 0), 0) / metricsList.length,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }

  private emptyMetrics(windowStart: Date, windowEnd: Date): AggregatedMetrics {
    return {
      total_queries: 0,
      success_rate: 0,
      error_rate: 0,
      latency_p50: 0,
      latency_p95: 0,
      latency_p99: 0,
      latency_avg: 0,
      enrichment_usage_rate: 0,
      multi_hop_usage_rate: 0,
      reasoning_usage_rate: 0,
      avg_enrichment_score: 0,
      avg_enriched_chunks_per_query: 0,
      avg_relationships_per_query: 0,
      window_start: windowStart,
      window_end: windowEnd,
    };
  }
}

export const enrichmentMetricsService = new EnrichmentMetricsService();
export default enrichmentMetricsService;
export type { QueryMetrics, AggregatedMetrics };
