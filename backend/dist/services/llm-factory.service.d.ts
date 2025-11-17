/**
 * LLM Service Factory
 *
 * Factory pattern to abstract LLM provider selection (Ollama-only for HIPAA compliance).
 * Enables easy switching between providers via environment configuration.
 *
 * Features:
 * - Provider abstraction interface
 * - Automatic provider detection from env
 * - Singleton pattern for performance
 * - Provider validation
 * - Clear error messages
 */
import type { GenerateOptions } from './ollama-llm.service';
import type { ExtractionResult, SummaryResult, TokenUsage } from './ollama-llm.service';
/**
 * LLM Provider Interface
 *
 * All LLM providers must implement this interface
 */
export interface LLMProvider {
    /**
     * Generate text from prompt
     */
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
    /**
     * Generate JSON output with schema validation
     */
    generateJSON(prompt: string, schema?: any, options?: GenerateOptions): Promise<any>;
    /**
     * Extract structured information (compatible with existing interface)
     */
    extract(systemPrompt: string, userPrompt: string, temperature?: number): Promise<ExtractionResult>;
    /**
     * Extract with automatic retries
     */
    extractWithRetries(systemPrompt: string, userPrompt: string, temperature?: number, maxRetries?: number): Promise<ExtractionResult>;
    /**
     * Generate summary
     */
    summarize(systemPrompt: string, userPrompt: string, temperature?: number): Promise<SummaryResult>;
    /**
     * Summarize with automatic retries
     */
    summarizeWithRetries(systemPrompt: string, userPrompt: string, temperature?: number, maxRetries?: number): Promise<SummaryResult>;
    /**
     * Get model information
     */
    getModelInfo(): Promise<{
        provider: string;
        model: string;
        maxTokens: number;
    }>;
    /**
     * Health check - verify provider is accessible
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get token usage statistics
     */
    getTokenUsage(): TokenUsage;
    /**
     * Reset token usage statistics
     */
    resetTokenUsage(): void;
}
/**
 * Supported LLM providers
 * SECURITY: Only Ollama is allowed for HIPAA compliance (local processing only)
 */
export type LLMProviderType = 'ollama';
/**
 * Create or retrieve LLM service instance
 *
 * Factory function that creates the appropriate LLM provider
 * based on configuration or explicit provider type.
 *
 * @param providerType - Optional provider type ('ollama' only)
 *                       If not specified, reads from LLM_PROVIDER env var
 * @returns LLMProvider instance
 *
 * @example
 * // Use configured provider (from env)
 * const llm = createLLMService();
 * await llm.generate('What is diabetes?');
 *
 * @example
 * // Explicitly use Ollama
 * const llm = createLLMService('ollama');
 * await llm.generate('What is diabetes?');
 */
export declare function createLLMService(providerType?: LLMProviderType): LLMProvider;
/**
 * Validate that the configured provider is available
 *
 * Performs health check on the provider before allowing usage.
 * Throws error if provider is not accessible.
 *
 * @param provider - Provider to validate
 * @throws Error if provider is not available
 *
 * @example
 * await validateProvider('ollama');
 * // If Ollama is not running, throws helpful error
 */
export declare function validateProvider(provider: LLMProviderType): Promise<void>;
/**
 * Get information about current LLM provider
 *
 * @param provider - Optional provider type (defaults to configured provider)
 * @returns Provider information
 *
 * @example
 * const info = await getProviderInfo();
 * console.log(info);
 * // {
 * //   provider: 'ollama',
 * //   model: 'llama3',
 * //   maxTokens: 2000
 * // }
 */
export declare function getProviderInfo(provider?: LLMProviderType): Promise<{
    provider: string;
    model: string;
    maxTokens: number;
}>;
/**
 * Switch LLM provider
 *
 * Changes the active LLM provider by updating environment variable.
 * Note: Requires application restart to take full effect.
 *
 * @param newProvider - New provider to switch to
 *
 * @example
 * switchProvider('ollama');
 * // Updates environment and clears cache
 */
export declare function switchProvider(newProvider: LLMProviderType): void;
/**
 * Get list of available providers
 *
 * Checks which providers are currently accessible.
 * SECURITY: Only Ollama is supported for HIPAA compliance
 *
 * @returns Array of available provider names (only 'ollama')
 *
 * @example
 * const available = await getAvailableProviders();
 * console.log(available); // ['ollama']
 */
export declare function getAvailableProviders(): Promise<LLMProviderType[]>;
/**
 * Clear provider cache
 *
 * Forces recreation of provider instances on next request.
 * Useful for testing or after configuration changes.
 */
export declare function clearProviderCache(): void;
/**
 * Export default configured LLM service
 *
 * This is the main entry point for most code.
 * Automatically selects provider based on LLM_PROVIDER env var.
 */
declare const defaultLLMService: LLMProvider;
export default defaultLLMService;
//# sourceMappingURL=llm-factory.service.d.ts.map