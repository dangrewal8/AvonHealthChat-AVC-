/**
 * Metrics Controller
 * Provides performance and usage metrics for monitoring
 */

import { Request, Response } from 'express';
import { MetricsResponse, RequestMetrics, CacheMetrics, PerformanceMetrics } from '../types/api.types';
import emrService from '../services/emr.service';

const startTime = Date.now();

/**
 * In-memory metrics storage
 * This is a simple implementation - production would use a proper metrics system
 */
class MetricsStore {
  private requestCount = 0;
  private requestsByEndpoint: Map<string, number> = new Map();
  private requestsByStatus: Map<number, number> = new Map();
  private responseTimes: number[] = [];
  private queryTimes: number[] = [];
  private retrievalTimes: number[] = [];
  private generationTimes: number[] = [];

  recordRequest(endpoint: string, status: number, responseTime: number): void {
    this.requestCount++;

    // Track by endpoint
    const current = this.requestsByEndpoint.get(endpoint) || 0;
    this.requestsByEndpoint.set(endpoint, current + 1);

    // Track by status
    const statusCount = this.requestsByStatus.get(status) || 0;
    this.requestsByStatus.set(status, statusCount + 1);

    // Track response times (keep last 1000)
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  recordQueryTime(time: number): void {
    this.queryTimes.push(time);
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }
  }

  recordRetrievalTime(time: number): void {
    this.retrievalTimes.push(time);
    if (this.retrievalTimes.length > 1000) {
      this.retrievalTimes.shift();
    }
  }

  recordGenerationTime(time: number): void {
    this.generationTimes.push(time);
    if (this.generationTimes.length > 1000) {
      this.generationTimes.shift();
    }
  }

  getRequestMetrics(): RequestMetrics {
    const byEndpoint: Record<string, number> = {};
    this.requestsByEndpoint.forEach((count, endpoint) => {
      byEndpoint[endpoint] = count;
    });

    const byStatus: Record<number, number> = {};
    this.requestsByStatus.forEach((count, status) => {
      byStatus[status] = count;
    });

    const avgResponseTime =
      this.responseTimes.length > 0
        ? Math.round(
            this.responseTimes.reduce((sum, t) => sum + t, 0) / this.responseTimes.length
          )
        : 0;

    return {
      total: this.requestCount,
      by_endpoint: byEndpoint,
      by_status: byStatus,
      average_response_time_ms: avgResponseTime,
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((sum, t) => sum + t, 0) / arr.length) : 0;

    const percentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return Math.round(sorted[index] || 0);
    };

    return {
      average_query_time_ms: avg(this.queryTimes),
      average_retrieval_time_ms: avg(this.retrievalTimes),
      average_generation_time_ms: avg(this.generationTimes),
      p95_query_time_ms: percentile(this.queryTimes, 95),
      p99_query_time_ms: percentile(this.queryTimes, 99),
    };
  }

  getCacheMetrics(): CacheMetrics {
    // Get cache stats from EMR service
    const stats = emrService.getCacheStats();

    // Calculate metrics (placeholder - actual implementation would track hits/misses)
    return {
      hits: 0, // TODO: Track cache hits
      misses: 0, // TODO: Track cache misses
      hit_rate: 0, // TODO: Calculate hit rate
      size: stats.size,
      evictions: 0, // TODO: Track evictions
    };
  }
}

// Global metrics store instance
const metricsStore = new MetricsStore();

class MetricsController {
  /**
   * GET /api/metrics
   * Returns current performance and usage metrics
   */
  get(_req: Request, res: Response<MetricsResponse>): void {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - startTime) / 1000);

    res.json({
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      requests: metricsStore.getRequestMetrics(),
      cache: metricsStore.getCacheMetrics(),
      performance: metricsStore.getPerformanceMetrics(),
    });
  }

  /**
   * Middleware to track request metrics
   */
  trackRequest(req: Request, res: Response, next: Function): void {
    const startTime = Date.now();

    // Track response when it finishes
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const endpoint = `${req.method} ${req.path}`;
      const status = res.statusCode;

      metricsStore.recordRequest(endpoint, status, responseTime);
    });

    next();
  }

  /**
   * Record query processing time
   */
  recordQueryTime(time: number): void {
    metricsStore.recordQueryTime(time);
  }

  /**
   * Record retrieval time
   */
  recordRetrievalTime(time: number): void {
    metricsStore.recordRetrievalTime(time);
  }

  /**
   * Record generation time
   */
  recordGenerationTime(time: number): void {
    metricsStore.recordGenerationTime(time);
  }
}

export const metricsController = new MetricsController();
export default metricsController;
