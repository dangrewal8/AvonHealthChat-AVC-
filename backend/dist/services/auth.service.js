"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_config_1 = __importDefault(require("../config/env.config"));
class AuthService {
    token = null;
    jwt = null;
    isRefreshing = false;
    requestQueue = [];
    authConfig;
    TOKEN_BUFFER_MS = 60000; // Refresh 1 minute before expiry
    MAX_RETRY_ATTEMPTS = 3;
    RETRY_DELAY_MS = 1000;
    constructor() {
        this.authConfig = {
            clientId: env_config_1.default.avon.clientId,
            clientSecret: env_config_1.default.avon.clientSecret,
            baseUrl: env_config_1.default.avon.baseUrl,
            tokenEndpoint: '/v2/auth/token',
        };
    }
    /**
     * Get the JWT token for the user
     */
    async getJWT() {
        if (this.jwt) {
            return this.jwt;
        }
        // Get access token first
        const accessToken = await this.getAccessToken();
        // Fetch JWT token
        const jwtUrl = `${this.authConfig.baseUrl}/v2/auth/get-jwt`;
        try {
            const response = await axios_1.default.post(jwtUrl, { id: env_config_1.default.avon.userId }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            if (!response.data.jwt) {
                throw new Error('No JWT token in response');
            }
            this.jwt = response.data.jwt;
            console.log('[Auth] ✓ JWT token acquired');
            return this.jwt;
        }
        catch (error) {
            console.error('[Auth] Failed to get JWT token:', error);
            throw new Error('Failed to obtain JWT token');
        }
    }
    /**
     * Get a valid access token. If token is expired or doesn't exist, fetch a new one.
     */
    async getAccessToken() {
        if (this.isTokenValid()) {
            return this.token.accessToken;
        }
        if (this.isRefreshing) {
            return this.queueRequest();
        }
        return this.refreshToken();
    }
    /**
     * Exchange client credentials for an access token
     */
    async fetchNewToken(attempt = 1) {
        try {
            const tokenUrl = `${this.authConfig.baseUrl}${this.authConfig.tokenEndpoint}`;
            console.log(`[Auth] Fetching new token (attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS})`);
            const response = await axios_1.default.post(tokenUrl, `client_id=${encodeURIComponent(this.authConfig.clientId)}&client_secret=${encodeURIComponent(this.authConfig.clientSecret)}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 10000,
            });
            const { access_token, expires_in, token_type } = response.data;
            if (!access_token || !expires_in) {
                throw new Error('Invalid token response: missing access_token or expires_in');
            }
            console.log(`[Auth] ✓ Token acquired successfully, expires in ${expires_in}s`);
            return {
                accessToken: access_token,
                expiresIn: expires_in,
                tokenType: token_type || 'Bearer',
            };
        }
        catch (error) {
            const axiosError = error;
            if (attempt < this.MAX_RETRY_ATTEMPTS) {
                const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`[Auth] Token fetch failed, retrying in ${delay}ms...`);
                await this.sleep(delay);
                return this.fetchNewToken(attempt + 1);
            }
            if (axiosError.response) {
                console.error('[Auth] Token fetch failed:', {
                    status: axiosError.response.status,
                    data: axiosError.response.data,
                });
                throw new Error(`OAuth2 authentication failed: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
            }
            else if (axiosError.code === 'ECONNABORTED') {
                throw new Error('OAuth2 authentication timeout');
            }
            else {
                throw new Error(`OAuth2 authentication failed: ${axiosError.message}`);
            }
        }
    }
    /**
     * Refresh the access token and resolve queued requests
     */
    async refreshToken() {
        this.isRefreshing = true;
        try {
            const tokenResponse = await this.fetchNewToken();
            // Store token with expiration time
            const expiresAt = Date.now() + tokenResponse.expiresIn * 1000;
            this.token = {
                accessToken: tokenResponse.accessToken,
                expiresAt,
                tokenType: tokenResponse.tokenType,
            };
            // Resolve all queued requests with the new token
            this.processQueue(null, tokenResponse.accessToken);
            return tokenResponse.accessToken;
        }
        catch (error) {
            // Reject all queued requests
            this.processQueue(error, null);
            throw error;
        }
        finally {
            this.isRefreshing = false;
        }
    }
    /**
     * Check if the current token is valid
     */
    isTokenValid() {
        if (!this.token) {
            return false;
        }
        // Consider token invalid if it expires within the buffer time
        const now = Date.now();
        const expiresWithBuffer = this.token.expiresAt - this.TOKEN_BUFFER_MS;
        return now < expiresWithBuffer;
    }
    /**
     * Queue a request while token is being refreshed
     */
    queueRequest() {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ resolve, reject });
        });
    }
    /**
     * Process all queued requests
     */
    processQueue(error, token) {
        this.requestQueue.forEach((request) => {
            if (error) {
                request.reject(error);
            }
            else if (token) {
                request.resolve(token);
            }
        });
        this.requestQueue = [];
    }
    /**
     * Clear stored token (force re-authentication)
     */
    clearToken() {
        console.log('[Auth] Token cleared');
        this.token = null;
        this.jwt = null;
    }
    /**
     * Get token info for debugging
     */
    getTokenInfo() {
        if (!this.token) {
            return { hasToken: false };
        }
        const expiresIn = Math.floor((this.token.expiresAt - Date.now()) / 1000);
        return {
            hasToken: true,
            expiresIn: expiresIn > 0 ? expiresIn : 0,
        };
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.authService = new AuthService();
exports.default = exports.authService;
//# sourceMappingURL=auth.service.js.map