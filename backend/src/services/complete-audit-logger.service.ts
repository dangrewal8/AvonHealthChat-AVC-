/**
 * Complete Audit Logger Service
 *
 * Comprehensive audit logging per ChatGPT specification.
 * Includes: user_id, patient_id, query_text, retrieved artifact_ids,
 * LLM prompt, LLM response, timestamp, model version.
 *
 * Features:
 * - Complete LLM interaction logging
 * - Append-only file storage
 * - Privacy controls for PHI
 * - Query and export capabilities
 * - Compliance-ready audit trail
 *
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * LLM interaction details
 */
export interface LLMInteraction {
  prompt: string; // Full LLM prompt
  response: string; // Full LLM response
  model: string; // Model name (e.g., "meditron")
  model_version?: string; // Model version
  temperature?: number; // Temperature setting
  max_tokens?: number; // Max tokens setting
  tokens_used?: number; // Total tokens consumed
  prompt_tokens?: number; // Prompt tokens
  completion_tokens?: number; // Completion tokens
  latency_ms?: number; // LLM API latency
}

/**
 * Retrieval details
 */
export interface RetrievalDetails {
  artifact_ids: string[]; // Retrieved artifact IDs
  chunk_ids?: string[]; // Retrieved chunk IDs
  relevance_scores?: number[]; // Relevance scores
  retrieval_time_ms?: number; // Retrieval time
  retrieval_method?: string; // Method used (e.g., "vector_search")
}

/**
 * Complete audit entry (per ChatGPT specification)
 */
export interface CompleteAuditEntry {
  // Core identifiers
  query_id: string; // Unique query identifier
  timestamp: string; // ISO timestamp
  user_id: string; // User who made the query
  patient_id: string; // Patient being queried

  // Query details
  query_text: string; // Original query text
  query_intent?: string; // Detected intent

  // Retrieval details
  retrieval: RetrievalDetails;

  // LLM interaction
  llm_interaction: LLMInteraction;

  // Response details
  response_summary: string; // Short response summary
  confidence_score?: number; // Confidence score
  success: boolean; // Whether query succeeded
  error?: string; // Error message if failed

  // Performance metrics
  total_time_ms: number; // Total processing time

  // Audit metadata
  session_id?: string; // Session identifier
  ip_address?: string; // Client IP address
  user_agent?: string; // Client user agent
  pipeline_version?: string; // RAG pipeline version
}

/**
 * Privacy mode for sensitive data
 */
export enum PrivacyMode {
  FULL = 'full', // Include all data
  REDACTED = 'redacted', // Redact PHI from prompts/responses
  MINIMAL = 'minimal', // Only include IDs and metadata
}

/**
 * Query filter options
 */
export interface CompleteAuditQueryOptions {
  user_id?: string;
  patient_id?: string;
  query_id?: string;
  start_date?: string; // ISO timestamp
  end_date?: string; // ISO timestamp
  success_only?: boolean;
  model?: string;
  limit?: number;
  privacy_mode?: PrivacyMode;
}

/**
 * Complete Audit Logger Class
 *
 * Comprehensive audit logging with LLM interaction details
 */
class CompleteAuditLogger {
  /**
   * In-memory cache (for fast access)
   */
  private entries: CompleteAuditEntry[] = [];

  /**
   * Audit log file path
   */
  private readonly logFilePath: string;

  /**
   * Max in-memory entries
   */
  private readonly MAX_IN_MEMORY = 1000;

  /**
   * Privacy mode
   */
  private privacyMode: PrivacyMode = PrivacyMode.FULL;

  constructor() {
    // Set log file path
    const logDir = process.env.COMPLETE_AUDIT_LOG_DIR || path.join(process.cwd(), 'logs');
    this.logFilePath = path.join(logDir, 'complete-audit.log');

    // Ensure log directory exists
    this.ensureLogDirectory();

    // Load recent entries from file
    this.loadRecentEntries();
  }

  /**
   * Log complete audit entry
   *
   * @param entry - Complete audit entry
   */
  async logComplete(entry: CompleteAuditEntry): Promise<void> {
    // Validate required fields
    this.validateEntry(entry);

    // Add to in-memory cache
    this.entries.push(entry);

    // Limit in-memory size (FIFO)
    if (this.entries.length > this.MAX_IN_MEMORY) {
      this.entries = this.entries.slice(-this.MAX_IN_MEMORY);
    }

    // Write to append-only file
    await this.writeToFile(entry);

    // Log to console
    this.logToConsole(entry);
  }

  /**
   * Query audit entries
   *
   * @param options - Query options
   * @returns Filtered audit entries
   */
  async query(options: CompleteAuditQueryOptions = {}): Promise<CompleteAuditEntry[]> {
    let results = [...this.entries];

    // Filter by user_id
    if (options.user_id) {
      results = results.filter(e => e.user_id === options.user_id);
    }

    // Filter by patient_id
    if (options.patient_id) {
      results = results.filter(e => e.patient_id === options.patient_id);
    }

    // Filter by query_id
    if (options.query_id) {
      results = results.filter(e => e.query_id === options.query_id);
    }

    // Filter by date range
    if (options.start_date) {
      const startTime = new Date(options.start_date).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= startTime);
    }
    if (options.end_date) {
      const endTime = new Date(options.end_date).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= endTime);
    }

    // Filter by success status
    if (options.success_only) {
      results = results.filter(e => e.success);
    }

    // Filter by model
    if (options.model) {
      results = results.filter(e => e.llm_interaction.model === options.model);
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    // Apply privacy mode
    if (options.privacy_mode) {
      results = results.map(e => this.applyPrivacyMode(e, options.privacy_mode!));
    }

    return results;
  }

  /**
   * Get single audit entry by query_id
   *
   * @param queryId - Query ID
   * @param privacyMode - Privacy mode
   * @returns Audit entry or null
   */
  async getByQueryId(queryId: string, privacyMode?: PrivacyMode): Promise<CompleteAuditEntry | null> {
    const entry = this.entries.find(e => e.query_id === queryId);

    if (!entry) {
      return null;
    }

    return privacyMode ? this.applyPrivacyMode(entry, privacyMode) : entry;
  }

  /**
   * Export audit entries
   *
   * @param options - Query options
   * @param format - Export format
   * @returns Formatted export string
   */
  async export(
    options: CompleteAuditQueryOptions = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const entries = await this.query(options);

    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    } else {
      return this.exportCSV(entries);
    }
  }

  /**
   * Export as CSV
   *
   * @param entries - Audit entries
   * @returns CSV string
   */
  private exportCSV(entries: CompleteAuditEntry[]): string {
    if (entries.length === 0) {
      return '';
    }

    // CSV header
    const headers = [
      'query_id',
      'timestamp',
      'user_id',
      'patient_id',
      'query_text',
      'artifact_ids',
      'model',
      'model_version',
      'response_summary',
      'confidence_score',
      'total_time_ms',
      'success',
      'error',
    ];

    let csv = headers.join(',') + '\n';

    // CSV rows
    entries.forEach(entry => {
      const row = [
        this.escapeCSV(entry.query_id),
        this.escapeCSV(entry.timestamp),
        this.escapeCSV(entry.user_id),
        this.escapeCSV(entry.patient_id),
        this.escapeCSV(entry.query_text),
        this.escapeCSV(entry.retrieval.artifact_ids.join('; ')),
        this.escapeCSV(entry.llm_interaction.model),
        this.escapeCSV(entry.llm_interaction.model_version || ''),
        this.escapeCSV(entry.response_summary),
        entry.confidence_score?.toString() || '',
        entry.total_time_ms.toString(),
        entry.success.toString(),
        this.escapeCSV(entry.error || ''),
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
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
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

    const avgTokens =
      this.entries.reduce((sum, e) => sum + (e.llm_interaction.tokens_used || 0), 0) / total || 0;
    const avgTime =
      this.entries.reduce((sum, e) => sum + e.total_time_ms, 0) / total || 0;

    const modelUsage: Record<string, number> = {};
    this.entries.forEach(e => {
      const model = e.llm_interaction.model;
      modelUsage[model] = (modelUsage[model] || 0) + 1;
    });

    const uniqueUsers = new Set(this.entries.map(e => e.user_id)).size;
    const uniquePatients = new Set(this.entries.map(e => e.patient_id)).size;

    return {
      total_queries: total,
      successful_queries: successful,
      failed_queries: failed,
      success_rate: total > 0 ? (successful / total) * 100 : 0,
      avg_tokens_used: avgTokens,
      avg_processing_time_ms: avgTime,
      model_usage: modelUsage,
      unique_users: uniqueUsers,
      unique_patients: uniquePatients,
    };
  }

  /**
   * Set privacy mode
   *
   * @param mode - Privacy mode
   */
  setPrivacyMode(mode: PrivacyMode): void {
    this.privacyMode = mode;
  }

  /**
   * Get privacy mode
   *
   * @returns Current privacy mode
   */
  getPrivacyMode(): PrivacyMode {
    return this.privacyMode;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.entries = [];
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
   * Validate audit entry
   *
   * @param entry - Audit entry
   * @throws Error if validation fails
   */
  private validateEntry(entry: CompleteAuditEntry): void {
    const required = [
      'query_id',
      'timestamp',
      'user_id',
      'patient_id',
      'query_text',
      'retrieval',
      'llm_interaction',
      'response_summary',
      'total_time_ms',
      'success',
    ];

    required.forEach(field => {
      if (!(field in entry)) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    // Validate retrieval
    if (!entry.retrieval.artifact_ids || !Array.isArray(entry.retrieval.artifact_ids)) {
      throw new Error('retrieval.artifact_ids must be an array');
    }

    // Validate LLM interaction
    if (!entry.llm_interaction.prompt || !entry.llm_interaction.response) {
      throw new Error('LLM interaction must include prompt and response');
    }
    if (!entry.llm_interaction.model) {
      throw new Error('LLM interaction must include model');
    }
  }

  /**
   * Apply privacy mode to entry
   *
   * @param entry - Audit entry
   * @param mode - Privacy mode
   * @returns Filtered entry
   */
  private applyPrivacyMode(entry: CompleteAuditEntry, mode: PrivacyMode): CompleteAuditEntry {
    if (mode === PrivacyMode.FULL) {
      return entry;
    }

    const filtered = { ...entry };

    if (mode === PrivacyMode.REDACTED) {
      // Redact PHI from prompts and responses
      filtered.llm_interaction = {
        ...filtered.llm_interaction,
        prompt: '[REDACTED]',
        response: '[REDACTED]',
      };
      filtered.query_text = '[REDACTED]';
      filtered.response_summary = '[REDACTED]';
    } else if (mode === PrivacyMode.MINIMAL) {
      // Only include IDs and metadata
      filtered.query_text = '[MINIMAL]';
      filtered.response_summary = '[MINIMAL]';
      filtered.llm_interaction = {
        ...filtered.llm_interaction,
        prompt: '[MINIMAL]',
        response: '[MINIMAL]',
      };
    }

    return filtered;
  }

  /**
   * Write entry to append-only file
   *
   * @param entry - Audit entry
   */
  private async writeToFile(entry: CompleteAuditEntry): Promise<void> {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, line, 'utf8');
    } catch (error) {
      console.error('[CompleteAuditLogger] Failed to write to file:', error);
    }
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
   * Load recent entries from file
   */
  private loadRecentEntries(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return;
      }

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Load last MAX_IN_MEMORY entries
      const recentLines = lines.slice(-this.MAX_IN_MEMORY);

      recentLines.forEach(line => {
        try {
          const entry = JSON.parse(line) as CompleteAuditEntry;
          this.entries.push(entry);
        } catch (error) {
          console.error('[CompleteAuditLogger] Failed to parse log entry:', error);
        }
      });

      console.log(`[CompleteAuditLogger] Loaded ${this.entries.length} entries from file`);
    } catch (error) {
      console.error('[CompleteAuditLogger] Failed to load entries from file:', error);
    }
  }

  /**
   * Log to console
   *
   * @param entry - Audit entry
   */
  private logToConsole(entry: CompleteAuditEntry): void {
    const logData = {
      query_id: entry.query_id,
      timestamp: entry.timestamp,
      user_id: entry.user_id,
      patient_id: entry.patient_id,
      model: entry.llm_interaction.model,
      tokens_used: entry.llm_interaction.tokens_used,
      total_time_ms: entry.total_time_ms,
      success: entry.success,
    };

    if (entry.success) {
      console.log('[AUDIT]', JSON.stringify(logData));
    } else {
      console.error('[AUDIT_ERROR]', JSON.stringify({ ...logData, error: entry.error }));
    }
  }

  /**
   * Explain complete audit logger
   *
   * @returns Explanation string
   */
  explain(): string {
    const stats = this.getStatistics();

    return `Complete Audit Logger:

ChatGPT Requirements:
✓ user_id: Tracked
✓ patient_id: Tracked
✓ query_text: Tracked
✓ retrieved artifact_ids: Tracked
✓ LLM prompt: Full prompt logged
✓ LLM response: Full response logged
✓ timestamp: ISO timestamp
✓ model version: Tracked

Statistics:
- Total entries: ${stats.total_queries}
- Success rate: ${stats.success_rate.toFixed(1)}%
- Avg tokens: ${stats.avg_tokens_used.toFixed(0)}
- Avg time: ${stats.avg_processing_time_ms.toFixed(0)}ms
- Unique users: ${stats.unique_users}
- Unique patients: ${stats.unique_patients}

Storage:
- Log file: ${this.logFilePath}
- Format: Append-only JSON lines
- Privacy mode: ${this.privacyMode}

Model Usage:
${Object.entries(stats.model_usage)
  .map(([model, count]) => `  - ${model}: ${count} queries`)
  .join('\n')}`;
  }
}

// Export singleton instance
const completeAuditLogger = new CompleteAuditLogger();
export default completeAuditLogger;
