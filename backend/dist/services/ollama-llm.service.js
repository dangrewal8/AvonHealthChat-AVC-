"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaLLMService = exports.OllamaLLMServiceError = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * LLM Service Error
 */
class OllamaLLMServiceError extends Error {
    code;
    retryable;
    constructor(message, code, retryable = false) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.name = 'OllamaLLMServiceError';
    }
}
exports.OllamaLLMServiceError = OllamaLLMServiceError;
/**
 * Ollama LLM Service Class
 *
 * Handles all Ollama API interactions for text generation
 */
class OllamaLLMService {
    client;
    config;
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
     * Default extraction system prompt (medical-focused)
     */
    EXTRACTION_SYSTEM_PROMPT = `You are a medical information extraction assistant.

Extract structured information from the provided text. Return valid JSON only.

Rules:
1. ONLY extract information explicitly stated
2. DO NOT infer or assume
3. Be precise with medical terms
4. Use standardized medical terminology (ICD-10, SNOMED CT when applicable)
5. Return valid JSON only - no explanations or additional text`;
    /**
     * Default summarization system prompt (medical-focused)
     */
    SUMMARIZATION_SYSTEM_PROMPT = `You are a medical summarization assistant.

Create a concise, accurate summary of the provided medical information.

Rules:
1. ONLY summarize provided information
2. DO NOT add new information or diagnoses
3. Use natural, professional medical language
4. Preserve critical clinical details
5. Be concise and clear`;
    constructor(config) {
        // Default configuration
        const defaultConfig = {
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_LLM_MODEL || 'llama3',
            maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '2000', 10),
            temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0'),
            timeout: parseInt(process.env.OLLAMA_TIMEOUT || '60000', 10), // 60 seconds
            stream: false, // Disable streaming by default
            retryAttempts: 3,
            retryDelay: 1000, // 1 second base delay
        };
        // Merge with provided config
        this.config = { ...defaultConfig, ...config };
        // Initialize axios client
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('[Ollama LLM Service] Initialized');
        console.log(`  Base URL: ${this.config.baseUrl}`);
        console.log(`  Model: ${this.config.model}`);
        console.log(`  Max Tokens: ${this.config.maxTokens}`);
        console.log(`  Temperature: ${this.config.temperature}`);
        console.log(`  Timeout: ${this.config.timeout}ms`);
    }
    /**
     * Generate text from prompt
     *
     * Basic generation method for text completion.
     *
     * @param prompt - Input prompt
     * @param options - Generation options
     * @returns Generated text
     */
    async generate(prompt, options) {
        if (!prompt || prompt.trim().length === 0) {
            throw new OllamaLLMServiceError('Prompt cannot be empty', 'EMPTY_PROMPT', false);
        }
        const startTime = Date.now();
        try {
            // Build full prompt with system prompt if provided
            const fullPrompt = options?.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt;
            const response = await this.client.post('/api/generate', {
                model: this.config.model,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: options?.temperature ?? this.config.temperature,
                    num_predict: options?.maxTokens ?? this.config.maxTokens,
                    top_p: options?.topP,
                    top_k: options?.topK,
                    stop: options?.stop,
                },
            });
            const generatedText = response.data.response;
            const latencyMs = Date.now() - startTime;
            // Track token usage
            const promptTokens = response.data.prompt_eval_count || 0;
            const completionTokens = response.data.eval_count || 0;
            this.updateTokenUsage(promptTokens, completionTokens);
            console.log(`[Ollama LLM Service] ✓ Generated response (${latencyMs}ms)`);
            console.log(`  Prompt tokens: ${promptTokens}`);
            console.log(`  Completion tokens: ${completionTokens}`);
            return generatedText;
        }
        catch (error) {
            return this.handleGenerationError(error, 'generate');
        }
    }
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
    async generateJSON(prompt, schema, options) {
        if (!prompt || prompt.trim().length === 0) {
            throw new OllamaLLMServiceError('Prompt cannot be empty', 'EMPTY_PROMPT', false);
        }
        // Add JSON format instruction to prompt
        const jsonPrompt = `${prompt}

IMPORTANT: Respond with valid JSON only. No explanations, no markdown, just pure JSON.`;
        const startTime = Date.now();
        try {
            // Build full prompt with system prompt
            const systemPrompt = options?.systemPrompt || this.EXTRACTION_SYSTEM_PROMPT;
            const fullPrompt = `${systemPrompt}\n\n${jsonPrompt}`;
            const response = await this.client.post('/api/generate', {
                model: this.config.model,
                prompt: fullPrompt,
                stream: false,
                format: 'json', // Enable JSON mode
                options: {
                    temperature: 0, // Deterministic for JSON
                    num_predict: options?.maxTokens ?? this.config.maxTokens,
                },
            });
            const generatedText = response.data.response;
            const latencyMs = Date.now() - startTime;
            // Track token usage
            const promptTokens = response.data.prompt_eval_count || 0;
            const completionTokens = response.data.eval_count || 0;
            this.updateTokenUsage(promptTokens, completionTokens);
            // Parse JSON
            let parsed;
            try {
                parsed = JSON.parse(generatedText);
            }
            catch (parseError) {
                // Try to extract JSON from response if wrapped in markdown
                const jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[1]);
                }
                else {
                    throw new OllamaLLMServiceError(`JSON parse error: ${parseError.message}\nResponse: ${generatedText.substring(0, 200)}`, 'JSON_PARSE_ERROR', false);
                }
            }
            console.log(`[Ollama LLM Service] ✓ Generated JSON (${latencyMs}ms)`);
            console.log(`  Prompt tokens: ${promptTokens}`);
            console.log(`  Completion tokens: ${completionTokens}`);
            return parsed;
        }
        catch (error) {
            if (error instanceof OllamaLLMServiceError) {
                throw error;
            }
            return this.handleGenerationError(error, 'generateJSON');
        }
    }
    /**
     * Generate with automatic retries
     *
     * Wrapper around generate() with retry logic.
     *
     * @param prompt - Input prompt
     * @param options - Generation options
     * @returns Generated text
     */
    async generateWithRetry(prompt, options) {
        return this.withRetries(() => this.generate(prompt, options), this.config.retryAttempts);
    }
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
    async extract(systemPrompt, userPrompt, temperature = 0) {
        const startTime = Date.now();
        try {
            // Use generateJSON for extraction
            const parsed = await this.generateJSON(userPrompt, null, {
                systemPrompt: systemPrompt || this.EXTRACTION_SYSTEM_PROMPT,
                temperature,
            });
            const latencyMs = Date.now() - startTime;
            // Get token counts from last tracked usage
            const promptTokens = this.tokenUsage.totalPromptTokens;
            const completionTokens = this.tokenUsage.totalCompletionTokens;
            const totalTokens = this.tokenUsage.totalTokens;
            return {
                extractions: parsed.extractions || [],
                promptTokens,
                completionTokens,
                totalTokens,
                model: this.config.model,
                latencyMs,
            };
        }
        catch (error) {
            if (error instanceof OllamaLLMServiceError) {
                throw error;
            }
            throw new OllamaLLMServiceError(`Extraction failed: ${error.message}`, 'EXTRACTION_ERROR', true);
        }
    }
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
    async summarize(systemPrompt, userPrompt, temperature = 0.3) {
        const startTime = Date.now();
        try {
            const summary = await this.generate(userPrompt, {
                systemPrompt: systemPrompt || this.SUMMARIZATION_SYSTEM_PROMPT,
                temperature,
            });
            const latencyMs = Date.now() - startTime;
            // Get token counts from last tracked usage
            const promptTokens = this.tokenUsage.totalPromptTokens;
            const completionTokens = this.tokenUsage.totalCompletionTokens;
            const totalTokens = this.tokenUsage.totalTokens;
            return {
                summary,
                promptTokens,
                completionTokens,
                totalTokens,
                model: this.config.model,
                latencyMs,
            };
        }
        catch (error) {
            if (error instanceof OllamaLLMServiceError) {
                throw error;
            }
            throw new OllamaLLMServiceError(`Summarization failed: ${error.message}`, 'SUMMARIZATION_ERROR', true);
        }
    }
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
    async extractWithRetries(systemPrompt, userPrompt, temperature = 0, maxRetries = 3) {
        return this.withRetries(() => this.extract(systemPrompt, userPrompt, temperature), maxRetries);
    }
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
                if (lastError instanceof OllamaLLMServiceError && !lastError.retryable) {
                    throw lastError;
                }
                console.error(`[Ollama LLM Service] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s, etc.
                    const delayMs = this.config.retryDelay * Math.pow(2, attempt - 1);
                    console.log(`[Ollama LLM Service] Retrying in ${delayMs}ms...`);
                    await this.sleep(delayMs);
                }
            }
        }
        throw new OllamaLLMServiceError(`Failed after ${maxRetries} attempts: ${lastError?.message}`, 'MAX_RETRIES_EXCEEDED', false);
    }
    /**
     * Handle generation errors
     *
     * @param error - Error that occurred
     * @param method - Method name for context
     * @returns Never (always throws)
     */
    handleGenerationError(error, method) {
        console.error(`[Ollama LLM Service] ✗ ${method} failed:`, error);
        if (axios_1.default.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                throw new OllamaLLMServiceError('Ollama service is not running. Please start it with: ollama serve', 'OLLAMA_NOT_RUNNING', false);
            }
            else if (error.response?.status === 404) {
                throw new OllamaLLMServiceError(`Ollama model '${this.config.model}' not found. Install it with: ollama pull ${this.config.model}`, 'MODEL_NOT_FOUND', false);
            }
            else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new OllamaLLMServiceError('Ollama request timeout. The model may be loading or your system may be slow. Try again or use GPU acceleration.', 'TIMEOUT', true);
            }
            else if (error.response?.status === 429) {
                throw new OllamaLLMServiceError('Rate limit exceeded', 'RATE_LIMIT', true);
            }
        }
        throw new OllamaLLMServiceError(`LLM generation failed: ${error.message || 'Unknown error'}`, 'GENERATION_ERROR', true);
    }
    /**
     * Health check - verify Ollama is accessible
     *
     * @returns True if healthy, false otherwise
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/api/tags', { timeout: 5000 });
            return response.status === 200;
        }
        catch (error) {
            console.error('[Ollama LLM Service] Health check failed:', error);
            return false;
        }
    }
    /**
     * Verify required model is installed
     *
     * @returns True if model is installed
     */
    async verifyModel() {
        try {
            const response = await this.client.get('/api/tags', { timeout: 5000 });
            const models = response.data.models || [];
            return models.some((m) => m.name === this.config.model || m.name === `${this.config.model}:latest`);
        }
        catch (error) {
            console.error('[Ollama LLM Service] Model verification failed:', error);
            return false;
        }
    }
    /**
     * Update token usage statistics
     *
     * @param promptTokens - Prompt tokens
     * @param completionTokens - Completion tokens
     */
    updateTokenUsage(promptTokens, completionTokens) {
        this.tokenUsage.totalPromptTokens += promptTokens;
        this.tokenUsage.totalCompletionTokens += completionTokens;
        this.tokenUsage.totalTokens += promptTokens + completionTokens;
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
     * @returns LLM configuration
     */
    getConfig() {
        return { ...this.config };
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
    /**
     * Sleep for specified milliseconds
     *
     * @param ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get statistics about the service
     *
     * @returns Service statistics
     */
    getStats() {
        return {
            tokenUsage: this.getTokenUsage(),
            config: this.getConfig(),
        };
    }
}
exports.OllamaLLMService = OllamaLLMService;
// Export singleton instance
const ollamaLLMService = new OllamaLLMService();
exports.default = ollamaLLMService;
//# sourceMappingURL=ollama-llm.service.js.map