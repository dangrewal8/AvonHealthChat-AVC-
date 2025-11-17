/**
 * Health Check Controller
 * Provides health and status information for the service
 */

import { Request, Response } from 'express';
import { HealthCheckResponse } from '../types/api.types';

const startTime = Date.now();

class HealthController {
  /**
   * GET /health
   * Returns health status of the service and its dependencies
   */
  async check(_req: Request, res: Response<HealthCheckResponse>): Promise<void> {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - startTime) / 1000);

    // Check service health (placeholder - will be enhanced later)
    const services: HealthCheckResponse['services'] = {
      avon_api: await this.checkAvonAPI(),
      // vector_store: await this.checkVectorStore(),
      // database: await this.checkDatabase(),
      // ollama_api: await this.checkOllamaAPI(),
    };

    // Determine overall status
    const statuses = Object.values(services).map((s) => s?.status);
    const hasDown = statuses.includes('down');
    const status: HealthCheckResponse['status'] = hasDown
      ? 'unhealthy'
      : 'healthy';

    res.json({
      status,
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      version: process.env.npm_package_version || '1.0.0',
      services,
    });
  }

  /**
   * Check Avon Health API availability
   */
  private async checkAvonAPI(): Promise<{ status: 'up' | 'down'; latency_ms?: number }> {
    const startTime = Date.now();

    try {
      // Simple check - just verify the base URL is reachable
      // This is a placeholder - actual implementation would make a real request
      const latency = Date.now() - startTime;

      return {
        status: 'up',
        latency_ms: latency,
      };
    } catch (error) {
      console.error('[Health] Avon API check failed:', error);
      return {
        status: 'down',
      };
    }
  }

  // TODO: Add these health checks when the services are implemented:
  // - checkVectorStore(): Check vector store (Chroma/FAISS) availability
  // - checkDatabase(): Check database connectivity
  // - checkOllamaAPI(): Check Ollama API availability
}

export const healthController = new HealthController();
export default healthController;
