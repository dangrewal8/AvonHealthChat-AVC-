/**
 * Avon Health RAG System - Backend API Server
 * HIPAA-compliant Medical AI System
 *
 * Tech Stack: Node.js + Express + TypeScript + Ollama
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';
import apiRoutes, { initializeServices } from './routes/api.routes';
import { OllamaService } from './services/ollama.service';
import { AvonHealthService } from './services/avonhealth.service';
import type { AppConfig } from './types';

// Load environment variables
dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const config: AppConfig = {
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
    type: (process.env.VECTOR_DB_TYPE as 'faiss' | 'chromadb') || 'faiss',
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

const app: Express = express();

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet - Security headers
app.use(
  helmet({
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
  })
);

// CORS - Allow frontend access
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================================================
// General Middleware
// ============================================================================

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request timeout
app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(300000); // 5 minutes for LLM requests
  res.setTimeout(300000);
  next();
});

// ============================================================================
// Initialize Services
// ============================================================================

let ollamaService: OllamaService;
let avonHealthService: AvonHealthService;

async function initializeApp() {
  console.log('🚀 Initializing Avon Health RAG System...');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Port: ${config.port}`);

  // Initialize Ollama service
  console.log('📡 Connecting to Ollama...');
  ollamaService = new OllamaService(
    config.ollama.baseUrl,
    config.ollama.embeddingModel,
    config.ollama.llmModel,
    config.ollama.maxTokens,
    config.ollama.temperature
  );

  // Check Ollama health
  const ollamaHealthy = await ollamaService.healthCheck();
  if (!ollamaHealthy) {
    console.warn('⚠️  WARNING: Ollama service not available at', config.ollama.baseUrl);
    console.warn('   Make sure Ollama is running: ollama serve');
    console.warn('   The server will start but queries will fail.');
  } else {
    console.log('✅ Ollama connected successfully');
  }

  // Initialize Avon Health service
  console.log('🏥 Connecting to Avon Health API...');
  avonHealthService = new AvonHealthService(config.avonHealth);

  if (!config.avonHealth.client_id || !config.avonHealth.client_secret) {
    console.warn('⚠️  WARNING: Avon Health API credentials not configured');
    console.warn('   Set AVON_CLIENT_ID and AVON_CLIENT_SECRET in .env');
  } else if (!config.avonHealth.account || !config.avonHealth.user_id) {
    console.warn('⚠️  WARNING: Avon Health API account details not configured');
    console.warn('   Set AVON_ACCOUNT and AVON_USER_ID in .env');
  } else {
    const avonHealthy = await avonHealthService.healthCheck();
    if (avonHealthy) {
      console.log('✅ Avon Health API connected successfully (OAuth2 + JWT)');
    } else {
      console.warn('⚠️  WARNING: Avon Health API authentication failed');
      console.warn('   Check AVON_ACCOUNT and AVON_USER_ID are correct');
    }
  }

  // Initialize route services
  initializeServices(ollamaService, avonHealthService);
  console.log('✅ Services initialized');
}

// ============================================================================
// Routes
// ============================================================================

// Health check routes (no auth required)
app.use('/', healthRoutes);

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
  } catch (error) {
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

export default app;
