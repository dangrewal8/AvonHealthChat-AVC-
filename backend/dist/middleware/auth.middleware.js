"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthenticatedClient = createAuthenticatedClient;
exports.validateAuthMiddleware = validateAuthMiddleware;
const axios_1 = __importDefault(require("axios"));
const auth_service_1 = __importDefault(require("../services/auth.service"));
const env_config_1 = __importDefault(require("../config/env.config"));
/**
 * Create an authenticated Axios instance for Avon Health API requests
 * Automatically attaches access tokens and handles 401 errors
 */
function createAuthenticatedClient() {
    const client = axios_1.default.create({
        baseURL: env_config_1.default.avon.baseUrl,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // Request interceptor: Attach access token, JWT, and account to all requests
    client.interceptors.request.use(async (config) => {
        try {
            const accessToken = await auth_service_1.default.getAccessToken();
            const jwt = await auth_service_1.default.getJWT();
            if (!config.headers) {
                config.headers = {};
            }
            config.headers.Authorization = `Bearer ${accessToken}`;
            config.headers['x-jwt'] = jwt;
            config.headers['account'] = env_config_1.default.avon.account;
            console.log(`[Auth Middleware] Request to ${config.url} with Bearer, JWT, and account`);
            return config;
        }
        catch (error) {
            console.error('[Auth Middleware] Failed to attach tokens:', error);
            return Promise.reject(error);
        }
    }, (error) => {
        console.error('[Auth Middleware] Request error:', error);
        return Promise.reject(error);
    });
    // Response interceptor: Handle 401 errors and retry
    client.interceptors.response.use((response) => {
        return response;
    }, async (error) => {
        const originalRequest = error.config;
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('[Auth Middleware] 401 Unauthorized - clearing token and retrying');
            try {
                // Clear the invalid token
                auth_service_1.default.clearToken();
                // Get a new token
                const newToken = await auth_service_1.default.getAccessToken();
                // Update the authorization header
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                console.log('[Auth Middleware] Retrying request with new token');
                // Retry the original request
                return client(originalRequest);
            }
            catch (retryError) {
                console.error('[Auth Middleware] Retry failed:', retryError);
                return Promise.reject(retryError);
            }
        }
        // For non-401 errors or already retried requests, reject
        return Promise.reject(error);
    });
    return client;
}
/**
 * Express middleware to check if authentication is working
 * Can be used in routes that need to verify Avon Health API connectivity
 */
async function validateAuthMiddleware(_req, res, next) {
    try {
        const tokenInfo = auth_service_1.default.getTokenInfo();
        if (!tokenInfo.hasToken) {
            console.log('[Auth Middleware] No token present, will fetch on first API call');
        }
        else {
            console.log(`[Auth Middleware] Token valid for ${tokenInfo.expiresIn}s`);
        }
        next();
    }
    catch (error) {
        console.error('[Auth Middleware] Auth validation failed:', error);
        res.status(500).json({
            error: 'Authentication service error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
exports.default = createAuthenticatedClient;
//# sourceMappingURL=auth.middleware.js.map