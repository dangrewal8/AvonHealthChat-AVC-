import { AxiosInstance } from 'axios';
/**
 * Create an authenticated Axios instance for Avon Health API requests
 * Automatically attaches access tokens and handles 401 errors
 */
export declare function createAuthenticatedClient(): AxiosInstance;
/**
 * Express middleware to check if authentication is working
 * Can be used in routes that need to verify Avon Health API connectivity
 */
export declare function validateAuthMiddleware(_req: any, res: any, next: any): Promise<void>;
export default createAuthenticatedClient;
//# sourceMappingURL=auth.middleware.d.ts.map