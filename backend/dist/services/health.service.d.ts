/**
 * Health Check Service
 *
 * Provides health check functionality for monitoring system status.
 * Supports Ollama provider with comprehensive diagnostics (HIPAA-compliant).
 *
 */
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
export declare class HealthService {
    private startTime;
    constructor();
    /**
     * Comprehensive health check
     */
    checkHealth(): Promise<HealthStatus>;
    /**
     * Get provider information
     */
    private getProviderInfo;
    /**
     * Check LLM service status (Ollama)
     */
    private checkLLM;
    /**
     * Check Embedding service status (Ollama)
     */
    private checkEmbedding;
    /**
     * Check Ollama service status
     */
    private checkOllama;
    /**
     * Check Avon Health API status
     */
    private checkAvonAPI;
    /**
     * Check Vector DB status
     */
    private checkVectorDB;
    /**
     * Check cache status
     */
    private checkCache;
    /**
     * Liveness probe
     * Returns true if the application is running
     */
    isAlive(): boolean;
    /**
     * Readiness probe
     * Returns true if the application is ready to handle requests
     */
    isReady(): Promise<boolean>;
    /**
     * Get system metrics
     */
    getSystemMetrics(): SystemMetrics;
    /**
     * Get application uptime
     */
    getUptime(): number;
}
export declare const healthService: HealthService;
//# sourceMappingURL=health.service.d.ts.map