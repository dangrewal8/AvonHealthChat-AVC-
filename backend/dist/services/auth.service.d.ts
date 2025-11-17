declare class AuthService {
    private token;
    private jwt;
    private isRefreshing;
    private requestQueue;
    private readonly authConfig;
    private readonly TOKEN_BUFFER_MS;
    private readonly MAX_RETRY_ATTEMPTS;
    private readonly RETRY_DELAY_MS;
    constructor();
    /**
     * Get the JWT token for the user
     */
    getJWT(): Promise<string>;
    /**
     * Get a valid access token. If token is expired or doesn't exist, fetch a new one.
     */
    getAccessToken(): Promise<string>;
    /**
     * Exchange client credentials for an access token
     */
    private fetchNewToken;
    /**
     * Refresh the access token and resolve queued requests
     */
    private refreshToken;
    /**
     * Check if the current token is valid
     */
    private isTokenValid;
    /**
     * Queue a request while token is being refreshed
     */
    private queueRequest;
    /**
     * Process all queued requests
     */
    private processQueue;
    /**
     * Clear stored token (force re-authentication)
     */
    clearToken(): void;
    /**
     * Get token info for debugging
     */
    getTokenInfo(): {
        hasToken: boolean;
        expiresIn?: number;
    };
    /**
     * Sleep utility for retry delays
     */
    private sleep;
}
export declare const authService: AuthService;
export default authService;
//# sourceMappingURL=auth.service.d.ts.map