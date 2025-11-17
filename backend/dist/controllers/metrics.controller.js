"use strict";
/**
 * Metrics Controller
 * Provides performance and usage metrics for monitoring
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsController = void 0;
const emr_service_1 = __importDefault(require("../services/emr.service"));
const startTime = Date.now();
/**
 * In-memory metrics storage
 * This is a simple implementation - production would use a proper metrics system
 */
class MetricsStore {
    requestCount = 0;
    requestsByEndpoint = new Map();
    requestsByStatus = new Map();
    responseTimes = [];
    queryTimes = [];
    retrievalTimes = [];
    generationTimes = [];
    recordRequest(endpoint, status, responseTime) {
        this.requestCount++;
        // Track by endpoint
        const current = this.requestsByEndpoint.get(endpoint) || 0;
        this.requestsByEndpoint.set(endpoint, current + 1);
        // Track by status
        const statusCount = this.requestsByStatus.get(status) || 0;
        this.requestsByStatus.set(status, statusCount + 1);
        // Track response times (keep last 1000)
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 1000) {
            this.responseTimes.shift();
        }
    }
    recordQueryTime(time) {
        this.queryTimes.push(time);
        if (this.queryTimes.length > 1000) {
            this.queryTimes.shift();
        }
    }
    recordRetrievalTime(time) {
        this.retrievalTimes.push(time);
        if (this.retrievalTimes.length > 1000) {
            this.retrievalTimes.shift();
        }
    }
    recordGenerationTime(time) {
        this.generationTimes.push(time);
        if (this.generationTimes.length > 1000) {
            this.generationTimes.shift();
        }
    }
    getRequestMetrics() {
        const byEndpoint = {};
        this.requestsByEndpoint.forEach((count, endpoint) => {
            byEndpoint[endpoint] = count;
        });
        const byStatus = {};
        this.requestsByStatus.forEach((count, status) => {
            byStatus[status] = count;
        });
        const avgResponseTime = this.responseTimes.length > 0
            ? Math.round(this.responseTimes.reduce((sum, t) => sum + t, 0) / this.responseTimes.length)
            : 0;
        return {
            total: this.requestCount,
            by_endpoint: byEndpoint,
            by_status: byStatus,
            average_response_time_ms: avgResponseTime,
        };
    }
    getPerformanceMetrics() {
        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((sum, t) => sum + t, 0) / arr.length) : 0;
        const percentile = (arr, p) => {
            if (arr.length === 0)
                return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const index = Math.ceil((p / 100) * sorted.length) - 1;
            return Math.round(sorted[index] || 0);
        };
        return {
            average_query_time_ms: avg(this.queryTimes),
            average_retrieval_time_ms: avg(this.retrievalTimes),
            average_generation_time_ms: avg(this.generationTimes),
            p95_query_time_ms: percentile(this.queryTimes, 95),
            p99_query_time_ms: percentile(this.queryTimes, 99),
        };
    }
    getCacheMetrics() {
        // Get cache stats from EMR service
        const stats = emr_service_1.default.getCacheStats();
        // Calculate metrics (placeholder - actual implementation would track hits/misses)
        return {
            hits: 0, // TODO: Track cache hits
            misses: 0, // TODO: Track cache misses
            hit_rate: 0, // TODO: Calculate hit rate
            size: stats.size,
            evictions: 0, // TODO: Track evictions
        };
    }
}
// Global metrics store instance
const metricsStore = new MetricsStore();
class MetricsController {
    /**
     * GET /api/metrics
     * Returns current performance and usage metrics
     */
    get(_req, res) {
        const now = Date.now();
        const uptimeSeconds = Math.floor((now - startTime) / 1000);
        res.json({
            timestamp: new Date().toISOString(),
            uptime_seconds: uptimeSeconds,
            requests: metricsStore.getRequestMetrics(),
            cache: metricsStore.getCacheMetrics(),
            performance: metricsStore.getPerformanceMetrics(),
        });
    }
    /**
     * Middleware to track request metrics
     */
    trackRequest(req, res, next) {
        const startTime = Date.now();
        // Track response when it finishes
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            const endpoint = `${req.method} ${req.path}`;
            const status = res.statusCode;
            metricsStore.recordRequest(endpoint, status, responseTime);
        });
        next();
    }
    /**
     * Record query processing time
     */
    recordQueryTime(time) {
        metricsStore.recordQueryTime(time);
    }
    /**
     * Record retrieval time
     */
    recordRetrievalTime(time) {
        metricsStore.recordRetrievalTime(time);
    }
    /**
     * Record generation time
     */
    recordGenerationTime(time) {
        metricsStore.recordGenerationTime(time);
    }
}
exports.metricsController = new MetricsController();
exports.default = exports.metricsController;
//# sourceMappingURL=metrics.controller.js.map