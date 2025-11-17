"use strict";
/**
 * Health Check Routes
 *
 * Provides health check and monitoring endpoints for production.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRouter = void 0;
const express_1 = __importDefault(require("express"));
const health_service_1 = require("../services/health.service");
const metrics_controller_1 = __importDefault(require("../controllers/metrics.controller"));
/**
 * Create health check router
 */
const createHealthRouter = () => {
    const router = express_1.default.Router();
    /**
     * GET /health
     *
     * Comprehensive health check endpoint
     * Returns overall health status with component checks
     *
     * Status Codes:
     * - 200: Healthy - all components are up
     * - 503: Unhealthy - one or more critical components are down
     */
    router.get('/health', async (_req, res) => {
        try {
            const health = await health_service_1.healthService.checkHealth();
            const statusCode = health.status === 'healthy' ? 200 : 503;
            res.status(statusCode).json(health);
        }
        catch (error) {
            console.error('Health check failed:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                error: error.message || 'Health check failed',
            });
        }
    });
    /**
     * GET /health/live
     *
     * Liveness probe
     * Indicates whether the application is running
     *
     * This is used by Kubernetes/Docker to determine if the container should be restarted.
     * Always returns 200 if the process is alive.
     *
     * Status Codes:
     * - 200: Application is running
     */
    router.get('/health/live', (_req, res) => {
        health_service_1.healthService.isAlive(); // Always true if process is running
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    /**
     * GET /health/ready
     *
     * Readiness probe
     * Indicates whether the application is ready to handle requests
     *
     * This is used by Kubernetes/Docker to determine if traffic should be sent to the container.
     * Returns 200 if ready, 503 if not ready.
     *
     * Status Codes:
     * - 200: Ready to handle requests
     * - 503: Not ready (dependencies down, initialization incomplete, etc.)
     */
    router.get('/health/ready', async (_req, res) => {
        try {
            const isReady = await health_service_1.healthService.isReady();
            const statusCode = isReady ? 200 : 503;
            res.status(statusCode).json({
                status: isReady ? 'ready' : 'not ready',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        }
        catch (error) {
            console.error('Readiness check failed:', error);
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                error: error.message || 'Readiness check failed',
            });
        }
    });
    /**
     * GET /health/metrics
     *
     * Application metrics endpoint
     * Returns performance metrics, system metrics, and request statistics
     *
     * Status Codes:
     * - 200: Metrics retrieved successfully
     */
    router.get('/health/metrics', (_req, res) => {
        try {
            // Get system metrics from health service
            const systemMetrics = health_service_1.healthService.getSystemMetrics();
            // Get application metrics from metrics controller (if available)
            // Note: metricsController.getMetrics() expects (req, res) but we can call it directly
            const performanceMetrics = metrics_controller_1.default.metricsStore?.getPerformanceMetrics();
            const requestMetrics = metrics_controller_1.default.metricsStore?.getRequestMetrics();
            res.status(200).json({
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                system: systemMetrics,
                performance: performanceMetrics || {
                    query: { avg_ms: 0, p95_ms: 0, p99_ms: 0 },
                    retrieval: { avg_ms: 0, p95_ms: 0, p99_ms: 0 },
                    generation: { avg_ms: 0, p95_ms: 0, p99_ms: 0 },
                },
                requests: requestMetrics || {
                    total: 0,
                    by_endpoint: {},
                    by_status: {},
                    average_response_time_ms: 0,
                },
            });
        }
        catch (error) {
            console.error('Metrics retrieval failed:', error);
            res.status(500).json({
                timestamp: new Date().toISOString(),
                error: error.message || 'Metrics retrieval failed',
            });
        }
    });
    /**
     * GET /health/system
     *
     * System metrics only
     * Returns memory, CPU, and process information
     *
     * Status Codes:
     * - 200: System metrics retrieved successfully
     */
    router.get('/health/system', (_req, res) => {
        try {
            const systemMetrics = health_service_1.healthService.getSystemMetrics();
            res.status(200).json({
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                ...systemMetrics,
            });
        }
        catch (error) {
            console.error('System metrics retrieval failed:', error);
            res.status(500).json({
                timestamp: new Date().toISOString(),
                error: error.message || 'System metrics retrieval failed',
            });
        }
    });
    return router;
};
exports.createHealthRouter = createHealthRouter;
//# sourceMappingURL=health.routes.js.map