"use strict";
/**
 * Consolidated API Routes
 * Main router that combines all API endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
const express_1 = __importDefault(require("express"));
const emr_routes_1 = __importDefault(require("./emr.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const evaluation_routes_1 = require("./evaluation.routes");
const health_routes_1 = require("./health.routes");
const query_controller_1 = __importDefault(require("../controllers/query.controller"));
const indexing_controller_1 = __importDefault(require("../controllers/indexing.controller"));
const metrics_controller_1 = __importDefault(require("../controllers/metrics.controller"));
const validation_middleware_1 = require("../middleware/validation.middleware");
/**
 * Create and configure the main application router
 */
const createRouter = () => {
    const router = express_1.default.Router();
    // ========================================================================
    // Query Endpoints
    // ========================================================================
    /**
     * POST /api/query
     * Process a natural language query against patient EMR data
     */
    router.post('/api/query', validation_middleware_1.validateQueryRequest, query_controller_1.default.search.bind(query_controller_1.default));
    /**
     * POST /api/query/stream
     * Process query with Server-Sent Events for real-time progress updates
     * Streams 3 stages: query_understanding, retrieval, generation
     */
    router.post('/api/query/stream', validation_middleware_1.validateQueryRequest, query_controller_1.default.searchStream.bind(query_controller_1.default));
    /**
     * GET /api/queries/recent
     * Get recent queries for a patient
     */
    router.get('/api/queries/recent', validation_middleware_1.validateRecentQueriesRequest, query_controller_1.default.getRecent.bind(query_controller_1.default));
    // ========================================================================
    // Human Evaluation Endpoints
    // ========================================================================
    /**
     * All evaluation routes:
     * - POST /api/evaluations - Submit new evaluation
     * - GET /api/evaluations - Get evaluations with filtering
     * - GET /api/evaluations/statistics - Get evaluation statistics
     * - GET /api/evaluations/report - Generate evaluation report
     * - GET /api/evaluations/export/csv - Export to CSV
     * - GET /api/evaluations/export/json - Export to JSON
     * - GET /api/evaluations/:id - Get single evaluation by ID
     */
    router.use('/api/evaluations', (0, evaluation_routes_1.createEvaluationRoutes)());
    // ========================================================================
    // EMR Data Endpoints (existing)
    // ========================================================================
    /**
     * All EMR data routes:
     * - GET /api/emr/care_plans
     * - GET /api/emr/medications
     * - GET /api/emr/notes
     * - GET /api/emr/all
     * - DELETE /api/emr/cache
     * - DELETE /api/emr/cache/:patientId
     * - GET /api/emr/cache/stats
     */
    router.use('/api/emr', emr_routes_1.default);
    // ========================================================================
    // Authentication Endpoints (existing)
    // ========================================================================
    /**
     * All auth routes:
     * - GET /api/auth/status
     * - POST /api/auth/refresh
     * - GET /api/auth/test
     */
    router.use('/api/auth', auth_routes_1.default);
    // ========================================================================
    // Indexing Endpoints
    // ========================================================================
    /**
     * POST /api/index/patient/:patientId
     * Index all EMR data for a patient
     */
    router.post('/api/index/patient/:patientId', validation_middleware_1.validatePatientIdParam, validation_middleware_1.validateIndexRequest, indexing_controller_1.default.indexPatient.bind(indexing_controller_1.default));
    /**
     * DELETE /api/index/patient/:patientId
     * Clear all indexed data for a patient
     */
    router.delete('/api/index/patient/:patientId', validation_middleware_1.validatePatientIdParam, indexing_controller_1.default.clearPatient.bind(indexing_controller_1.default));
    // ========================================================================
    // Health & Monitoring Endpoints
    // ========================================================================
    /**
     * All health check routes:
     * - GET /health - Comprehensive health check
     * - GET /health/live - Liveness probe (is app running?)
     * - GET /health/ready - Readiness probe (can app handle requests?)
     * - GET /health/metrics - Application and system metrics
     * - GET /health/system - System metrics only
     */
    router.use((0, health_routes_1.createHealthRouter)());
    /**
     * GET /api/metrics
     * Performance and usage metrics (legacy endpoint)
     */
    router.get('/api/metrics', metrics_controller_1.default.get.bind(metrics_controller_1.default));
    return router;
};
exports.createRouter = createRouter;
exports.default = exports.createRouter;
//# sourceMappingURL=index.js.map