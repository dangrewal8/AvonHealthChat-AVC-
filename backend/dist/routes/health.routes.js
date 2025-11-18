"use strict";
/**
 * Health Check Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * Basic health check
 * GET /health
 */
router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'avon-health-rag-backend',
    });
});
/**
 * Detailed health check
 * GET /health/detailed
 */
router.get('/health/detailed', async (_req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'avon-health-rag-backend',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    };
    res.status(200).json(health);
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map