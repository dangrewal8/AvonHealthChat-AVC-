"use strict";
/**
 * Health Check Controller
 * Provides health and status information for the service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const startTime = Date.now();
class HealthController {
    /**
     * GET /health
     * Returns health status of the service and its dependencies
     */
    async check(_req, res) {
        const now = Date.now();
        const uptimeSeconds = Math.floor((now - startTime) / 1000);
        // Check service health (placeholder - will be enhanced later)
        const services = {
            avon_api: await this.checkAvonAPI(),
            // vector_store: await this.checkVectorStore(),
            // database: await this.checkDatabase(),
            // ollama_api: await this.checkOllamaAPI(),
        };
        // Determine overall status
        const statuses = Object.values(services).map((s) => s?.status);
        const hasDown = statuses.includes('down');
        const status = hasDown
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
    async checkAvonAPI() {
        const startTime = Date.now();
        try {
            // Simple check - just verify the base URL is reachable
            // This is a placeholder - actual implementation would make a real request
            const latency = Date.now() - startTime;
            return {
                status: 'up',
                latency_ms: latency,
            };
        }
        catch (error) {
            console.error('[Health] Avon API check failed:', error);
            return {
                status: 'down',
            };
        }
    }
}
exports.healthController = new HealthController();
exports.default = exports.healthController;
//# sourceMappingURL=health.controller.js.map