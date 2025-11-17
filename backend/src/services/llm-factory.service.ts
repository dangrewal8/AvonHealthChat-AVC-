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

import config from '../config/env.config';
import ollamaLLMService from './ollama-llm.service'; // Ollama version
import type { GenerateOptions } from './ollama-llm.service';
import type {
  ExtractionResult,
  SummaryResult,
  TokenUsage,
} from './ollama-llm.service';

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
  extract(
    systemPrompt: string,
    userPrompt: string,
    temperature?: number
  ): Promise<ExtractionResult>;

  /**
   * Extract with automatic retries
   */
  extractWithRetries(
    systemPrompt: string,
    userPrompt: string,
    temperature?: number,
    maxRetries?: number
  ): Promise<ExtractionResult>;

  /**
   * Generate summary
   */
  summarize(
    systemPrompt: string,
    userPrompt: string,
    temperature?: number
  ): Promise<SummaryResult>;

  /**
   * Summarize with automatic retries
   */
  summarizeWithRetries(
    systemPrompt: string,
    userPrompt: string,
    temperature?: number,
    maxRetries?: number
  ): Promise<SummaryResult>;

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
 * Adapter for Ollama LLM service
 * Wraps the Ollama LLM service to match LLMProvider interface
 * SECURITY: Ollama provides HIPAA-compliant local processing
 */
class OllamaLLMAdapter implements LLMProvider {
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    return ollamaLLMService.generate(prompt, options);
  }

  async generateJSON(prompt: string, schema?: any, options?: GenerateOptions): Promise<any> {
    return ollamaLLMService.generateJSON(prompt, schema, options);
  }

  async extract(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0
  ): Promise<ExtractionResult> {
    return ollamaLLMService.extract(systemPrompt, userPrompt, temperature);
  }

  async extractWithRetries(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0,
    maxRetries: number = 3
  ): Promise<ExtractionResult> {
    return ollamaLLMService.extractWithRetries(
      systemPrompt,
      userPrompt,
      temperature,
      maxRetries
    );
  }

  async summarize(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.3
  ): Promise<SummaryResult> {
    return ollamaLLMService.summarize(systemPrompt, userPrompt, temperature);
  }

  async summarizeWithRetries(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.3,
    maxRetries: number = 3
  ): Promise<SummaryResult> {
    return ollamaLLMService.summarizeWithRetries(
      systemPrompt,
      userPrompt,
      temperature,
      maxRetries
    );
  }

  async getModelInfo(): Promise<{
    provider: string;
    model: string;
    maxTokens: number;
  }> {
    const ollamaConfig = ollamaLLMService.getConfig();
    return {
      provider: 'ollama',
      model: ollamaConfig.model,
      maxTokens: ollamaConfig.maxTokens,
    };
  }

  async healthCheck(): Promise<boolean> {
    return ollamaLLMService.healthCheck();
  }

  getTokenUsage(): TokenUsage {
    return ollamaLLMService.getTokenUsage();
  }

  resetTokenUsage(): void {
    ollamaLLMService.resetTokenUsage();
  }
}

/**
 * Singleton instances cache
 */
const providerInstances: Map<LLMProviderType, LLMProvider> = new Map();

/**
 * Get LLM provider from environment configuration
 *
 * SECURITY: Only 'ollama' is permitted for HIPAA compliance
 * @returns Configured provider type (always 'ollama')
 */
function getConfiguredProvider(): LLMProviderType {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();

  // SECURITY: Enforce ollama-only for HIPAA compliance
  if (provider && provider !== 'ollama') {
    throw new Error(
      `SECURITY VIOLATION: LLM_PROVIDER='${provider}' is not allowed. ` +
      `This system processes Protected Health Information (PHI) and must use ` +
      `local Ollama provider only for HIPAA compliance. ` +
      `Set LLM_PROVIDER=ollama in environment.`
    );
  }

  // Default to 'ollama' for HIPAA compliance
  if (!provider) {
    console.warn(
      '[LLM Factory] No LLM_PROVIDER set in environment. Defaulting to "ollama" (HIPAA compliant).'
    );
  }

  return 'ollama';
}

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
export function createLLMService(providerType?: LLMProviderType): LLMProvider {
  // Use provided type or get from config
  const provider = providerType || getConfiguredProvider();

  // Return cached instance if available (singleton pattern)
  if (providerInstances.has(provider)) {
    console.log(`[LLM Factory] Using cached ${provider} provider`);
    return providerInstances.get(provider)!;
  }

  // Create new instance based on provider type
  let providerInstance: LLMProvider;

  // SECURITY: Only Ollama is allowed for HIPAA compliance
  if (provider === 'ollama') {
    console.log('[LLM Factory] Creating Ollama LLM provider');
    console.log('  ✓ Local processing (HIPAA compliant)');
    console.log('  ✓ No external API calls with PHI');
    console.log('  ✓ Models: Llama3, Meditron, BioMistral');
    providerInstance = new OllamaLLMAdapter();
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

  console.log(`[LLM Factory] ✓ ${provider} provider initialized`);

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
export async function validateProvider(provider: LLMProviderType): Promise<void> {
  const service = createLLMService(provider);

  console.log(`[LLM Factory] Validating ${provider} provider...`);

  const isHealthy = await service.healthCheck();

  if (!isHealthy) {
    // SECURITY: Only Ollama provider is supported
    throw new Error(
      `Ollama LLM provider is not available.\n\n` +
        `Please ensure Ollama is running:\n` +
        `  1. Start Ollama: ollama serve\n` +
        `  2. Install LLM model: ollama pull meditron\n` +
        `  3. Verify: curl http://localhost:11434/api/tags\n\n` +
        `For detailed setup, see: backend/OLLAMA_SETUP.md\n\n` +
        `NOTE: Only Ollama is supported for HIPAA compliance (local processing of PHI)`
    );
  }

  console.log(`[LLM Factory] ✓ ${provider} provider is healthy`);
}

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
export async function getProviderInfo(
  provider?: LLMProviderType
): Promise<{
  provider: string;
  model: string;
  maxTokens: number;
}> {
  const service = createLLMService(provider);
  return service.getModelInfo();
}

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
export function switchProvider(newProvider: LLMProviderType): void {
  console.log(`[LLM Factory] Switching provider to: ${newProvider}`);

  // Update environment variable
  process.env.LLM_PROVIDER = newProvider;

  // Clear cached instances to force recreation
  providerInstances.clear();

  console.log(`[LLM Factory] ✓ Provider switched to ${newProvider}`);
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
export async function getAvailableProviders(): Promise<LLMProviderType[]> {
  // SECURITY: Only check Ollama for HIPAA compliance
  const available: LLMProviderType[] = [];

  try {
    const service = createLLMService('ollama');
    const isHealthy = await service.healthCheck();

    if (isHealthy) {
      available.push('ollama');
      console.log('[LLM Factory] ✓ Ollama provider is available (HIPAA compliant)');
    } else {
      console.warn('[LLM Factory] ⚠ Ollama provider is not healthy');
    }
  } catch (error) {
    console.error('[LLM Factory] Ollama provider error:', error);
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
  console.log('[LLM Factory] Provider cache cleared');
}

/**
 * Export default configured LLM service
 *
 * This is the main entry point for most code.
 * Automatically selects provider based on LLM_PROVIDER env var.
 */
const defaultLLMService = createLLMService();

export default defaultLLMService;
