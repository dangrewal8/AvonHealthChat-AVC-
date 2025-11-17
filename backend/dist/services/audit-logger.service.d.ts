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
    query_id: string;
    timestamp: string;
    patient_id: string;
    query_text: string;
    response_summary: string;
    sources_used: string[];
    confidence_score: number;
    total_time_ms: number;
    success: boolean;
    error?: string;
    user_id?: string;
    session_id?: string;
}
/**
 * Date range filter
 */
export interface DateRangeFilter {
    start_date: string;
    end_date: string;
}
/**
 * Search filter options
 */
export interface SearchOptions {
    patient_id?: string;
    query_text?: string;
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
    retention_days: number;
    auto_cleanup: boolean;
    anonymize_after_days?: number;
}
/**
 * Audit Logger Class
 *
 * Logs all queries and responses for compliance and debugging
 */
declare class AuditLogger {
    /**
     * In-memory storage (for demo and fast access)
     */
    private entries;
    /**
     * File path for append-only log
     */
    private readonly logFilePath;
    /**
     * Retention policy
     */
    private retentionPolicy;
    /**
     * Max in-memory entries
     */
    private readonly MAX_IN_MEMORY;
    constructor();
    /**
     * Log a query and its response
     *
     * @param request - Query request
     * @param response - UI response (or null if failed)
     * @param metrics - Query metrics
     * @param error - Error message if query failed
     */
    logQuery(request: QueryRequest, response: UIResponse | null, metrics: QueryMetrics, error?: string): Promise<void>;
    /**
     * Get query history for a patient
     *
     * @param patientId - Patient ID
     * @param limit - Max number of entries to return
     * @returns Array of audit entries
     */
    getQueryHistory(patientId: string, limit?: number): Promise<AuditEntry[]>;
    /**
     * Search query history with filters
     *
     * @param options - Search options
     * @returns Filtered audit entries
     */
    searchQueries(options: SearchOptions): Promise<AuditEntry[]>;
    /**
     * Filter entries by date range
     *
     * @param startDate - Start date (ISO)
     * @param endDate - End date (ISO)
     * @returns Filtered entries
     */
    filterByDateRange(startDate: string, endDate: string): Promise<AuditEntry[]>;
    /**
     * Export audit entries
     *
     * @param format - Export format ('json' or 'csv')
     * @param options - Optional search options to filter entries
     * @returns Formatted string
     */
    export(format: 'json' | 'csv', options?: SearchOptions): Promise<string>;
    /**
     * Export as JSON
     *
     * @param entries - Entries to export
     * @returns JSON string
     */
    private exportJSON;
    /**
     * Export as CSV
     *
     * @param entries - Entries to export
     * @returns CSV string
     */
    private exportCSV;
    /**
     * Escape CSV field
     *
     * @param field - Field value
     * @returns Escaped field
     */
    private escapeCSV;
    /**
     * Get total number of entries
     *
     * @returns Total count
     */
    getTotalCount(): number;
    /**
     * Get statistics
     *
     * @returns Audit statistics
     */
    getStatistics(): {
        total_queries: number;
        successful_queries: number;
        failed_queries: number;
        success_rate: number;
        avg_confidence_score: number;
        avg_processing_time_ms: number;
        unique_patients: number;
        unique_users: number;
        date_range: {
            earliest: string | null;
            latest: string | null;
        };
    };
    /**
     * Clear all entries (for testing)
     */
    clear(): void;
    /**
     * Set retention policy
     *
     * @param policy - Retention policy
     */
    setRetentionPolicy(policy: Partial<RetentionPolicy>): void;
    /**
     * Apply retention policy
     *
     * Removes entries older than retention period
     */
    applyRetentionPolicy(): void;
    /**
     * Anonymize old entries
     *
     * Removes PII from entries older than anonymization threshold
     */
    anonymizeOldEntries(): void;
    /**
     * Hash ID for anonymization
     *
     * @param id - ID to hash
     * @returns Hashed ID
     */
    private hashId;
    /**
     * Start auto-cleanup timer
     */
    private startAutoCleanup;
    /**
     * Ensure log directory exists
     */
    private ensureLogDirectory;
    /**
     * Write entry to append-only file
     *
     * @param entry - Audit entry
     */
    private writeToFile;
    /**
     * Load entries from file
     */
    private loadEntriesFromFile;
    /**
     * Get log file path
     *
     * @returns Log file path
     */
    getLogFilePath(): string;
    /**
     * Explain audit logger
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const auditLogger: AuditLogger;
export default auditLogger;
//# sourceMappingURL=audit-logger.service.d.ts.map