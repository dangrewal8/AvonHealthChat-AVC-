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
 * Performance Monitor Class
 *
 * Track and analyze performance metrics
 */
declare class PerformanceMonitor {
    /**
     * Metric records (stage durations)
     */
    private metrics;
    /**
     * Error count
     */
    private errorCount;
    /**
     * Cache metrics
     */
    private cacheMetrics;
    /**
     * Max records to keep (prevent memory leaks)
     */
    private readonly MAX_RECORDS;
    /**
     * Record metric
     *
     * @param stage - Stage name
     * @param durationMs - Duration in milliseconds
     * @param success - Whether operation succeeded (default: true)
     */
    recordMetric(stage: string, durationMs: number, success?: boolean): void;
    /**
     * Record cache hit or miss
     *
     * @param hit - Whether cache hit occurred
     */
    recordCacheMetric(hit: boolean): void;
    /**
     * Get performance metrics
     *
     * @param timeWindowMs - Time window in milliseconds (default: all time)
     * @returns Performance metrics
     */
    getMetrics(timeWindowMs?: number): PerformanceMetrics;
    /**
     * Get stage breakdown
     *
     * @param timeWindowMs - Time window in milliseconds (default: all time)
     * @returns Stage metrics array
     */
    getStageBreakdown(timeWindowMs?: number): StageMetrics[];
    /**
     * Calculate percentile
     *
     * @param values - Sorted array of values
     * @param percentile - Percentile (0-100)
     * @returns Percentile value
     */
    private calculatePercentile;
    /**
     * Get metric count
     *
     * @returns Total number of metric records
     */
    getMetricCount(): number;
    /**
     * Reset metrics
     *
     * Clears all metric records
     */
    reset(): void;
    /**
     * Export metrics for external monitoring
     *
     * @param timeWindowMs - Time window in milliseconds (default: last hour)
     * @returns Metrics export object
     */
    exportMetrics(timeWindowMs?: number): {
        summary: PerformanceMetrics;
        stages: StageMetrics[];
        timestamp: string;
    };
    /**
     * Get slow queries
     *
     * Returns queries that exceeded threshold
     *
     * @param thresholdMs - Threshold in milliseconds
     * @param timeWindowMs - Time window in milliseconds (default: last hour)
     * @returns Slow query records
     */
    getSlowQueries(thresholdMs: number, timeWindowMs?: number): MetricRecord[];
    /**
     * Get cache hit rate
     *
     * @param timeWindowMs - Time window in milliseconds (default: last hour)
     * @returns Cache hit rate (0-1)
     */
    getCacheHitRate(timeWindowMs?: number): number;
    /**
     * Get error rate
     *
     * @param timeWindowMs - Time window in milliseconds (default: last hour)
     * @returns Error rate (0-1)
     */
    getErrorRate(timeWindowMs?: number): number;
    /**
     * Explain performance monitor
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const performanceMonitor: PerformanceMonitor;
export default performanceMonitor;
//# sourceMappingURL=performance-monitor.service.d.ts.map