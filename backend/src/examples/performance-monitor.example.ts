/**
 * Performance Monitor Usage Examples
 *
 * Demonstrates:
 * - Recording stage metrics
 * - Calculating performance metrics (avg, p50, p95, p99)
 * - Stage-by-stage breakdown
 * - Cache metrics tracking
 * - Error rate calculation
 * - Slow query detection
 * - Time window filtering
 * - Metrics export
 */

import performanceMonitor from '../services/performance-monitor.service';

/**
 * Example 1: Basic metric recording
 */
export function exampleBasicRecording() {
  console.log('Example 1: Basic Metric Recording');
  console.log('-'.repeat(80));

  // Record metrics for different stages
  performanceMonitor.recordMetric('query_understanding', 45);
  performanceMonitor.recordMetric('retrieval', 120);
  performanceMonitor.recordMetric('generation', 230);
  performanceMonitor.recordMetric('confidence_scoring', 15);
  performanceMonitor.recordMetric('provenance_formatting', 10);
  performanceMonitor.recordMetric('response_building', 5);
  performanceMonitor.recordMetric('audit_logging', 8);
  performanceMonitor.recordMetric('end_to_end', 433);

  console.log('  ✅ Recorded metrics for 8 stages');
  console.log('  Total metric count:', performanceMonitor.getMetricCount());
  console.log();

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 2: Performance metrics calculation
 */
export function examplePerformanceMetrics() {
  console.log('Example 2: Performance Metrics Calculation');
  console.log('-'.repeat(80));

  // Simulate 10 queries with varying latencies
  const latencies = [120, 145, 98, 203, 167, 134, 189, 156, 142, 178];

  console.log('  Recording 10 end-to-end queries:\n');

  latencies.forEach((latency, i) => {
    performanceMonitor.recordMetric('end_to_end', latency);
    console.log(`    Query ${i + 1}: ${latency}ms`);
  });

  // Get metrics
  const metrics = performanceMonitor.getMetrics();

  console.log('\n  Performance Metrics:');
  console.log('    Total queries:', metrics.total_queries);
  console.log('    Average latency:', metrics.avg_latency, 'ms');
  console.log('    p50 latency:', metrics.p50_latency, 'ms');
  console.log('    p95 latency:', metrics.p95_latency, 'ms');
  console.log('    p99 latency:', metrics.p99_latency, 'ms');
  console.log('    Error count:', metrics.error_count);

  console.log('\n  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 3: Stage breakdown
 */
export function exampleStageBreakdown() {
  console.log('Example 3: Stage Breakdown');
  console.log('-'.repeat(80));

  console.log('  Recording metrics for 5 queries across all stages:\n');

  // Simulate 5 queries with metrics for each stage
  for (let i = 0; i < 5; i++) {
    performanceMonitor.recordMetric('query_understanding', 40 + Math.random() * 20);
    performanceMonitor.recordMetric('retrieval', 100 + Math.random() * 50);
    performanceMonitor.recordMetric('generation', 200 + Math.random() * 100);
    performanceMonitor.recordMetric('confidence_scoring', 10 + Math.random() * 10);
    performanceMonitor.recordMetric('provenance_formatting', 8 + Math.random() * 5);
    performanceMonitor.recordMetric('response_building', 3 + Math.random() * 4);
    performanceMonitor.recordMetric('audit_logging', 5 + Math.random() * 5);
  }

  // Get stage breakdown
  const stages = performanceMonitor.getStageBreakdown();

  console.log('  Stage Breakdown (sorted by average duration):\n');

  stages.forEach(stage => {
    console.log(`    ${stage.stage}:`);
    console.log(`      Average: ${stage.avg_duration_ms.toFixed(2)}ms`);
    console.log(`      Min: ${stage.min_duration_ms.toFixed(2)}ms`);
    console.log(`      Max: ${stage.max_duration_ms.toFixed(2)}ms`);
    console.log(`      Count: ${stage.count}`);
    console.log();
  });

  console.log('  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 4: Percentile calculation
 */
export function examplePercentileCalculation() {
  console.log('Example 4: Percentile Calculation');
  console.log('-'.repeat(80));

  // Simulate 100 queries with known distribution
  const latencies: number[] = [];

  console.log('  Recording 100 queries with varying latencies:\n');

  for (let i = 1; i <= 100; i++) {
    // Create a distribution: mostly 100-200ms, some outliers
    let latency;
    if (i <= 50) {
      latency = 100 + Math.random() * 50; // 50% between 100-150ms
    } else if (i <= 90) {
      latency = 150 + Math.random() * 50; // 40% between 150-200ms
    } else if (i <= 95) {
      latency = 200 + Math.random() * 100; // 5% between 200-300ms
    } else {
      latency = 300 + Math.random() * 200; // 5% outliers 300-500ms
    }

    latencies.push(latency);
    performanceMonitor.recordMetric('end_to_end', latency);
  }

  const metrics = performanceMonitor.getMetrics();

  console.log('  Percentile Analysis:');
  console.log('    p50 (median):', metrics.p50_latency, 'ms');
  console.log('      → 50% of queries are faster than this');
  console.log('    p95:', metrics.p95_latency, 'ms');
  console.log('      → 95% of queries are faster than this');
  console.log('    p99:', metrics.p99_latency, 'ms');
  console.log('      → 99% of queries are faster than this');
  console.log('\n  Average latency:', metrics.avg_latency.toFixed(2), 'ms');
  console.log('  (Note: Average is affected by outliers, p50 is more representative)');

  console.log('\n  ✅ Success (percentiles calculated)\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 5: Time window filtering
 */
export async function exampleTimeWindowFiltering() {
  console.log('Example 5: Time Window Filtering');
  console.log('-'.repeat(80));

  console.log('  Recording metrics over time:\n');

  // Record some metrics now
  console.log('  Phase 1: Record 5 queries (now)');
  for (let i = 0; i < 5; i++) {
    performanceMonitor.recordMetric('end_to_end', 150 + Math.random() * 50);
  }

  // Get all-time metrics
  const allTimeMetrics = performanceMonitor.getMetrics();
  console.log('    All-time queries:', allTimeMetrics.total_queries);

  // Wait 1 second
  console.log('\n  Waiting 1 second...\n');
  await new Promise(resolve => setTimeout(resolve, 1100));

  // Record more metrics
  console.log('  Phase 2: Record 5 more queries (after 1 second)');
  for (let i = 0; i < 5; i++) {
    performanceMonitor.recordMetric('end_to_end', 180 + Math.random() * 60);
  }

  // Get metrics for different time windows
  const last5Seconds = performanceMonitor.getMetrics(5000);
  const last1Second = performanceMonitor.getMetrics(1000);

  console.log('\n  Time Window Analysis:');
  console.log('    All time:', allTimeMetrics.total_queries + 5, 'queries');
  console.log('    Last 5 seconds:', last5Seconds.total_queries, 'queries');
  console.log('    Last 1 second:', last1Second.total_queries, 'queries');
  console.log('      (Only includes Phase 2 queries)');

  console.log('\n  ✅ Success (time window filtering)\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 6: Cache metrics tracking
 */
export function exampleCacheMetrics() {
  console.log('Example 6: Cache Metrics Tracking');
  console.log('-'.repeat(80));

  console.log('  Recording cache hits and misses:\n');

  // Simulate 20 queries with cache behavior
  const cacheResults = [
    false, // miss (first query)
    false, // miss
    true,  // hit (repeated query)
    true,  // hit
    false, // miss (new query)
    true,  // hit
    true,  // hit
    true,  // hit
    false, // miss
    true,  // hit
    true,  // hit
    true,  // hit
    false, // miss
    true,  // hit
    true,  // hit
    true,  // hit
    true,  // hit
    false, // miss
    true,  // hit
    true,  // hit
  ];

  cacheResults.forEach((hit, i) => {
    performanceMonitor.recordCacheMetric(hit);
    console.log(`    Query ${i + 1}: ${hit ? 'CACHE HIT' : 'CACHE MISS'}`);
  });

  // Get metrics
  const metrics = performanceMonitor.getMetrics();

  console.log('\n  Cache Metrics:');
  console.log('    Cache hits:', metrics.cache_hits);
  console.log('    Cache misses:', metrics.cache_misses);
  console.log('    Total:', metrics.cache_hits + metrics.cache_misses);
  console.log('    Hit rate:', ((metrics.cache_hits / (metrics.cache_hits + metrics.cache_misses)) * 100).toFixed(1), '%');

  console.log('\n  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 7: Cache hit rate calculation
 */
export function exampleCacheHitRate() {
  console.log('Example 7: Cache Hit Rate Calculation');
  console.log('-'.repeat(80));

  // Simulate different cache scenarios
  console.log('  Scenario 1: High cache hit rate (80%):\n');

  for (let i = 0; i < 100; i++) {
    performanceMonitor.recordCacheMetric(Math.random() < 0.8); // 80% hit rate
  }

  const hitRate1 = performanceMonitor.getCacheHitRate();
  console.log('    Cache hit rate:', (hitRate1 * 100).toFixed(1), '%');

  // Reset
  performanceMonitor.reset();

  console.log('\n  Scenario 2: Low cache hit rate (30%):\n');

  for (let i = 0; i < 100; i++) {
    performanceMonitor.recordCacheMetric(Math.random() < 0.3); // 30% hit rate
  }

  const hitRate2 = performanceMonitor.getCacheHitRate();
  console.log('    Cache hit rate:', (hitRate2 * 100).toFixed(1), '%');

  console.log('\n  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 8: Error tracking
 */
export function exampleErrorTracking() {
  console.log('Example 8: Error Tracking');
  console.log('-'.repeat(80));

  console.log('  Recording successful and failed queries:\n');

  // Simulate 20 queries with some failures
  const results = [
    { stage: 'end_to_end', duration: 145, success: true },
    { stage: 'end_to_end', duration: 167, success: true },
    { stage: 'end_to_end', duration: 0, success: false },    // Error
    { stage: 'end_to_end', duration: 134, success: true },
    { stage: 'end_to_end', duration: 189, success: true },
    { stage: 'end_to_end', duration: 0, success: false },    // Error
    { stage: 'end_to_end', duration: 156, success: true },
    { stage: 'end_to_end', duration: 142, success: true },
    { stage: 'end_to_end', duration: 178, success: true },
    { stage: 'end_to_end', duration: 0, success: false },    // Error
  ];

  results.forEach((result, i) => {
    performanceMonitor.recordMetric(result.stage, result.duration, result.success);
    console.log(`    Query ${i + 1}: ${result.success ? 'SUCCESS' : 'ERROR'} (${result.duration}ms)`);
  });

  // Get metrics
  const metrics = performanceMonitor.getMetrics();

  console.log('\n  Error Tracking:');
  console.log('    Total queries:', metrics.total_queries);
  console.log('    Successful queries:', metrics.total_queries - metrics.error_count);
  console.log('    Failed queries:', metrics.error_count);

  console.log('\n  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 9: Error rate calculation
 */
export function exampleErrorRate() {
  console.log('Example 9: Error Rate Calculation');
  console.log('-'.repeat(80));

  console.log('  Scenario 1: Healthy system (2% error rate):\n');

  for (let i = 0; i < 100; i++) {
    const success = Math.random() > 0.02; // 2% error rate
    performanceMonitor.recordMetric('end_to_end', success ? 150 + Math.random() * 50 : 0, success);
  }

  const errorRate1 = performanceMonitor.getErrorRate();
  console.log('    Error rate:', (errorRate1 * 100).toFixed(1), '%');

  // Reset
  performanceMonitor.reset();

  console.log('\n  Scenario 2: Degraded system (15% error rate):\n');

  for (let i = 0; i < 100; i++) {
    const success = Math.random() > 0.15; // 15% error rate
    performanceMonitor.recordMetric('end_to_end', success ? 150 + Math.random() * 50 : 0, success);
  }

  const errorRate2 = performanceMonitor.getErrorRate();
  console.log('    Error rate:', (errorRate2 * 100).toFixed(1), '%');

  console.log('\n  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 10: Slow query detection
 */
export function exampleSlowQueryDetection() {
  console.log('Example 10: Slow Query Detection');
  console.log('-'.repeat(80));

  console.log('  Recording queries with varying latencies:\n');

  // Simulate queries with some slow ones
  const latencies = [
    145, 167, 134, 189, 456, // 456ms is slow
    156, 142, 178, 198, 523, // 523ms is slow
    134, 156, 189, 678, 145, // 678ms is slow
    167, 134, 189, 156, 142,
  ];

  latencies.forEach((latency, i) => {
    performanceMonitor.recordMetric('end_to_end', latency);
    if (latency > 300) {
      console.log(`    Query ${i + 1}: ${latency}ms (SLOW)`);
    } else {
      console.log(`    Query ${i + 1}: ${latency}ms`);
    }
  });

  // Detect slow queries (threshold: 300ms)
  const slowQueries = performanceMonitor.getSlowQueries(300);

  console.log('\n  Slow Query Detection (threshold: 300ms):');
  console.log('    Total slow queries:', slowQueries.length);
  console.log('\n    Slow queries (sorted by duration):');

  slowQueries.forEach((query, i) => {
    console.log(`      ${i + 1}. ${query.duration_ms}ms`);
  });

  console.log('\n  ✅ Success (slow queries detected)\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 11: Metrics export
 */
export function exampleMetricsExport() {
  console.log('Example 11: Metrics Export');
  console.log('-'.repeat(80));

  console.log('  Recording metrics for export:\n');

  // Simulate 10 queries
  for (let i = 0; i < 10; i++) {
    performanceMonitor.recordMetric('query_understanding', 40 + Math.random() * 20);
    performanceMonitor.recordMetric('retrieval', 100 + Math.random() * 50);
    performanceMonitor.recordMetric('generation', 200 + Math.random() * 100);
    performanceMonitor.recordMetric('end_to_end', 350 + Math.random() * 150);

    // Some cache hits/misses
    performanceMonitor.recordCacheMetric(Math.random() > 0.3);
  }

  // Export metrics
  const exportData = performanceMonitor.exportMetrics();

  console.log('  Exported Metrics:\n');
  console.log('    Timestamp:', exportData.timestamp);
  console.log('\n    Summary:');
  console.log('      Total queries:', exportData.summary.total_queries);
  console.log('      Average latency:', exportData.summary.avg_latency.toFixed(2), 'ms');
  console.log('      p50:', exportData.summary.p50_latency, 'ms');
  console.log('      p95:', exportData.summary.p95_latency, 'ms');
  console.log('      p99:', exportData.summary.p99_latency, 'ms');
  console.log('      Cache hits:', exportData.summary.cache_hits);
  console.log('      Cache misses:', exportData.summary.cache_misses);

  console.log('\n    Stages:', exportData.stages.length, 'stages');
  exportData.stages.slice(0, 3).forEach(stage => {
    console.log(`      - ${stage.stage}: ${stage.avg_duration_ms.toFixed(2)}ms avg`);
  });

  console.log('\n  ✅ Success (metrics exported)\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 12: Cleanup
 */
export function exampleCleanup() {
  console.log('Example 12: Cleanup');
  console.log('-'.repeat(80));

  console.log('  Recording metrics:\n');

  // Record some metrics
  for (let i = 0; i < 10; i++) {
    performanceMonitor.recordMetric('end_to_end', 150 + Math.random() * 50);
  }

  console.log('  Before cleanup:');
  console.log('    Metric count:', performanceMonitor.getMetricCount());

  // Note: Cleanup happens automatically in checkLimit() and recordMetric()
  // Manual cleanup is not exposed as a public method

  console.log('\n  ✅ Success\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 13: Reset
 */
export function exampleReset() {
  console.log('Example 13: Reset');
  console.log('-'.repeat(80));

  // Record some metrics
  console.log('  Recording 20 metrics:\n');

  for (let i = 0; i < 20; i++) {
    performanceMonitor.recordMetric('end_to_end', 150 + Math.random() * 50);
    performanceMonitor.recordCacheMetric(Math.random() > 0.5);
  }

  console.log('  Before reset:');
  console.log('    Metric count:', performanceMonitor.getMetricCount());

  const beforeMetrics = performanceMonitor.getMetrics();
  console.log('    Total queries:', beforeMetrics.total_queries);
  console.log('    Cache hits:', beforeMetrics.cache_hits);
  console.log('    Cache misses:', beforeMetrics.cache_misses);

  // Reset
  performanceMonitor.reset();

  console.log('\n  After reset:');
  console.log('    Metric count:', performanceMonitor.getMetricCount());

  const afterMetrics = performanceMonitor.getMetrics();
  console.log('    Total queries:', afterMetrics.total_queries);
  console.log('    Cache hits:', afterMetrics.cache_hits);
  console.log('    Cache misses:', afterMetrics.cache_misses);

  console.log('\n  ✅ Success (all metrics cleared)\n');
}

/**
 * Example 14: Real-world pipeline scenario
 */
export function exampleRealWorldPipeline() {
  console.log('Example 14: Real-World Pipeline Scenario');
  console.log('-'.repeat(80));

  console.log('  Scenario: Patient health query pipeline\n');
  console.log('  Processing 10 queries through full pipeline:\n');

  for (let i = 1; i <= 10; i++) {
    // Simulate pipeline stages with realistic timings
    const timings = {
      query_understanding: 30 + Math.random() * 30,      // 30-60ms
      retrieval: 80 + Math.random() * 80,                // 80-160ms
      generation: 150 + Math.random() * 150,             // 150-300ms
      confidence_scoring: 8 + Math.random() * 12,        // 8-20ms
      provenance_formatting: 5 + Math.random() * 10,     // 5-15ms
      response_building: 2 + Math.random() * 5,          // 2-7ms
      audit_logging: 3 + Math.random() * 7,              // 3-10ms
    };

    // Calculate end-to-end
    const endToEnd = Object.values(timings).reduce((sum, t) => sum + t, 0);

    // Record all stages
    Object.entries(timings).forEach(([stage, duration]) => {
      performanceMonitor.recordMetric(stage, duration);
    });
    performanceMonitor.recordMetric('end_to_end', endToEnd);

    // Cache behavior (40% hit rate for repeated queries)
    performanceMonitor.recordCacheMetric(Math.random() < 0.4);

    // Occasional errors (5% error rate)
    const success = Math.random() > 0.05;
    if (!success) {
      performanceMonitor.recordMetric('end_to_end', 0, false);
    }

    console.log(`    Query ${i}: ${endToEnd.toFixed(0)}ms ${success ? '' : '(ERROR)'}`);
  }

  // Get comprehensive metrics
  const metrics = performanceMonitor.getMetrics();
  const stages = performanceMonitor.getStageBreakdown();
  const slowQueries = performanceMonitor.getSlowQueries(400);
  const cacheHitRate = performanceMonitor.getCacheHitRate();
  const errorRate = performanceMonitor.getErrorRate();

  console.log('\n  Performance Summary:');
  console.log('    Total queries:', metrics.total_queries);
  console.log('    Average latency:', metrics.avg_latency.toFixed(2), 'ms');
  console.log('    p50:', metrics.p50_latency, 'ms');
  console.log('    p95:', metrics.p95_latency, 'ms');
  console.log('    p99:', metrics.p99_latency, 'ms');

  console.log('\n  Slowest Stages:');
  stages.slice(0, 3).forEach((stage, i) => {
    console.log(`    ${i + 1}. ${stage.stage}: ${stage.avg_duration_ms.toFixed(2)}ms avg`);
  });

  console.log('\n  Cache Performance:');
  console.log('    Hit rate:', (cacheHitRate * 100).toFixed(1), '%');
  console.log('    Hits:', metrics.cache_hits);
  console.log('    Misses:', metrics.cache_misses);

  console.log('\n  Reliability:');
  console.log('    Error rate:', (errorRate * 100).toFixed(1), '%');
  console.log('    Errors:', metrics.error_count);

  console.log('\n  Slow Queries:');
  console.log('    Count (>400ms):', slowQueries.length);

  console.log('\n  ✅ Success (real-world scenario)\n');

  // Reset for next example
  performanceMonitor.reset();
}

/**
 * Example 15: Explain performance monitor
 */
export function exampleExplain() {
  console.log('Example 15: Explain Performance Monitor');
  console.log('-'.repeat(80));

  const explanation = performanceMonitor.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('PERFORMANCE MONITOR EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicRecording();
    examplePerformanceMetrics();
    exampleStageBreakdown();
    examplePercentileCalculation();
    await exampleTimeWindowFiltering();
    exampleCacheMetrics();
    exampleCacheHitRate();
    exampleErrorTracking();
    exampleErrorRate();
    exampleSlowQueryDetection();
    exampleMetricsExport();
    exampleCleanup();
    exampleReset();
    exampleRealWorldPipeline();
    exampleExplain();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
