/**
 * PHASE 3: Production Monitoring Service
 * Logs all queries, responses, and hallucination metrics
 * Provides analytics and continuous improvement
 */

import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface QueryLog {
  query_id: string;
  timestamp: Date;
  patient_id: string;
  query: string;
  short_answer: string;
  processing_time_ms: number;

  // Hallucination metrics
  validation_applied: boolean;
  hallucination_issues: number;
  validation_confidence: number;
  citation_accuracy: number;
  unsupported_claims_count: number;
  guardrails_passed: boolean;

  // Model info
  model_used: string;
  reasoning_method: string;
}

interface HallucinationMetrics {
  total_queries: number;
  queries_with_hallucinations: number;
  hallucination_rate: number;
  avg_citation_accuracy: number;
  avg_validation_confidence: number;
  guardrails_failures: number;

  // Breakdown by type
  by_model: Record<string, { queries: number; hallucinations: number }>;
  by_query_type: Record<string, { queries: number; hallucinations: number }>;

  // Trends
  daily_hallucination_rate: Array<{ date: string; rate: number }>;
}

export class MonitoringService {
  private logsDir: string;
  private metricsCache: HallucinationMetrics | null = null;
  private cacheTTL = 300000; // 5 minutes
  private lastCacheUpdate = 0;

  constructor(logsDir: string = './logs/queries') {
    this.logsDir = logsDir;
    this.ensureLogsDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Log a query with all hallucination prevention metrics
   */
  async logQuery(log: QueryLog): Promise<void> {
    try {
      const logEntry = {
        ...log,
        timestamp: log.timestamp.toISOString(),
      };

      // Append to daily log file
      const dateStr = log.timestamp.toISOString().split('T')[0];
      const logFile = path.join(this.logsDir, `queries_${dateStr}.jsonl`);

      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

      // Invalidate metrics cache
      this.metricsCache = null;

      logger.info('Query logged for monitoring', {
        query_id: log.query_id,
        hallucination_issues: log.hallucination_issues,
        citation_accuracy: log.citation_accuracy,
      });
    } catch (error: any) {
      logger.error('Failed to log query:', error.message);
    }
  }

  /**
   * Calculate hallucination metrics from logs
   */
  async calculateMetrics(daysSince: number = 7): Promise<HallucinationMetrics> {
    // Check cache
    const now = Date.now();
    if (this.metricsCache && (now - this.lastCacheUpdate) < this.cacheTTL) {
      return this.metricsCache;
    }

    const logs = await this.readLogs(daysSince);

    const metrics: HallucinationMetrics = {
      total_queries: logs.length,
      queries_with_hallucinations: 0,
      hallucination_rate: 0,
      avg_citation_accuracy: 0,
      avg_validation_confidence: 0,
      guardrails_failures: 0,
      by_model: {},
      by_query_type: {},
      daily_hallucination_rate: [],
    };

    if (logs.length === 0) {
      this.metricsCache = metrics;
      this.lastCacheUpdate = now;
      return metrics;
    }

    let totalCitationAccuracy = 0;
    let totalValidationConfidence = 0;

    // Aggregate metrics
    for (const log of logs) {
      // Count hallucinations (issues found > 0)
      if (log.hallucination_issues > 0) {
        metrics.queries_with_hallucinations++;
      }

      totalCitationAccuracy += log.citation_accuracy;
      totalValidationConfidence += log.validation_confidence;

      if (!log.guardrails_passed) {
        metrics.guardrails_failures++;
      }

      // By model
      if (!metrics.by_model[log.model_used]) {
        metrics.by_model[log.model_used] = { queries: 0, hallucinations: 0 };
      }
      metrics.by_model[log.model_used].queries++;
      if (log.hallucination_issues > 0) {
        metrics.by_model[log.model_used].hallucinations++;
      }

      // By reasoning method (as proxy for query type)
      if (!metrics.by_query_type[log.reasoning_method]) {
        metrics.by_query_type[log.reasoning_method] = { queries: 0, hallucinations: 0 };
      }
      metrics.by_query_type[log.reasoning_method].queries++;
      if (log.hallucination_issues > 0) {
        metrics.by_query_type[log.reasoning_method].hallucinations++;
      }
    }

    metrics.hallucination_rate = metrics.queries_with_hallucinations / metrics.total_queries;
    metrics.avg_citation_accuracy = totalCitationAccuracy / metrics.total_queries;
    metrics.avg_validation_confidence = totalValidationConfidence / metrics.total_queries;

    // Calculate daily trends
    const dailyLogs = this.groupByDay(logs);
    metrics.daily_hallucination_rate = dailyLogs.map(day => ({
      date: day.date,
      rate: day.hallucinations / day.total,
    }));

    this.metricsCache = metrics;
    this.lastCacheUpdate = now;

    return metrics;
  }

  /**
   * Read query logs from files
   */
  private async readLogs(daysSince: number): Promise<QueryLog[]> {
    const logs: QueryLog[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);

    try {
      const files = fs.readdirSync(this.logsDir);

      for (const file of files) {
        if (!file.startsWith('queries_') || !file.endsWith('.jsonl')) continue;

        const dateStr = file.replace('queries_', '').replace('.jsonl', '');
        const fileDate = new Date(dateStr);

        if (fileDate >= cutoffDate) {
          const filePath = path.join(this.logsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          const lines = content.trim().split('\n');
          for (const line of lines) {
            try {
              const log = JSON.parse(line);
              log.timestamp = new Date(log.timestamp);
              logs.push(log);
            } catch (error) {
              logger.warn(`Failed to parse log line: ${line.substring(0, 100)}`);
            }
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to read logs:', error.message);
    }

    return logs;
  }

  /**
   * Group logs by day
   */
  private groupByDay(logs: QueryLog[]): Array<{ date: string; total: number; hallucinations: number }> {
    const grouped: Record<string, { total: number; hallucinations: number }> = {};

    for (const log of logs) {
      const dateStr = log.timestamp.toISOString().split('T')[0];

      if (!grouped[dateStr]) {
        grouped[dateStr] = { total: 0, hallucinations: 0 };
      }

      grouped[dateStr].total++;
      if (log.hallucination_issues > 0) {
        grouped[dateStr].hallucinations++;
      }
    }

    return Object.entries(grouped).map(([date, stats]) => ({ date, ...stats }));
  }

  /**
   * Get alert status (triggers if hallucination rate exceeds threshold)
   */
  async getAlerts(): Promise<Array<{ severity: string; message: string; metric: number }>> {
    const metrics = await this.calculateMetrics();
    const alerts: Array<{ severity: string; message: string; metric: number }> = [];

    // Alert thresholds from plan
    if (metrics.hallucination_rate > 0.05) {
      alerts.push({
        severity: 'critical',
        message: `Hallucination rate exceeds 5%`,
        metric: metrics.hallucination_rate,
      });
    }

    if (metrics.avg_citation_accuracy < 0.9) {
      alerts.push({
        severity: 'warning',
        message: `Citation accuracy below 90%`,
        metric: metrics.avg_citation_accuracy,
      });
    }

    if (metrics.guardrails_failures > 10) {
      alerts.push({
        severity: 'warning',
        message: `Multiple guardrails failures (${metrics.guardrails_failures})`,
        metric: metrics.guardrails_failures,
      });
    }

    return alerts;
  }

  /**
   * Generate weekly summary report
   */
  async generateWeeklyReport(): Promise<string> {
    const metrics = await this.calculateMetrics(7);

    const report = `
# Hallucination Prevention - Weekly Report
Generated: ${new Date().toISOString()}

## Summary
- Total queries: ${metrics.total_queries}
- Hallucination rate: ${(metrics.hallucination_rate * 100).toFixed(2)}%
- Average citation accuracy: ${(metrics.avg_citation_accuracy * 100).toFixed(1)}%
- Average validation confidence: ${(metrics.avg_validation_confidence * 100).toFixed(1)}%
- Guardrails failures: ${metrics.guardrails_failures}

## By Model
${Object.entries(metrics.by_model).map(([model, stats]) =>
  `- ${model}: ${stats.queries} queries, ${((stats.hallucinations / stats.queries) * 100).toFixed(1)}% hallucination rate`
).join('\n')}

## By Query Type
${Object.entries(metrics.by_query_type).map(([type, stats]) =>
  `- ${type}: ${stats.queries} queries, ${((stats.hallucinations / stats.queries) * 100).toFixed(1)}% hallucination rate`
).join('\n')}

## Daily Trend
${metrics.daily_hallucination_rate.map(day =>
  `- ${day.date}: ${(day.rate * 100).toFixed(1)}% hallucination rate`
).join('\n')}
`;

    return report;
  }
}

export const monitoringService = new MonitoringService();
