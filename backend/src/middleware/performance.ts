/**
 * Performance Monitoring Middleware
 * Tracks operation metrics for caching and API performance
 */

interface PerformanceMetric {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  errors: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  /**
   * Track an async operation's performance
   */
  async track<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.record(name, Date.now() - start, false);
      return result;
    } catch (error) {
      this.record(name, Date.now() - start, true);
      throw error;
    }
  }

  /**
   * Track a synchronous operation's performance
   */
  trackSync<T>(name: string, fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      this.record(name, Date.now() - start, false);
      return result;
    } catch (error) {
      this.record(name, Date.now() - start, true);
      throw error;
    }
  }

  private record(name: string, duration: number, isError: boolean) {
    const existing = this.metrics.get(name) || {
      count: 0,
      totalMs: 0,
      minMs: Infinity,
      maxMs: 0,
      errors: 0
    };

    this.metrics.set(name, {
      count: existing.count + 1,
      totalMs: existing.totalMs + duration,
      minMs: Math.min(existing.minMs, duration),
      maxMs: Math.max(existing.maxMs, duration),
      errors: existing.errors + (isError ? 1 : 0)
    });
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const stats = [];
    for (const [name, metric] of this.metrics.entries()) {
      stats.push({
        operation: name,
        count: metric.count,
        avg_ms: Math.round(metric.totalMs / metric.count),
        min_ms: metric.minMs === Infinity ? 0 : metric.minMs,
        max_ms: metric.maxMs,
        errors: metric.errors,
        success_rate: ((metric.count - metric.errors) / metric.count * 100).toFixed(1) + '%'
      });
    }
    return stats.sort((a, b) => b.avg_ms - a.avg_ms);
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
  }
}

// Export singleton
export const perfMon = new PerformanceMonitor();
