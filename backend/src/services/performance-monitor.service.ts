/**
 * Performance Monitor Service
 *
 * Track and analyze performance metrics for pipeline stages.
 *
 * Features:
 * - Record stage durations
 * - Calculate percentiles (p50, p95, p99)
 * - Stage-by-stage breakdown
 * - Error and cache tracking
 * - Time window filtering
 *
 */

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  total_queries: number;
  avg_latency: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
  error_count: number;
  cache_hits: number;
  cache_misses: number;
}

/**
 * Stage metrics
 */
export interface StageMetrics {
  stage: string;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  count: number;
}

/**
 * Metric record
 */
interface MetricRecord {
  stage: string;
  duration_ms: number;
  timestamp: number;
  success: boolean;
}

/**
 * Cache metric
 */
interface CacheMetric {
  hit: boolean;
  timestamp: number;
}

/**
 * Performance Monitor Class
 *
 * Track and analyze performance metrics
 */
class PerformanceMonitor {
  /**
   * Metric records (stage durations)
   */
  private metrics: MetricRecord[] = [];

  /**
   * Error count
   */
  private errorCount = 0;

  /**
   * Cache metrics
   */
  private cacheMetrics: CacheMetric[] = [];

  /**
   * Max records to keep (prevent memory leaks)
   */
  private readonly MAX_RECORDS = 10000;

  /**
   * Record metric
   *
   * @param stage - Stage name
   * @param durationMs - Duration in milliseconds
   * @param success - Whether operation succeeded (default: true)
   */
  recordMetric(stage: string, durationMs: number, success = true): void {
    const record: MetricRecord = {
      stage,
      duration_ms: durationMs,
      timestamp: Date.now(),
      success,
    };

    this.metrics.push(record);

    // Track errors
    if (!success) {
      this.errorCount++;
    }

    // Prevent memory leaks
    if (this.metrics.length > this.MAX_RECORDS) {
      this.metrics = this.metrics.slice(-this.MAX_RECORDS);
    }
  }

  /**
   * Record cache hit or miss
   *
   * @param hit - Whether cache hit occurred
   */
  recordCacheMetric(hit: boolean): void {
    this.cacheMetrics.push({
      hit,
      timestamp: Date.now(),
    });

    // Prevent memory leaks
    if (this.cacheMetrics.length > this.MAX_RECORDS) {
      this.cacheMetrics = this.cacheMetrics.slice(-this.MAX_RECORDS);
    }
  }

  /**
   * Get performance metrics
   *
   * @param timeWindowMs - Time window in milliseconds (default: all time)
   * @returns Performance metrics
   */
  getMetrics(timeWindowMs?: number): PerformanceMetrics {
    const now = Date.now();
    const cutoffTime = timeWindowMs ? now - timeWindowMs : 0;

    // Filter metrics by time window
    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= cutoffTime
    );

    // Filter cache metrics by time window
    const recentCacheMetrics = this.cacheMetrics.filter(
      m => m.timestamp >= cutoffTime
    );

    // Calculate total queries (distinct end-to-end metrics)
    const endToEndMetrics = recentMetrics.filter(
      m => m.stage === 'end_to_end'
    );
    const totalQueries = endToEndMetrics.length;

    // Calculate latencies
    const latencies = endToEndMetrics.map(m => m.duration_ms).sort((a, b) => a - b);

    const avgLatency = latencies.length > 0
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      : 0;

    const p50Latency = this.calculatePercentile(latencies, 50);
    const p95Latency = this.calculatePercentile(latencies, 95);
    const p99Latency = this.calculatePercentile(latencies, 99);

    // Calculate cache hits and misses
    const cacheHits = recentCacheMetrics.filter(m => m.hit).length;
    const cacheMisses = recentCacheMetrics.filter(m => !m.hit).length;

    return {
      total_queries: totalQueries,
      avg_latency: Math.round(avgLatency * 100) / 100,
      p50_latency: p50Latency,
      p95_latency: p95Latency,
      p99_latency: p99Latency,
      error_count: this.errorCount,
      cache_hits: cacheHits,
      cache_misses: cacheMisses,
    };
  }

  /**
   * Get stage breakdown
   *
   * @param timeWindowMs - Time window in milliseconds (default: all time)
   * @returns Stage metrics array
   */
  getStageBreakdown(timeWindowMs?: number): StageMetrics[] {
    const now = Date.now();
    const cutoffTime = timeWindowMs ? now - timeWindowMs : 0;

    // Filter metrics by time window
    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= cutoffTime
    );

    // Group by stage
    const stageGroups = new Map<string, number[]>();

    for (const metric of recentMetrics) {
      if (!stageGroups.has(metric.stage)) {
        stageGroups.set(metric.stage, []);
      }
      stageGroups.get(metric.stage)!.push(metric.duration_ms);
    }

    // Calculate metrics for each stage
    const stageMetrics: StageMetrics[] = [];

    for (const [stage, durations] of stageGroups.entries()) {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);

      stageMetrics.push({
        stage,
        avg_duration_ms: Math.round(avgDuration * 100) / 100,
        min_duration_ms: minDuration,
        max_duration_ms: maxDuration,
        count: durations.length,
      });
    }

    // Sort by average duration (slowest first)
    return stageMetrics.sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);
  }

  /**
   * Calculate percentile
   *
   * @param values - Sorted array of values
   * @param percentile - Percentile (0-100)
   * @returns Percentile value
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Get metric count
   *
   * @returns Total number of metric records
   */
  getMetricCount(): number {
    return this.metrics.length;
  }

  /**
   * Reset metrics
   *
   * Clears all metric records
   */
  reset(): void {
    this.metrics = [];
    this.errorCount = 0;
    this.cacheMetrics = [];
  }

  /**
   * Export metrics for external monitoring
   *
   * @param timeWindowMs - Time window in milliseconds (default: last hour)
   * @returns Metrics export object
   */
  exportMetrics(timeWindowMs = 60 * 60 * 1000): {
    summary: PerformanceMetrics;
    stages: StageMetrics[];
    timestamp: string;
  } {
    return {
      summary: this.getMetrics(timeWindowMs),
      stages: this.getStageBreakdown(timeWindowMs),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get slow queries
   *
   * Returns queries that exceeded threshold
   *
   * @param thresholdMs - Threshold in milliseconds
   * @param timeWindowMs - Time window in milliseconds (default: last hour)
   * @returns Slow query records
   */
  getSlowQueries(
    thresholdMs: number,
    timeWindowMs = 60 * 60 * 1000
  ): MetricRecord[] {
    const now = Date.now();
    const cutoffTime = now - timeWindowMs;

    return this.metrics
      .filter(
        m =>
          m.stage === 'end_to_end' &&
          m.duration_ms > thresholdMs &&
          m.timestamp >= cutoffTime
      )
      .sort((a, b) => b.duration_ms - a.duration_ms);
  }

  /**
   * Get cache hit rate
   *
   * @param timeWindowMs - Time window in milliseconds (default: last hour)
   * @returns Cache hit rate (0-1)
   */
  getCacheHitRate(timeWindowMs = 60 * 60 * 1000): number {
    const metrics = this.getMetrics(timeWindowMs);
    const total = metrics.cache_hits + metrics.cache_misses;

    if (total === 0) {
      return 0;
    }

    return metrics.cache_hits / total;
  }

  /**
   * Get error rate
   *
   * @param timeWindowMs - Time window in milliseconds (default: last hour)
   * @returns Error rate (0-1)
   */
  getErrorRate(timeWindowMs = 60 * 60 * 1000): number {
    const now = Date.now();
    const cutoffTime = now - timeWindowMs;

    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= cutoffTime && m.stage === 'end_to_end'
    );

    const errorCount = recentMetrics.filter(m => !m.success).length;

    if (recentMetrics.length === 0) {
      return 0;
    }

    return errorCount / recentMetrics.length;
  }

  /**
   * Explain performance monitor
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Performance Monitor:

Metrics Tracked:
- Total queries
- Average latency
- Percentiles (p50, p95, p99)
- Error count
- Cache hits/misses

Stages:
- Query Understanding
- Retrieval
- Generation
- Confidence Scoring
- Provenance Formatting
- Response Building
- Audit Logging
- End-to-End (total)

Percentiles:
- p50: 50% of queries faster than this
- p95: 95% of queries faster than this
- p99: 99% of queries faster than this

Usage:
  performanceMonitor.recordMetric('retrieval', 145);
  const metrics = performanceMonitor.getMetrics(3600000); // Last hour
  const stages = performanceMonitor.getStageBreakdown();

Tech Stack: Node.js + TypeScript ONLY`;
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
