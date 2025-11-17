/**
 * LLM Service
 *
 * Generic OpenAI API wrapper for extraction and summarization.
 *
 * Features:
 * - Extraction with temperature = 0 (deterministic)
 * - Summarization with configurable temperature
 * - Automatic retries with exponential backoff
 * - Timeout handling
 * - Token counting and monitoring
 * - JSON parsing with error handling
 *
 */
/**
 * LLM configuration
 */
export interface LLMConfig {
    model: string;
    apiKey: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
}
/**
 * Extraction result from LLM
 */
export interface ExtractionResult {
    extractions: unknown[];
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
    latencyMs: number;
}
/**
 * Summary result from LLM
 */
export interface SummaryResult {
    summary: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
    latencyMs: number;
}
/**
 * Token usage statistics
 */
export interface TokenUsage {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    requestCount: number;
    avgTokensPerRequest: number;
}
/**
 * LLM Service Error
 */
export declare class LLMServiceError extends Error {
    code: string;
    retryable: boolean;
    constructor(message: string, code: string, retryable?: boolean);
}
/**
 * LLM Service Class
 *
 * Handles all OpenAI API interactions
 */
declare class LLMService {
    /**
     * OpenAI client
     */
    private openai;
    /**
     * Current configuration
     */
    private config;
    /**
     * Token usage tracking
     */
    private tokenUsage;
    /**
     * Default extraction system prompt
     */
    private readonly EXTRACTION_SYSTEM_PROMPT;
    /**
     * Default summarization system prompt
     */
    private readonly SUMMARIZATION_SYSTEM_PROMPT;
    /**
     * Default configuration
     */
    private readonly DEFAULT_CONFIG;
    /**
     * Configure LLM service
     *
     * @param config - LLM configuration
     */
    configure(config: Partial<LLMConfig>): void;
    /**
     * Get OpenAI client (ensures configured)
     *
     * @returns OpenAI client
     */
    private getClient;
    /**
     * Extract structured information
     *
     * @param systemPrompt - System prompt for extraction
     * @param userPrompt - User prompt with data to extract
     * @param temperature - Temperature (default: 0)
     * @returns Extraction result
     */
    extract(systemPrompt: string, userPrompt: string, temperature?: number): Promise<ExtractionResult>;
    /**
     * Generate summary
     *
     * @param systemPrompt - System prompt for summarization
     * @param userPrompt - User prompt with content to summarize
     * @param temperature - Temperature (default: 0.3)
     * @returns Summary result
     */
    summarize(systemPrompt: string, userPrompt: string, temperature?: number): Promise<SummaryResult>;
    /**
     * Extract with automatic retries
     *
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @param temperature - Temperature (default: 0)
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Extraction result
     */
    extractWithRetries(systemPrompt: string, userPrompt: string, temperature?: number, maxRetries?: number): Promise<ExtractionResult>;
    /**
     * Summarize with automatic retries
     *
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @param temperature - Temperature (default: 0.3)
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Summary result
     */
    summarizeWithRetries(systemPrompt: string, userPrompt: string, temperature?: number, maxRetries?: number): Promise<SummaryResult>;
    /**
     * Execute function with retries and exponential backoff
     *
     * @param fn - Function to execute
     * @param maxRetries - Maximum retry attempts
     * @returns Function result
     */
    private withRetries;
    /**
     * Update token usage statistics
     *
     * @param promptTokens - Prompt tokens
     * @param completionTokens - Completion tokens
     * @param totalTokens - Total tokens
     */
    private updateTokenUsage;
    /**
     * Get token usage statistics
     *
     * @returns Token usage
     */
    getTokenUsage(): TokenUsage;
    /**
     * Reset token usage statistics
     */
    resetTokenUsage(): void;
    /**
     * Get current configuration
     *
     * @returns LLM configuration (without API key)
     */
    getConfig(): Omit<LLMConfig, 'apiKey'> | null;
    /**
     * Check if service is configured
     *
     * @returns True if configured
     */
    isConfigured(): boolean;
    /**
     * Get default extraction system prompt
     *
     * @returns Extraction system prompt
     */
    getExtractionSystemPrompt(): string;
    /**
     * Get default summarization system prompt
     *
     * @returns Summarization system prompt
     */
    getSummarizationSystemPrompt(): string;
}
declare const llmService: LLMService;
export default llmService;
//# sourceMappingURL=llm.service.d.ts.map