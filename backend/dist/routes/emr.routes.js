"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emr_normalized_service_1 = __importDefault(require("../services/emr-normalized.service"));
const emr_service_1 = __importDefault(require("../services/emr.service"));
const router = (0, express_1.Router)();
/**
 * Middleware to add cache headers to responses
 */
const addCacheHeaders = (_req, res, next) => {
    // Cache for 5 minutes (300 seconds)
    res.set('Cache-Control', 'private, max-age=300');
    res.set('Vary', 'Authorization');
    next();
};
// Apply cache headers to all routes
router.use(addCacheHeaders);
/**
 * GET /api/emr/care_plans
 * Fetch normalized care plan artifacts for a patient
 *
 * Query params:
 * - patient_id (required): Patient identifier
 * - from (optional): Start date filter (ISO 8601)
 * - to (optional): End date filter (ISO 8601)
 * - limit (optional): Maximum number of results
 * - offset (optional): Pagination offset
 *
 * Returns: Standardized Artifact[] format
 */
router.get('/care_plans', async (req, res) => {
    try {
        const { patient_id, from, to, limit, offset } = req.query;
        // Validate required parameter
        if (!patient_id || typeof patient_id !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'patient_id query parameter is required',
            });
            return;
        }
        // Build filter options
        const options = {};
        if (from && typeof from === 'string')
            options.dateFrom = from;
        if (to && typeof to === 'string')
            options.dateTo = to;
        if (limit && typeof limit === 'string')
            options.limit = parseInt(limit, 10);
        if (offset && typeof offset === 'string')
            options.offset = parseInt(offset, 10);
        // Fetch and normalize data
        const result = await emr_normalized_service_1.default.fetchCarePlans(patient_id, options);
        // Return standardized response
        res.json({
            success: true,
            data: result.artifacts,
            meta: {
                count: result.artifacts.length,
                cached: result.cached,
                fetchTime: result.fetchTime,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('[EMR Routes] Care plans fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch care plans',
        });
    }
});
/**
 * GET /api/emr/medications
 * Fetch normalized medication artifacts for a patient
 *
 * Query params:
 * - patient_id (required): Patient identifier
 * - from (optional): Start date filter (ISO 8601)
 * - to (optional): End date filter (ISO 8601)
 * - limit (optional): Maximum number of results
 * - offset (optional): Pagination offset
 *
 * Returns: Standardized Artifact[] format
 */
router.get('/medications', async (req, res) => {
    try {
        const { patient_id, from, to, limit, offset } = req.query;
        // Validate required parameter
        if (!patient_id || typeof patient_id !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'patient_id query parameter is required',
            });
            return;
        }
        // Build filter options
        const options = {};
        if (from && typeof from === 'string')
            options.dateFrom = from;
        if (to && typeof to === 'string')
            options.dateTo = to;
        if (limit && typeof limit === 'string')
            options.limit = parseInt(limit, 10);
        if (offset && typeof offset === 'string')
            options.offset = parseInt(offset, 10);
        // Fetch and normalize data
        const result = await emr_normalized_service_1.default.fetchMedications(patient_id, options);
        // Return standardized response
        res.json({
            success: true,
            data: result.artifacts,
            meta: {
                count: result.artifacts.length,
                cached: result.cached,
                fetchTime: result.fetchTime,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('[EMR Routes] Medications fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch medications',
        });
    }
});
/**
 * GET /api/emr/notes
 * Fetch normalized clinical note artifacts for a patient
 *
 * Query params:
 * - patient_id (required): Patient identifier
 * - from (optional): Start date filter (ISO 8601)
 * - to (optional): End date filter (ISO 8601)
 * - limit (optional): Maximum number of results
 * - offset (optional): Pagination offset
 *
 * Returns: Standardized Artifact[] format
 */
router.get('/notes', async (req, res) => {
    try {
        const { patient_id, from, to, limit, offset } = req.query;
        // Validate required parameter
        if (!patient_id || typeof patient_id !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'patient_id query parameter is required',
            });
            return;
        }
        // Build filter options
        const options = {};
        if (from && typeof from === 'string')
            options.dateFrom = from;
        if (to && typeof to === 'string')
            options.dateTo = to;
        if (limit && typeof limit === 'string')
            options.limit = parseInt(limit, 10);
        if (offset && typeof offset === 'string')
            options.offset = parseInt(offset, 10);
        // Fetch and normalize data
        const result = await emr_normalized_service_1.default.fetchNotes(patient_id, options);
        // Return standardized response
        res.json({
            success: true,
            data: result.artifacts,
            meta: {
                count: result.artifacts.length,
                cached: result.cached,
                fetchTime: result.fetchTime,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('[EMR Routes] Notes fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch notes',
        });
    }
});
/**
 * GET /api/emr/all
 * Fetch all normalized EMR artifacts (care plans, medications, notes) for a patient
 *
 * Query params:
 * - patient_id (required): Patient identifier
 *
 * Returns: Combined Artifact[] array from all sources
 */
router.get('/all', async (req, res) => {
    try {
        const { patient_id } = req.query;
        // Validate required parameter
        if (!patient_id || typeof patient_id !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'patient_id query parameter is required',
            });
            return;
        }
        // Fetch and normalize all data
        const result = await emr_normalized_service_1.default.fetchAll(patient_id);
        // Return combined artifacts in standardized format
        res.json({
            success: true,
            data: result.artifacts,
            meta: {
                count: result.totalCount,
                byType: {
                    carePlans: result.byType.carePlans.length,
                    medications: result.byType.medications.length,
                    notes: result.byType.notes.length,
                },
                cached: result.cached,
                fetchTime: result.fetchTime,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('[EMR Routes] Fetch all error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch EMR data',
        });
    }
});
/**
 * DELETE /api/emr/cache
 * Clear all cached EMR data
 */
router.delete('/cache', (_req, res) => {
    try {
        emr_service_1.default.clearCache();
        res.json({
            success: true,
            message: 'Cache cleared successfully',
        });
    }
    catch (error) {
        console.error('[EMR Routes] Cache clear error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to clear cache',
        });
    }
});
/**
 * DELETE /api/emr/cache/:patientId
 * Clear cached EMR data for a specific patient
 */
router.delete('/cache/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        emr_service_1.default.clearPatientCache(patientId);
        res.json({
            success: true,
            message: `Cache cleared for patient ${patientId}`,
        });
    }
    catch (error) {
        console.error('[EMR Routes] Patient cache clear error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to clear patient cache',
        });
    }
});
/**
 * GET /api/emr/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (_req, res) => {
    try {
        const stats = emr_service_1.default.getCacheStats();
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('[EMR Routes] Cache stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to get cache stats',
        });
    }
});
exports.default = router;
//# sourceMappingURL=emr.routes.js.map