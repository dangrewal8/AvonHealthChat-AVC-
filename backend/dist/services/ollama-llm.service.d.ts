/**
 * Ollama LLM Service
 *
 * Local LLM service using Ollama models (Llama3, Meditron, BioMistral, etc.)
 *
 * Features:
 * - Local text generation (HIPAA compliant)
 * - Extraction with JSON mode (deterministic)
 * - Summarization with configurable temperature
 * - Automatic retries with exponential backoff
 * - Timeout handling
 * - Token counting and monitoring
 * - Medical-specific prompt templates
 * - Streaming support (optional)
 */
/**
 * Ollama LLM configuration
 */
export interface OllamaLLMConfig {
    baseUrl: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
    stream: boolean;
    retryAttempts: number;
    retryDelay: number;
}
/**
 * Generation options
 */
export interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    stop?: string[];
    topP?: number;
    topK?: number;
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
export declare class OllamaLLMServiceError extends Error {
    code: string;
    retryable: boolean;
    constructor(message: string, code: string, retryable?: boolean);
}
/**
 * Ollama LLM Service Class
 *
 * Handles all Ollama API interactions for text generation
 */
declare class OllamaLLMService {
    private client;
    private config;
    /**
     * Token usage tracking
     */
    private tokenUsage;
    /**
     * Default extraction system prompt (medical-focused)
     */
    private readonly EXTRACTION_SYSTEM_PROMPT;
    /**
     * Default summarization system prompt (medical-focused)
     */
    private readonly SUMMARIZATION_SYSTEM_PROMPT;
    constructor(config?: Partial<OllamaLLMConfig>);
    /**
     * Generate text from prompt
     *
     * Basic generation method for text completion.
     *
     * @param prompt - Input prompt
     * @param options - Generation options
     * @returns Generated text
     */
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
    /**
     * Generate JSON output with schema validation
     *
     * For structured data extraction with JSON mode.
     *
     * @param prompt - Input prompt
     * @param schema - Expected JSON schema (for documentation)
     * @param options - Generation options
     * @returns Parsed JSON object
     */
    generateJSON(prompt: string, schema?: any, options?: GenerateOptions): Promise<any>;
    /**
     * Generate with automatic retries
     *
     * Wrapper around generate() with retry logic.
     *
     * @param prompt - Input prompt
     * @param options - Generation options
     * @returns Generated text
     */
    generateWithRetry(prompt: string, options?: GenerateOptions): Promise<string>;
    /**
     * Extract structured information
     *
     * Compatible with existing LLM service interface.
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
     * Compatible with existing LLM service interface.
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
     * Compatible with existing LLM service interface.
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
     * Compatible with existing LLM service interface.
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
     * Handle generation errors
     *
     * @param error - Error that occurred
     * @param method - Method name for context
     * @returns Never (always throws)
     */
    private handleGenerationError;
    /**
     * Health check - verify Ollama is accessible
     *
     * @returns True if healthy, false otherwise
     */
    healthCheck(): Promise<boolean>;
    /**
     * Verify required model is installed
     *
     * @returns True if model is installed
     */
    verifyModel(): Promise<boolean>;
    /**
     * Update token usage statistics
     *
     * @param promptTokens - Prompt tokens
     * @param completionTokens - Completion tokens
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
     * @returns LLM configuration
     */
    getConfig(): OllamaLLMConfig;
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
    /**
     * Sleep for specified milliseconds
     *
     * @param ms - Milliseconds to sleep
     */
    private sleep;
    /**
     * Get statistics about the service
     *
     * @returns Service statistics
     */
    getStats(): {
        tokenUsage: TokenUsage;
        config: OllamaLLMConfig;
    };
}
declare const ollamaLLMService: OllamaLLMService;
export default ollamaLLMService;
export { OllamaLLMService };
//# sourceMappingURL=ollama-llm.service.d.ts.map