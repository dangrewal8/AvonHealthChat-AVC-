interface EnvConfig {
    avon: {
        clientId: string;
        clientSecret: string;
        baseUrl: string;
        account: string;
        userId: string;
    };
    ollama: {
        baseUrl: string;
        embeddingModel: string;
        embeddingDimensions: number;
        llmModel: string;
        llmMaxTokens: number;
        llmTemperature: number;
        timeout: number;
    };
    providers: {
        embedding: 'ollama';
        llm: 'ollama';
    };
    server: {
        port: number;
        nodeEnv: string;
    };
    vectorDb: {
        type: 'chromadb' | 'faiss';
    };
    faiss: {
        indexPath: string;
        dimension: number;
    };
    postgres?: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    cache: {
        enabled: boolean;
        ttlSeconds: number;
    };
    performance: {
        maxEmbeddingBatchSize: number;
        retrievalTopK: number;
    };
    cors: {
        origin: string[];
    };
    logging: {
        level: string;
    };
    security: {
        httpsRedirect: boolean;
        ipWhitelist: string[];
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
    };
}
declare const config: EnvConfig;
export default config;
//# sourceMappingURL=env.config.d.ts.map