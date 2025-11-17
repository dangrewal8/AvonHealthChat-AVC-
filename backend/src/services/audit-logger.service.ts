/**
 * Audit Logger Service
 *
 * Tracks all queries and responses for compliance, debugging, and analytics.
 *
 * Features:
 * - Query and response logging
 * - In-memory storage for fast access
 * - Append-only file logging for persistence
 * - Query history retrieval
 * - Search and filtering
 * - Export (JSON/CSV)
 * - Privacy and retention policies
 *
 */

import * as fs from 'fs';
import * as path from 'path';
import { UIResponse } from './ui-response-builder.service';
import { QueryMetrics } from './ui-response-builder.service';

/**
 * Query request interface
 */
export interface QueryRequest {
  query_id: string;
  patient_id: string;
  query_text: string;
  user_id?: string;
  session_id?: string;
  timestamp?: string;
}

/**
 * Audit entry for logging
 */
export interface AuditEntry {
  query_id: string; // Unique query identifier
  timestamp: string; // ISO timestamp
  patient_id: string; // Patient ID
  query_text: string; // Original query text
  response_summary: string; // Short summary of response
  sources_used: string[]; // Source artifact IDs
  confidence_score: number; // Confidence score (0-1)
  total_time_ms: number; // Total processing time
  success: boolean; // Whether query succeeded
  error?: string; // Error message if failed
  user_id?: string; // User who made the query
  session_id?: string; // Session identifier
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  start_date: string; // ISO timestamp
  end_date: string; // ISO timestamp
}

/**
 * Search filter options
 */
export interface SearchOptions {
  patient_id?: string;
  query_text?: string; // Search in query text
  date_range?: DateRangeFilter;
  min_confidence?: number;
  max_confidence?: number;
  success_only?: boolean;
  limit?: number;
}

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  retention_days: number; // Days to keep audit entries
  auto_cleanup: boolean; // Auto-delete old entries
  anonymize_after_days?: number; // Days after which to anonymize
}

/**
 * Audit Logger Class
 *
 * Logs all queries and responses for compliance and debugging
 */
class AuditLogger {
  /**
   * In-memory storage (for demo and fast access)
   */
  private entries: AuditEntry[] = [];

  /**
   * File path for append-only log
   */
  private readonly logFilePath: string;

  /**
   * Retention policy
   */
  private retentionPolicy: RetentionPolicy = {
    retention_days: 90, // 90 days default
    auto_cleanup: true,
    anonymize_after_days: 30, // Anonymize after 30 days
  };

  /**
   * Max in-memory entries
   */
  private readonly MAX_IN_MEMORY = 10000;

  constructor() {
    // Set log file path
    const logDir = process.env.AUDIT_LOG_DIR || path.join(process.cwd(), 'logs');
    this.logFilePath = path.join(logDir, 'audit.log');

    // Ensure log directory exists
    this.ensureLogDirectory();

    // Load existing entries from file (if any)
    this.loadEntriesFromFile();

    // Start auto-cleanup if enabled
    if (this.retentionPolicy.auto_cleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Log a query and its response
   *
   * @param request - Query request
   * @param response - UI response (or null if failed)
   * @param metrics - Query metrics
   * @param error - Error message if query failed
   */
  async logQuery(
    request: QueryRequest,
    response: UIResponse | null,
    metrics: QueryMetrics,
    error?: string
  ): Promise<void> {
    const entry: AuditEntry = {
      query_id: request.query_id,
      timestamp: request.timestamp || new Date().toISOString(),
      patient_id: request.patient_id,
      query_text: request.query_text,
      response_summary: response ? response.short_answer : 'Query failed',
      sources_used: response
        ? response.provenance.map(p => p.artifact_id)
        : [],
      confidence_score: response ? response.confidence.score : 0,
      total_time_ms: metrics.total_time_ms,
      success: !error && response !== null,
      error: error,
      user_id: request.user_id,
      session_id: request.session_id,
    };

    // Add to in-memory storage
    this.entries.push(entry);

    // Limit in-memory size
    if (this.entries.length > this.MAX_IN_MEMORY) {
      this.entries = this.entries.slice(-this.MAX_IN_MEMORY);
    }

    // Write to file (append-only)
    await this.writeToFile(entry);
  }

  /**
   * Get query history for a patient
   *
   * @param patientId - Patient ID
   * @param limit - Max number of entries to return
   * @returns Array of audit entries
   */
  async getQueryHistory(patientId: string, limit: number = 100): Promise<AuditEntry[]> {
    const filtered = this.entries.filter(entry => entry.patient_id === patientId);

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    return filtered.slice(0, limit);
  }

  /**
   * Search query history with filters
   *
   * @param options - Search options
   * @returns Filtered audit entries
   */
  async searchQueries(options: SearchOptions): Promise<AuditEntry[]> {
    let results = [...this.entries];

    // Filter by patient ID
    if (options.patient_id) {
      results = results.filter(entry => entry.patient_id === options.patient_id);
    }

    // Filter by query text (case-insensitive substring match)
    if (options.query_text) {
      const searchText = options.query_text.toLowerCase();
      results = results.filter(entry =>
        entry.query_text.toLowerCase().includes(searchText)
      );
    }

    // Filter by date range
    if (options.date_range) {
      const startTime = new Date(options.date_range.start_date).getTime();
      const endTime = new Date(options.date_range.end_date).getTime();
      results = results.filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        return entryTime >= startTime && entryTime <= endTime;
      });
    }

    // Filter by confidence score range
    if (options.min_confidence !== undefined) {
      results = results.filter(entry => entry.confidence_score >= options.min_confidence!);
    }
    if (options.max_confidence !== undefined) {
      results = results.filter(entry => entry.confidence_score <= options.max_confidence!);
    }

    // Filter by success status
    if (options.success_only) {
      results = results.filter(entry => entry.success);
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Filter entries by date range
   *
   * @param startDate - Start date (ISO)
   * @param endDate - End date (ISO)
   * @returns Filtered entries
   */
  async filterByDateRange(startDate: string, endDate: string): Promise<AuditEntry[]> {
    return this.searchQueries({
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  /**
   * Export audit entries
   *
   * @param format - Export format ('json' or 'csv')
   * @param options - Optional search options to filter entries
   * @returns Formatted string
   */
  async export(format: 'json' | 'csv', options?: SearchOptions): Promise<string> {
    // Get entries to export
    const entries = options ? await this.searchQueries(options) : this.entries;

    if (format === 'json') {
      return this.exportJSON(entries);
    } else if (format === 'csv') {
      return this.exportCSV(entries);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export as JSON
   *
   * @param entries - Entries to export
   * @returns JSON string
   */
  private exportJSON(entries: AuditEntry[]): string {
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Export as CSV
   *
   * @param entries - Entries to export
   * @returns CSV string
   */
  private exportCSV(entries: AuditEntry[]): string {
    if (entries.length === 0) {
      return '';
    }

    // CSV header
    const headers = [
      'query_id',
      'timestamp',
      'patient_id',
      'query_text',
      'response_summary',
      'sources_used',
      'confidence_score',
      'total_time_ms',
      'success',
      'error',
      'user_id',
      'session_id',
    ];

    let csv = headers.join(',') + '\n';

    // CSV rows
    entries.forEach(entry => {
      const row = [
        this.escapeCSV(entry.query_id),
        this.escapeCSV(entry.timestamp),
        this.escapeCSV(entry.patient_id),
        this.escapeCSV(entry.query_text),
        this.escapeCSV(entry.response_summary),
        this.escapeCSV(entry.sources_used.join('; ')),
        entry.confidence_score.toString(),
        entry.total_time_ms.toString(),
        entry.success.toString(),
        this.escapeCSV(entry.error || ''),
        this.escapeCSV(entry.user_id || ''),
        this.escapeCSV(entry.session_id || ''),
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Escape CSV field
   *
   * @param field - Field value
   * @returns Escaped field
   */
  private escapeCSV(field: string): string {
    // Wrap in quotes if contains comma, newline, or quote
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Get total number of entries
   *
   * @returns Total count
   */
  getTotalCount(): number {
    return this.entries.length;
  }

  /**
   * Get statistics
   *
   * @returns Audit statistics
   */
  getStatistics() {
    const total = this.entries.length;
    const successful = this.entries.filter(e => e.success).length;
    const failed = total - successful;

    const avgConfidence =
      this.entries.reduce((sum, e) => sum + e.confidence_score, 0) / total || 0;
    const avgTime =
      this.entries.reduce((sum, e) => sum + e.total_time_ms, 0) / total || 0;

    const uniquePatients = new Set(this.entries.map(e => e.patient_id)).size;
    const uniqueUsers = new Set(
      this.entries.map(e => e.user_id).filter(Boolean)
    ).size;

    return {
      total_queries: total,
      successful_queries: successful,
      failed_queries: failed,
      success_rate: total > 0 ? (successful / total) * 100 : 0,
      avg_confidence_score: avgConfidence,
      avg_processing_time_ms: avgTime,
      unique_patients: uniquePatients,
      unique_users: uniqueUsers,
      date_range: {
        earliest: this.entries.length > 0 ? this.entries[0].timestamp : null,
        latest:
          this.entries.length > 0
            ? this.entries[this.entries.length - 1].timestamp
            : null,
      },
    };
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Set retention policy
   *
   * @param policy - Retention policy
   */
  setRetentionPolicy(policy: Partial<RetentionPolicy>): void {
    this.retentionPolicy = {
      ...this.retentionPolicy,
      ...policy,
    };
  }

  /**
   * Apply retention policy
   *
   * Removes entries older than retention period
   */
  applyRetentionPolicy(): void {
    const now = new Date();
    const cutoffDate = new Date(
      now.getTime() - this.retentionPolicy.retention_days * 24 * 60 * 60 * 1000
    );

    const beforeCount = this.entries.length;
    this.entries = this.entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= cutoffDate;
    });
    const afterCount = this.entries.length;

    console.log(
      `[AuditLogger] Retention policy applied: Removed ${beforeCount - afterCount} entries older than ${this.retentionPolicy.retention_days} days`
    );
  }

  /**
   * Anonymize old entries
   *
   * Removes PII from entries older than anonymization threshold
   */
  anonymizeOldEntries(): void {
    if (!this.retentionPolicy.anonymize_after_days) {
      return;
    }

    const now = new Date();
    const cutoffDate = new Date(
      now.getTime() -
        this.retentionPolicy.anonymize_after_days * 24 * 60 * 60 * 1000
    );

    let anonymizedCount = 0;
    this.entries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate < cutoffDate) {
        // Anonymize PII
        entry.patient_id = this.hashId(entry.patient_id);
        entry.user_id = entry.user_id ? this.hashId(entry.user_id) : undefined;
        entry.session_id = entry.session_id
          ? this.hashId(entry.session_id)
          : undefined;
        entry.query_text = '[ANONYMIZED]';
        entry.response_summary = '[ANONYMIZED]';
        anonymizedCount++;
      }
    });

    if (anonymizedCount > 0) {
      console.log(
        `[AuditLogger] Anonymized ${anonymizedCount} entries older than ${this.retentionPolicy.anonymize_after_days} days`
      );
    }
  }

  /**
   * Hash ID for anonymization
   *
   * @param id - ID to hash
   * @returns Hashed ID
   */
  private hashId(id: string): string {
    // Simple hash for demo (use crypto in production)
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `anon_${Math.abs(hash)}`;
  }

  /**
   * Start auto-cleanup timer
   */
  private startAutoCleanup(): void {
    // Run cleanup every 24 hours
    setInterval(
      () => {
        this.applyRetentionPolicy();
        this.anonymizeOldEntries();
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Write entry to append-only file
   *
   * @param entry - Audit entry
   */
  private async writeToFile(entry: AuditEntry): Promise<void> {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, line, 'utf8');
    } catch (error) {
      console.error('[AuditLogger] Failed to write to file:', error);
    }
  }

  /**
   * Load entries from file
   */
  private loadEntriesFromFile(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return;
      }

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        try {
          const entry = JSON.parse(line) as AuditEntry;
          this.entries.push(entry);
        } catch (error) {
          console.error('[AuditLogger] Failed to parse log entry:', error);
        }
      });

      // Limit in-memory size
      if (this.entries.length > this.MAX_IN_MEMORY) {
        this.entries = this.entries.slice(-this.MAX_IN_MEMORY);
      }

      console.log(`[AuditLogger] Loaded ${this.entries.length} entries from file`);
    } catch (error) {
      console.error('[AuditLogger] Failed to load entries from file:', error);
    }
  }

  /**
   * Get log file path
   *
   * @returns Log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * Explain audit logger
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Audit Logger Process:

1. Query Logging
   - Capture query request, response, and metrics
   - Store in-memory for fast access
   - Append to file for persistence
   - Track success/failure

2. Storage
   - In-memory: Last ${this.MAX_IN_MEMORY.toLocaleString()} entries
   - File: Append-only log at ${this.logFilePath}
   - Format: JSON lines (one entry per line)

3. Query History
   - Get recent queries by patient
   - Search by query text, date range, confidence
   - Filter by success status
   - Sort by timestamp (most recent first)

4. Export
   - JSON: Full structured export
   - CSV: Spreadsheet-compatible format

5. Privacy & Retention
   - Retention: ${this.retentionPolicy.retention_days} days
   - Anonymization: After ${this.retentionPolicy.anonymize_after_days || 'N/A'} days
   - Auto-cleanup: ${this.retentionPolicy.auto_cleanup ? 'Enabled' : 'Disabled'}

6. Statistics
   - Total queries, success rate
   - Average confidence, processing time
   - Unique patients, users

Current Status:
- Total entries: ${this.entries.length}
- Log file: ${this.logFilePath}`;
  }
}

// Export singleton instance
const auditLogger = new AuditLogger();
export default auditLogger;
