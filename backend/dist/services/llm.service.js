"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMServiceError = void 0;
const openai_1 = __importDefault(require("openai"));
/**
 * LLM Service Error
 */
class LLMServiceError extends Error {
    code;
    retryable;
    constructor(message, code, retryable = false) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.name = 'LLMServiceError';
    }
}
exports.LLMServiceError = LLMServiceError;
/**
 * LLM Service Class
 *
 * Handles all OpenAI API interactions
 */
class LLMService {
    /**
     * OpenAI client
     */
    openai = null;
    /**
     * Current configuration
     */
    config = null;
    /**
     * Token usage tracking
     */
    tokenUsage = {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        avgTokensPerRequest: 0,
    };
    /**
     * Default extraction system prompt
     */
    EXTRACTION_SYSTEM_PROMPT = `You are a medical information extraction assistant.

Extract structured information from the provided text. Return valid JSON only.

Rules:
1. ONLY extract information explicitly stated
2. DO NOT infer or assume
3. Be precise with medical terms
4. Return valid JSON only`;
    /**
     * Default summarization system prompt
     */
    SUMMARIZATION_SYSTEM_PROMPT = `You are a medical summarization assistant.

Create a concise, accurate summary of the provided information.

Rules:
1. ONLY summarize provided information
2. DO NOT add new information
3. Use natural, professional language
4. Be concise and clear`;
    /**
     * Default configuration
     */
    DEFAULT_CONFIG = {
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || '',
        maxTokens: 2000,
        temperature: 0,
        timeout: 60000, // 60 seconds
    };
    /**
     * Configure LLM service
     *
     * @param config - LLM configuration
     */
    configure(config) {
        this.config = { ...this.DEFAULT_CONFIG, ...config };
        if (!this.config.apiKey) {
            throw new LLMServiceError('OpenAI API key not provided and OPENAI_API_KEY env var not set', 'MISSING_API_KEY', false);
        }
        this.openai = new openai_1.default({
            apiKey: this.config.apiKey,
            timeout: this.config.timeout,
        });
    }
    /**
     * Get OpenAI client (ensures configured)
     *
     * @returns OpenAI client
     */
    getClient() {
        if (!this.openai || !this.config) {
            // Auto-configure with defaults
            this.configure({});
        }
        return this.openai;
    }
    /**
     * Extract structured information
     *
     * @param systemPrompt - System prompt for extraction
     * @param userPrompt - User prompt with data to extract
     * @param temperature - Temperature (default: 0)
     * @returns Extraction result
     */
    async extract(systemPrompt, userPrompt, temperature = 0) {
        const config = this.config || this.DEFAULT_CONFIG;
        const startTime = Date.now();
        try {
            const client = this.getClient();
            const response = await client.chat.completions.create({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt || this.EXTRACTION_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature,
                max_tokens: config.maxTokens,
                response_format: { type: 'json_object' }, // Force JSON response
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new LLMServiceError('Empty response from LLM', 'EMPTY_RESPONSE', true);
            }
            // Parse JSON
            let parsed;
            try {
                parsed = JSON.parse(content);
            }
            catch (error) {
                throw new LLMServiceError(`JSON parse error: ${error.message}`, 'JSON_PARSE_ERROR', false);
            }
            const promptTokens = response.usage?.prompt_tokens || 0;
            const completionTokens = response.usage?.completion_tokens || 0;
            const totalTokens = response.usage?.total_tokens || 0;
            // Update token usage tracking
            this.updateTokenUsage(promptTokens, completionTokens, totalTokens);
            const latencyMs = Date.now() - startTime;
            return {
                extractions: parsed.extractions || [],
                promptTokens,
                completionTokens,
                totalTokens,
                model: config.model,
                latencyMs,
            };
        }
        catch (error) {
            if (error instanceof LLMServiceError) {
                throw error;
            }
            // Handle OpenAI API errors
            const apiError = error;
            if (apiError.status === 429) {
                throw new LLMServiceError('Rate limit exceeded', 'RATE_LIMIT', true);
            }
            if (apiError.status === 401) {
                throw new LLMServiceError('Invalid API key', 'INVALID_API_KEY', false);
            }
            if (apiError.code === 'context_length_exceeded') {
                throw new LLMServiceError('Token limit exceeded', 'TOKEN_LIMIT_EXCEEDED', false);
            }
            if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
                throw new LLMServiceError('Request timeout', 'TIMEOUT', true);
            }
            throw new LLMServiceError(`LLM API error: ${apiError.message || 'Unknown error'}`, 'API_ERROR', true);
        }
    }
    /**
     * Generate summary
     *
     * @param systemPrompt - System prompt for summarization
     * @param userPrompt - User prompt with content to summarize
     * @param temperature - Temperature (default: 0.3)
     * @returns Summary result
     */
    async summarize(systemPrompt, userPrompt, temperature = 0.3) {
        const config = this.config || this.DEFAULT_CONFIG;
        const startTime = Date.now();
        try {
            const client = this.getClient();
            const response = await client.chat.completions.create({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt || this.SUMMARIZATION_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature,
                max_tokens: config.maxTokens,
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new LLMServiceError('Empty response from LLM', 'EMPTY_RESPONSE', true);
            }
            const promptTokens = response.usage?.prompt_tokens || 0;
            const completionTokens = response.usage?.completion_tokens || 0;
            const totalTokens = response.usage?.total_tokens || 0;
            // Update token usage tracking
            this.updateTokenUsage(promptTokens, completionTokens, totalTokens);
            const latencyMs = Date.now() - startTime;
            return {
                summary: content,
                promptTokens,
                completionTokens,
                totalTokens,
                model: config.model,
                latencyMs,
            };
        }
        catch (error) {
            if (error instanceof LLMServiceError) {
                throw error;
            }
            // Handle OpenAI API errors (same as extract)
            const apiError = error;
            if (apiError.status === 429) {
                throw new LLMServiceError('Rate limit exceeded', 'RATE_LIMIT', true);
            }
            if (apiError.status === 401) {
                throw new LLMServiceError('Invalid API key', 'INVALID_API_KEY', false);
            }
            if (apiError.code === 'context_length_exceeded') {
                throw new LLMServiceError('Token limit exceeded', 'TOKEN_LIMIT_EXCEEDED', false);
            }
            if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
                throw new LLMServiceError('Request timeout', 'TIMEOUT', true);
            }
            throw new LLMServiceError(`LLM API error: ${apiError.message || 'Unknown error'}`, 'API_ERROR', true);
        }
    }
    /**
     * Extract with automatic retries
     *
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @param temperature - Temperature (default: 0)
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Extraction result
     */
    async extractWithRetries(systemPrompt, userPrompt, temperature = 0, maxRetries = 3) {
        return this.withRetries(() => this.extract(systemPrompt, userPrompt, temperature), maxRetries);
    }
    /**
     * Summarize with automatic retries
     *
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @param temperature - Temperature (default: 0.3)
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Summary result
     */
    async summarizeWithRetries(systemPrompt, userPrompt, temperature = 0.3, maxRetries = 3) {
        return this.withRetries(() => this.summarize(systemPrompt, userPrompt, temperature), maxRetries);
    }
    /**
     * Execute function with retries and exponential backoff
     *
     * @param fn - Function to execute
     * @param maxRetries - Maximum retry attempts
     * @returns Function result
     */
    async withRetries(fn, maxRetries) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                // Don't retry non-retryable errors
                if (lastError instanceof LLMServiceError && !lastError.retryable) {
                    throw lastError;
                }
                console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
                if (attempt < maxRetries) {
                    // Exponential backoff: 2s, 4s, 8s, etc.
                    const delayMs = Math.pow(2, attempt) * 1000;
                    console.log(`Retrying in ${delayMs}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
            }
        }
        throw new LLMServiceError(`Failed after ${maxRetries} attempts: ${lastError?.message}`, 'MAX_RETRIES_EXCEEDED', false);
    }
    /**
     * Update token usage statistics
     *
     * @param promptTokens - Prompt tokens
     * @param completionTokens - Completion tokens
     * @param totalTokens - Total tokens
     */
    updateTokenUsage(promptTokens, completionTokens, totalTokens) {
        this.tokenUsage.totalPromptTokens += promptTokens;
        this.tokenUsage.totalCompletionTokens += completionTokens;
        this.tokenUsage.totalTokens += totalTokens;
        this.tokenUsage.requestCount += 1;
        this.tokenUsage.avgTokensPerRequest = this.tokenUsage.totalTokens / this.tokenUsage.requestCount;
    }
    /**
     * Get token usage statistics
     *
     * @returns Token usage
     */
    getTokenUsage() {
        return { ...this.tokenUsage };
    }
    /**
     * Reset token usage statistics
     */
    resetTokenUsage() {
        this.tokenUsage = {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalTokens: 0,
            requestCount: 0,
            avgTokensPerRequest: 0,
        };
    }
    /**
     * Get current configuration
     *
     * @returns LLM configuration (without API key)
     */
    getConfig() {
        if (!this.config)
            return null;
        const { apiKey, ...configWithoutKey } = this.config;
        return configWithoutKey;
    }
    /**
     * Check if service is configured
     *
     * @returns True if configured
     */
    isConfigured() {
        return this.openai !== null && this.config !== null;
    }
    /**
     * Get default extraction system prompt
     *
     * @returns Extraction system prompt
     */
    getExtractionSystemPrompt() {
        return this.EXTRACTION_SYSTEM_PROMPT;
    }
    /**
     * Get default summarization system prompt
     *
     * @returns Summarization system prompt
     */
    getSummarizationSystemPrompt() {
        return this.SUMMARIZATION_SYSTEM_PROMPT;
    }
}
// Export singleton instance
const llmService = new LLMService();
exports.default = llmService;
//# sourceMappingURL=llm.service.js.map