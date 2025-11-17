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
/**
 * LLM interaction details
 */
export interface LLMInteraction {
    prompt: string;
    response: string;
    model: string;
    model_version?: string;
    temperature?: number;
    max_tokens?: number;
    tokens_used?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    latency_ms?: number;
}
/**
 * Retrieval details
 */
export interface RetrievalDetails {
    artifact_ids: string[];
    chunk_ids?: string[];
    relevance_scores?: number[];
    retrieval_time_ms?: number;
    retrieval_method?: string;
}
/**
 * Complete audit entry (per ChatGPT specification)
 */
export interface CompleteAuditEntry {
    query_id: string;
    timestamp: string;
    user_id: string;
    patient_id: string;
    query_text: string;
    query_intent?: string;
    retrieval: RetrievalDetails;
    llm_interaction: LLMInteraction;
    response_summary: string;
    confidence_score?: number;
    success: boolean;
    error?: string;
    total_time_ms: number;
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
    pipeline_version?: string;
}
/**
 * Privacy mode for sensitive data
 */
export declare enum PrivacyMode {
    FULL = "full",// Include all data
    REDACTED = "redacted",// Redact PHI from prompts/responses
    MINIMAL = "minimal"
}
/**
 * Query filter options
 */
export interface CompleteAuditQueryOptions {
    user_id?: string;
    patient_id?: string;
    query_id?: string;
    start_date?: string;
    end_date?: string;
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
declare class CompleteAuditLogger {
    /**
     * In-memory cache (for fast access)
     */
    private entries;
    /**
     * Audit log file path
     */
    private readonly logFilePath;
    /**
     * Max in-memory entries
     */
    private readonly MAX_IN_MEMORY;
    /**
     * Privacy mode
     */
    private privacyMode;
    constructor();
    /**
     * Log complete audit entry
     *
     * @param entry - Complete audit entry
     */
    logComplete(entry: CompleteAuditEntry): Promise<void>;
    /**
     * Query audit entries
     *
     * @param options - Query options
     * @returns Filtered audit entries
     */
    query(options?: CompleteAuditQueryOptions): Promise<CompleteAuditEntry[]>;
    /**
     * Get single audit entry by query_id
     *
     * @param queryId - Query ID
     * @param privacyMode - Privacy mode
     * @returns Audit entry or null
     */
    getByQueryId(queryId: string, privacyMode?: PrivacyMode): Promise<CompleteAuditEntry | null>;
    /**
     * Export audit entries
     *
     * @param options - Query options
     * @param format - Export format
     * @returns Formatted export string
     */
    export(options?: CompleteAuditQueryOptions, format?: 'json' | 'csv'): Promise<string>;
    /**
     * Export as CSV
     *
     * @param entries - Audit entries
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
     * Get statistics
     *
     * @returns Audit statistics
     */
    getStatistics(): {
        total_queries: number;
        successful_queries: number;
        failed_queries: number;
        success_rate: number;
        avg_tokens_used: number;
        avg_processing_time_ms: number;
        model_usage: Record<string, number>;
        unique_users: number;
        unique_patients: number;
    };
    /**
     * Set privacy mode
     *
     * @param mode - Privacy mode
     */
    setPrivacyMode(mode: PrivacyMode): void;
    /**
     * Get privacy mode
     *
     * @returns Current privacy mode
     */
    getPrivacyMode(): PrivacyMode;
    /**
     * Clear all entries (for testing)
     */
    clear(): void;
    /**
     * Get log file path
     *
     * @returns Log file path
     */
    getLogFilePath(): string;
    /**
     * Validate audit entry
     *
     * @param entry - Audit entry
     * @throws Error if validation fails
     */
    private validateEntry;
    /**
     * Apply privacy mode to entry
     *
     * @param entry - Audit entry
     * @param mode - Privacy mode
     * @returns Filtered entry
     */
    private applyPrivacyMode;
    /**
     * Write entry to append-only file
     *
     * @param entry - Audit entry
     */
    private writeToFile;
    /**
     * Ensure log directory exists
     */
    private ensureLogDirectory;
    /**
     * Load recent entries from file
     */
    private loadRecentEntries;
    /**
     * Log to console
     *
     * @param entry - Audit entry
     */
    private logToConsole;
    /**
     * Explain complete audit logger
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const completeAuditLogger: CompleteAuditLogger;
export default completeAuditLogger;
//# sourceMappingURL=complete-audit-logger.service.d.ts.map