/**
 * LLM Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Configuration
 * - Extraction with temperature=0
 * - Summarization with temperature=0.3
 * - Retry logic with exponential backoff
 * - Token usage monitoring
 * - Error handling
 */
/**
 * Example 1: Configure LLM service
 */
export declare function exampleConfigure(): void;
/**
 * Example 2: Extract with temperature=0
 */
export declare function exampleExtract(): Promise<void>;
/**
 * Example 3: Summarize with temperature=0.3
 */
export declare function exampleSummarize(): Promise<void>;
/**
 * Example 4: Extract with retries
 */
export declare function exampleExtractWithRetries(): Promise<void>;
/**
 * Example 5: Token usage monitoring
 */
export declare function exampleTokenUsage(): Promise<void>;
/**
 * Example 6: Error handling
 */
export declare function exampleErrorHandling(): Promise<void>;
/**
 * Example 7: Temperature comparison
 */
export declare function exampleTemperatureComparison(): void;
/**
 * Example 8: Check configuration
 */
export declare function exampleCheckConfiguration(): void;
/**
 * Example 9: Custom configuration
 */
export declare function exampleCustomConfiguration(): void;
/**
 * Example 10: Complete workflow
 */
export declare function exampleCompleteWorkflow(): Promise<void>;
/**
 * Example 11: Retry behavior demonstration
 */
export declare function exampleRetryBehavior(): Promise<void>;
/**
 * Example 12: Performance monitoring
 */
export declare function examplePerformanceMonitoring(): Promise<void>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=llm.example.d.ts.map