/**
 * Complete Audit Logger Usage Examples
 *
 * Demonstrates:
 * - Logging complete audit entries (per ChatGPT specification)
 * - All required fields: user_id, patient_id, query_text, artifact_ids,
 *   LLM prompt, LLM response, timestamp, model version
 * - Query and filtering
 * - Privacy modes
 * - Export capabilities
 */
/**
 * Example 1: Log complete audit entry (ChatGPT requirements)
 */
export declare function exampleLogComplete(): Promise<void>;
/**
 * Example 2: Log multiple queries
 */
export declare function exampleLogMultiple(): Promise<void>;
/**
 * Example 3: Query by patient_id
 */
export declare function exampleQueryByPatient(): Promise<void>;
/**
 * Example 4: Query by user_id
 */
export declare function exampleQueryByUser(): Promise<void>;
/**
 * Example 5: Get by query_id
 */
export declare function exampleGetByQueryId(): Promise<void>;
/**
 * Example 6: Privacy mode - Full
 */
export declare function examplePrivacyFull(): Promise<void>;
/**
 * Example 7: Privacy mode - Redacted
 */
export declare function examplePrivacyRedacted(): Promise<void>;
/**
 * Example 8: Privacy mode - Minimal
 */
export declare function examplePrivacyMinimal(): Promise<void>;
/**
 * Example 9: Filter by date range
 */
export declare function exampleFilterByDateRange(): Promise<void>;
/**
 * Example 10: Filter by model
 */
export declare function exampleFilterByModel(): Promise<void>;
/**
 * Example 11: Export as JSON
 */
export declare function exampleExportJSON(): Promise<void>;
/**
 * Example 12: Export as CSV
 */
export declare function exampleExportCSV(): Promise<void>;
/**
 * Example 13: Get statistics
 */
export declare function exampleGetStatistics(): Promise<void>;
/**
 * Example 14: Log failed query
 */
export declare function exampleLogFailedQuery(): Promise<void>;
/**
 * Example 15: Complete pipeline logging
 */
export declare function exampleCompletePipeline(): Promise<void>;
/**
 * Example 16: Log file path
 */
export declare function exampleLogFilePath(): Promise<void>;
/**
 * Example 17: Explain complete audit logger
 */
export declare function exampleExplain(): Promise<void>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=complete-audit-logger.example.d.ts.map