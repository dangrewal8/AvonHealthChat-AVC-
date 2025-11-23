"use strict";
/**
 * Avon Health RAG System - Backend API Server
 * HIPAA-compliant Medical AI System
 *
 * Tech Stack: Node.js + Express + TypeScript + Ollama
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const api_routes_1 = __importStar(require("./routes/api.routes"));
const ollama_service_1 = require("./services/ollama.service");
const avonhealth_service_1 = require("./services/avonhealth.service");
const model_manager_service_1 = require("./services/model-manager.service");
// Load environment variables
dotenv_1.default.config();
// ============================================================================
// Configuration
// ============================================================================
const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    avonHealth: {
        client_id: process.env.AVON_CLIENT_ID || '',
        client_secret: process.env.AVON_CLIENT_SECRET || '',
        base_url: process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com',
        account: process.env.AVON_ACCOUNT || '',
        user_id: process.env.AVON_USER_ID || '',
    },
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
        llmModel: process.env.OLLAMA_LLM_MODEL || 'meditron',
        maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '4096', 10),
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.1'),
    },
    vectorDb: {
        type: process.env.VECTOR_DB_TYPE || 'faiss',
        dimension: parseInt(process.env.FAISS_DIMENSION || '768', 10),
        indexPath: process.env.FAISS_INDEX_PATH || './data/faiss',
    },
    cache: {
        enabled: process.env.CACHE_ENABLED === 'true',
        ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
    },
};
// ============================================================================
// Initialize Express App
// ============================================================================
const app = (0, express_1.default)();
// Trust proxy - Required for Cloudflare Tunnel and rate limiting
app.set('trust proxy', true);
// ============================================================================
// Security Middleware
// ============================================================================
// Helmet - Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
// CORS - Allow frontend access
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['*'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list or if we allow all origins
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate Limiting - Protect against brute force and DDoS
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for health check endpoint
    skip: (req) => req.path === '/health',
    // Disable trust proxy validation since we're using Cloudflare Tunnel
    validate: { trustProxy: false },
});
// Apply rate limiting to all API routes
app.use('/api', limiter);
// ============================================================================
// General Middleware
// ============================================================================
// Body parsers
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
if (config.nodeEnv === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Request timeout
app.use((req, res, next) => {
    req.setTimeout(300000); // 5 minutes for LLM requests
    res.setTimeout(300000);
    next();
});
// ============================================================================
// Initialize Services
// ============================================================================
let ollamaService;
let avonHealthService;
let modelManager;
async function initializeApp() {
    console.log('🚀 Initializing Avon Health RAG System...');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Port: ${config.port}`);
    // Initialize Model Manager
    console.log('🤖 Initializing Multi-Model System...');
    modelManager = new model_manager_service_1.ModelManagerService(config.ollama.baseUrl);
    // Check health of all models
    await modelManager.checkModelsHealth(true);
    console.log('✅ Model Manager initialized');
    // Initialize Ollama service
    console.log('📡 Connecting to Ollama...');
    ollamaService = new ollama_service_1.OllamaService(config.ollama.baseUrl, config.ollama.embeddingModel, config.ollama.llmModel, config.ollama.maxTokens, config.ollama.temperature);
    // Check Ollama health
    const ollamaHealthy = await ollamaService.healthCheck();
    if (!ollamaHealthy) {
        console.warn('⚠️  WARNING: Ollama service not available at', config.ollama.baseUrl);
        console.warn('   Make sure Ollama is running: ollama serve');
        console.warn('   The server will start but queries will fail.');
    }
    else {
        console.log('✅ Ollama connected successfully');
    }
    // Initialize Avon Health service
    console.log('🏥 Connecting to Avon Health API...');
    avonHealthService = new avonhealth_service_1.AvonHealthService(config.avonHealth);
    if (!config.avonHealth.client_id || !config.avonHealth.client_secret) {
        console.warn('⚠️  WARNING: Avon Health API credentials not configured');
        console.warn('   Set AVON_CLIENT_ID and AVON_CLIENT_SECRET in .env');
    }
    else {
        const avonHealthy = await avonHealthService.healthCheck();
        if (avonHealthy) {
            console.log('✅ Avon Health API connected successfully (TWO-KEY: Bearer + JWT)');
        }
        else {
            console.warn('⚠️  WARNING: Avon Health API authentication failed');
            console.warn('   Check credentials and ensure user_id is correct');
        }
    }
    // Initialize route services
    (0, api_routes_1.initializeServices)(ollamaService, avonHealthService, modelManager);
    console.log('✅ Services initialized');
}
// ============================================================================
// Routes
// ============================================================================
// Health check routes (no auth required)
app.use('/', health_routes_1.default);
// API routes
app.use('/api', api_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: [
            'GET /health',
            'POST /api/query',
            'GET /api/queries/recent',
            'GET /api/emr/care_plans',
            'GET /api/emr/medications',
            'GET /api/emr/notes',
            'GET /api/emr/all',
            'POST /api/index/patient/:id',
        ],
    });
});
// ============================================================================
// Error Handler
// ============================================================================
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
        ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
});
// ============================================================================
// Start Server
// ============================================================================
async function startServer() {
    try {
        await initializeApp();
        app.listen(config.port, '0.0.0.0', () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('🏥 Avon Health RAG System - Backend API');
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
            console.log(`🌐 Server running on: http://localhost:${config.port}`);
            console.log(`📊 Health check:      http://localhost:${config.port}/health`);
            console.log(`🔍 API endpoint:      http://localhost:${config.port}/api/query`);
            console.log('');
            console.log('Press Ctrl+C to stop');
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map