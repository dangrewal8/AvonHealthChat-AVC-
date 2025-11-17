/**
 * Embedding Service Factory
 *
 * Factory pattern to abstract embedding provider selection (Ollama-only for HIPAA compliance).
 * Enables easy switching between providers via environment configuration.
 *
 * Features:
 * - Provider abstraction interface
 * - Automatic provider detection from env
 * - Singleton pattern for performance
 * - Provider validation
 * - Clear error messages
 */
/**
 * Embedding Provider Interface
 *
 * All embedding providers must implement this interface
 */
export interface EmbeddingProvider {
    /**
     * Generate embedding for a single text
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts (batch)
     */
    generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Get model information
     */
    getModelInfo(): Promise<{
        provider: string;
        model: string;
        dimensions: number;
    }>;
    /**
     * Health check - verify provider is accessible
     */
    healthCheck(): Promise<boolean>;
}
/**
 * Supported embedding providers
 * SECURITY: Only Ollama is allowed for HIPAA compliance (local processing only)
 */
export type EmbeddingProviderType = 'ollama';
/**
 * Create or retrieve embedding service instance
 *
 * Factory function that creates the appropriate embedding provider
 * based on configuration or explicit provider type.
 *
 * @param providerType - Optional provider type ('ollama' only)
 *                       If not specified, reads from EMBEDDING_PROVIDER env var
 * @returns EmbeddingProvider instance
 *
 * @example
 * // Use configured provider (from env)
 * const embeddings = createEmbeddingService();
 * await embeddings.generateEmbedding('text');
 *
 * @example
 * // Explicitly use Ollama
 * const embeddings = createEmbeddingService('ollama');
 * await embeddings.generateEmbedding('text');
 */
export declare function createEmbeddingService(providerType?: EmbeddingProviderType): EmbeddingProvider;
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
export declare function validateProvider(provider: EmbeddingProviderType): Promise<void>;
/**
 * Get information about current embedding provider
 *
 * @param provider - Optional provider type (defaults to configured provider)
 * @returns Provider information
 *
 * @example
 * const info = await getProviderInfo();
 * console.log(info);
 * // {
 * //   provider: 'ollama',
 * //   model: 'nomic-embed-text',
 * //   dimensions: 768
 * // }
 */
export declare function getProviderInfo(provider?: EmbeddingProviderType): Promise<{
    provider: string;
    model: string;
    dimensions: number;
}>;
/**
 * Switch embedding provider
 *
 * Changes the active embedding provider by updating environment variable.
 * Note: Requires application restart to take full effect.
 *
 * @param newProvider - New provider to switch to
 *
 * @example
 * switchProvider('ollama');
 * // Updates environment and clears cache
 */
export declare function switchProvider(newProvider: EmbeddingProviderType): void;
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
export declare function getAvailableProviders(): Promise<EmbeddingProviderType[]>;
/**
 * Clear provider cache
 *
 * Forces recreation of provider instances on next request.
 * Useful for testing or after configuration changes.
 */
export declare function clearProviderCache(): void;
/**
 * Export default configured embedding service
 *
 * This is the main entry point for most code.
 * Automatically selects provider based on EMBEDDING_PROVIDER env var.
 */
declare const defaultEmbeddingService: EmbeddingProvider;
export default defaultEmbeddingService;
//# sourceMappingURL=embedding-factory.service.d.ts.map