/**
 * Health Check Service
 *
 * Provides health check functionality for monitoring system status.
 * Supports Ollama provider with comprehensive diagnostics (HIPAA-compliant).
 *
 */

import config from '../config/env.config';
import llmService from './llm-factory.service';
import embeddingService from './embedding-factory.service';
import { getProviderInfo as getLLMProviderInfo } from './llm-factory.service';
import { getProviderInfo as getEmbeddingProviderInfo } from './embedding-factory.service';

/**
 * Component health status
 */
export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  latency_ms?: number;
  error?: string;
  message?: string;
}

/**
 * Provider configuration info
 */
export interface ProviderInfo {
  embedding: 'ollama';
  llm: 'ollama';
}

/**
 * Ollama service health
 */
export interface OllamaHealth {
  status: 'running' | 'stopped' | 'unknown';
  models?: {
    embedding?: string;
    llm?: string;
  };
  error?: string;
}

/**
 * Overall health status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  providers: ProviderInfo;
  checks: {
    llm?: ComponentHealth;
    embedding?: ComponentHealth;
    avonapi?: ComponentHealth;
    vectordb?: ComponentHealth;
    cache?: ComponentHealth;
  };
  services?: {
    ollama?: OllamaHealth;
  };
}

/**
 * System metrics
 */
export interface SystemMetrics {
  memory: {
    total_mb: number;
    used_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
    external_mb: number;
    rss_mb: number;
  };
  cpu: {
    user_ms: number;
    system_ms: number;
  };
  uptime_seconds: number;
  node_version: string;
  platform: string;
}

/**
 * Health Check Service
 */
export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {};

    // Get provider info
    const providers = await this.getProviderInfo();

    // Check LLM service (Ollama)
    checks.llm = await this.checkLLM();

    // Check Embedding service (Ollama)
    checks.embedding = await this.checkEmbedding();

    // Check Avon API
    checks.avonapi = await this.checkAvonAPI();

    // Check Vector DB
    checks.vectordb = await this.checkVectorDB();

    // Check Cache (optional)
    if (config.cache.enabled) {
      checks.cache = this.checkCache();
    }

    // Check Ollama service if using Ollama provider
    let ollamaHealth: OllamaHealth | undefined;
    if (providers.llm === 'ollama' || providers.embedding === 'ollama') {
      ollamaHealth = await this.checkOllama();
    }

    // Determine overall status
    const allUp = Object.values(checks).every(c => c.status === 'up');
    const anyDown = Object.values(checks).some(c => c.status === 'down');

    return {
      status: allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.nodeEnv,
      providers,
      checks,
      services: ollamaHealth ? { ollama: ollamaHealth } : undefined,
    };
  }

  /**
   * Get provider information
   */
  private async getProviderInfo(): Promise<ProviderInfo> {
    try {
      const llmInfo = await getLLMProviderInfo();
      const embeddingInfo = await getEmbeddingProviderInfo();

      return {
        llm: llmInfo.provider as 'ollama',
        embedding: embeddingInfo.provider as 'ollama',
      };
    } catch (error) {
      // Fallback to env vars
      return {
        llm: (process.env.LLM_PROVIDER?.toLowerCase() as 'ollama') || 'ollama',
        embedding: (process.env.EMBEDDING_PROVIDER?.toLowerCase() as 'ollama') || 'ollama',
      };
    }
  }

  /**
   * Check LLM service status (Ollama)
   */
  private async checkLLM(): Promise<ComponentHealth> {
    // Skip if test environment
    if (config.server.nodeEnv === 'test') {
      return {
        status: 'up',
        message: 'Skipped in test environment',
      };
    }

    try {
      const start = Date.now();

      // Use LLM factory health check
      const isHealthy = await llmService.healthCheck();
      const modelInfo = await getLLMProviderInfo();

      const latency = Date.now() - start;

      if (!isHealthy) {
        return {
          status: 'down',
          error: `${modelInfo.provider} LLM service is not responding`,
          message: `Model: ${modelInfo.model}`,
        };
      }

      return {
        status: latency < 5000 ? 'up' : 'degraded',
        latency_ms: latency,
        message: `${modelInfo.provider}/${modelInfo.model}${latency >= 5000 ? ' - High latency detected' : ''}`,
      };
    } catch (error: any) {
      return {
        status: 'down',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check Embedding service status (Ollama)
   */
  private async checkEmbedding(): Promise<ComponentHealth> {
    // Skip if test environment
    if (config.server.nodeEnv === 'test') {
      return {
        status: 'up',
        message: 'Skipped in test environment',
      };
    }

    try {
      const start = Date.now();

      // Use embedding factory health check
      const isHealthy = await embeddingService.healthCheck();
      const modelInfo = await getEmbeddingProviderInfo();

      const latency = Date.now() - start;

      if (!isHealthy) {
        return {
          status: 'down',
          error: `${modelInfo.provider} embedding service is not responding`,
          message: `Model: ${modelInfo.model}`,
        };
      }

      return {
        status: latency < 5000 ? 'up' : 'degraded',
        latency_ms: latency,
        message: `${modelInfo.provider}/${modelInfo.model} (${modelInfo.dimensions}D)${latency >= 5000 ? ' - High latency detected' : ''}`,
      };
    } catch (error: any) {
      return {
        status: 'down',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check Ollama service status
   */
  private async checkOllama(): Promise<OllamaHealth> {
    try {
      // Try to reach Ollama API
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        return {
          status: 'stopped',
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];

      // Extract model names
      const embeddingModel = models.find((m: any) =>
        m.name.includes('nomic-embed') || m.name.includes('embed')
      )?.name;

      const llmModel = models.find((m: any) =>
        m.name.includes('meditron') || m.name.includes('llama') || m.name.includes('mistral')
      )?.name;

      return {
        status: 'running',
        models: {
          embedding: embeddingModel,
          llm: llmModel,
        },
      };
    } catch (error: any) {
      return {
        status: 'stopped',
        error: error.message || 'Connection failed',
      };
    }
  }

  /**
   * Check Avon Health API status
   */
  private async checkAvonAPI(): Promise<ComponentHealth> {
    // Skip if test environment
    if (config.server.nodeEnv === 'test') {
      return {
        status: 'up',
        message: 'Skipped in test environment',
      };
    }

    try {
      const start = Date.now();

      // Try to reach Avon API base URL
      const response = await fetch(config.avon.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const latency = Date.now() - start;

      const isHealthy = response.ok || response.status === 404; // 404 is ok for base URL

      return {
        status: isHealthy && latency < 5000 ? 'up' : 'degraded',
        latency_ms: latency,
        message: !isHealthy
          ? `HTTP ${response.status}`
          : latency >= 5000
          ? 'High latency detected'
          : undefined,
      };
    } catch (error: any) {
      return {
        status: 'down',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check Vector DB status
   */
  private async checkVectorDB(): Promise<ComponentHealth> {
    try {
      // For now, assume vector DB is up if app is running
      // In a real implementation, you would ping the actual vector DB
      // Example for ChromaDB:
      // const collections = await chromaClient.listCollections();
      // Example for FAISS:
      // const indexSize = await faissIndex.getSize();

      return {
        status: 'up',
        latency_ms: 0,
        message: `Using ${config.vectorDb.type}`,
      };
    } catch (error: any) {
      return {
        status: 'down',
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check cache status
   */
  private checkCache(): ComponentHealth {
    if (!config.cache.enabled) {
      return {
        status: 'up',
        message: 'Cache disabled',
      };
    }

    // For now, assume cache is working if enabled
    // In a real implementation, you would test cache read/write
    return {
      status: 'up',
      message: `TTL: ${config.cache.ttlSeconds}s`,
    };
  }

  /**
   * Liveness probe
   * Returns true if the application is running
   */
  isAlive(): boolean {
    return true;
  }

  /**
   * Readiness probe
   * Returns true if the application is ready to handle requests
   */
  async isReady(): Promise<boolean> {
    try {
      // Check critical dependencies
      const llmStatus = await this.checkLLM();
      const embeddingStatus = await this.checkEmbedding();
      const avonStatus = await this.checkAvonAPI();

      // Application is ready if critical services are up or degraded (not down)
      const llmReady = llmStatus.status !== 'down';
      const embeddingReady = embeddingStatus.status !== 'down';
      const avonReady = avonStatus.status !== 'down';

      return llmReady && embeddingReady && avonReady;
    } catch (error) {
      console.error('Readiness check failed:', error);
      return false;
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        total_mb: Math.round((memoryUsage.rss + memoryUsage.external) / 1024 / 1024),
        used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024),
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: {
        user_ms: Math.round(cpuUsage.user / 1000), // Convert microseconds to milliseconds
        system_ms: Math.round(cpuUsage.system / 1000),
      },
      uptime_seconds: Math.round(process.uptime()),
      node_version: process.version,
      platform: process.platform,
    };
  }

  /**
   * Get application uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

// Export singleton instance
export const healthService = new HealthService();
