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

import config from '../config/env.config';
import ollamaEmbeddingService from './ollama-embedding.service'; // Ollama version

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
 * Adapter for Ollama embedding service
 * Wraps the Ollama embedding service to match EmbeddingProvider interface
 * SECURITY: Ollama provides HIPAA-compliant local processing
 */
class OllamaEmbeddingAdapter implements EmbeddingProvider {
  async generateEmbedding(text: string): Promise<number[]> {
    return ollamaEmbeddingService.generateEmbedding(text);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return ollamaEmbeddingService.generateBatchEmbeddings(texts);
  }

  async getModelInfo(): Promise<{
    provider: string;
    model: string;
    dimensions: number;
  }> {
    const ollamaConfig = ollamaEmbeddingService.getConfig();
    return {
      provider: 'ollama',
      model: ollamaConfig.model,
      dimensions: ollamaConfig.dimensions,
    };
  }

  async healthCheck(): Promise<boolean> {
    return ollamaEmbeddingService.healthCheck();
  }
}

/**
 * Singleton instances cache
 */
const providerInstances: Map<EmbeddingProviderType, EmbeddingProvider> = new Map();

/**
 * Get embedding provider from environment configuration
 *
 * SECURITY: Only 'ollama' is permitted for HIPAA compliance
 * @returns Configured provider type (always 'ollama')
 */
function getConfiguredProvider(): EmbeddingProviderType {
  const provider = process.env.EMBEDDING_PROVIDER?.toLowerCase();

  // SECURITY: Enforce ollama-only for HIPAA compliance
  if (provider && provider !== 'ollama') {
    throw new Error(
      `SECURITY VIOLATION: EMBEDDING_PROVIDER='${provider}' is not allowed. ` +
      `This system processes Protected Health Information (PHI) and must use ` +
      `local Ollama provider only for HIPAA compliance. ` +
      `Set EMBEDDING_PROVIDER=ollama in environment.`
    );
  }

  // Default to 'ollama' for HIPAA compliance
  if (!provider) {
    console.warn(
      '[Embedding Factory] No EMBEDDING_PROVIDER set in environment. Defaulting to "ollama" (HIPAA compliant).'
    );
  }

  return 'ollama';
}

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
export function createEmbeddingService(
  providerType?: EmbeddingProviderType
): EmbeddingProvider {
  // Use provided type or get from config
  const provider = providerType || getConfiguredProvider();

  // Return cached instance if available (singleton pattern)
  if (providerInstances.has(provider)) {
    console.log(`[Embedding Factory] Using cached ${provider} provider`);
    return providerInstances.get(provider)!;
  }

  // Create new instance based on provider type
  let providerInstance: EmbeddingProvider;

  // SECURITY: Only Ollama is allowed for HIPAA compliance
  if (provider === 'ollama') {
    console.log('[Embedding Factory] Creating Ollama embedding provider');
    console.log('  ✓ Local processing (HIPAA compliant)');
    console.log('  ✓ No external API calls with PHI');
    console.log('  ✓ Model: nomic-embed-text (768 dimensions)');
    providerInstance = new OllamaEmbeddingAdapter();
  } else {
    // SECURITY: Reject any attempt to use external API providers
    throw new Error(
      `SECURITY VIOLATION: Provider '${provider}' is not allowed. ` +
      `This system processes Protected Health Information (PHI) and must use ` +
      `local Ollama provider only for HIPAA compliance. ` +
      `Allowed provider: 'ollama'`
    );
  }

  // Cache the instance
  providerInstances.set(provider, providerInstance);

  console.log(`[Embedding Factory] ✓ ${provider} provider initialized`);

  return providerInstance;
}

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
export async function validateProvider(
  provider: EmbeddingProviderType
): Promise<void> {
  const service = createEmbeddingService(provider);

  console.log(`[Embedding Factory] Validating ${provider} provider...`);

  const isHealthy = await service.healthCheck();

  if (!isHealthy) {
    // SECURITY: Only Ollama provider is supported
    throw new Error(
      `Ollama embedding provider is not available.\n\n` +
        `Please ensure Ollama is running:\n` +
        `  1. Start Ollama: ollama serve\n` +
        `  2. Install embedding model: ollama pull nomic-embed-text\n` +
        `  3. Verify: curl http://localhost:11434/api/tags\n\n` +
        `For detailed setup, see: backend/OLLAMA_SETUP.md\n\n` +
        `NOTE: Only Ollama is supported for HIPAA compliance (local processing of PHI)`
    );
  }

  console.log(`[Embedding Factory] ✓ ${provider} provider is healthy`);
}

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
export async function getProviderInfo(
  provider?: EmbeddingProviderType
): Promise<{
  provider: string;
  model: string;
  dimensions: number;
}> {
  const service = createEmbeddingService(provider);
  return service.getModelInfo();
}

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
export function switchProvider(newProvider: EmbeddingProviderType): void {
  console.log(`[Embedding Factory] Switching provider to: ${newProvider}`);

  // Update environment variable
  process.env.EMBEDDING_PROVIDER = newProvider;

  // Clear cached instances to force recreation
  providerInstances.clear();

  console.log(`[Embedding Factory] ✓ Provider switched to ${newProvider}`);
  console.log('  Note: Some services may need to be reinitialized');
}

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
export async function getAvailableProviders(): Promise<EmbeddingProviderType[]> {
  // SECURITY: Only check Ollama for HIPAA compliance
  const available: EmbeddingProviderType[] = [];

  try {
    const service = createEmbeddingService('ollama');
    const isHealthy = await service.healthCheck();

    if (isHealthy) {
      available.push('ollama');
      console.log('[Embedding Factory] ✓ Ollama provider is available (HIPAA compliant)');
    } else {
      console.warn('[Embedding Factory] ⚠ Ollama provider is not healthy');
    }
  } catch (error) {
    console.error('[Embedding Factory] Ollama provider error:', error);
  }

  return available;
}

/**
 * Clear provider cache
 *
 * Forces recreation of provider instances on next request.
 * Useful for testing or after configuration changes.
 */
export function clearProviderCache(): void {
  providerInstances.clear();
  console.log('[Embedding Factory] Provider cache cleared');
}

/**
 * Export default configured embedding service
 *
 * This is the main entry point for most code.
 * Automatically selects provider based on EMBEDDING_PROVIDER env var.
 */
const defaultEmbeddingService = createEmbeddingService();

export default defaultEmbeddingService;
