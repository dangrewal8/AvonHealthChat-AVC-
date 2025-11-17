import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import authService from '../services/auth.service';
import appConfig from '../config/env.config';

/**
 * Create an authenticated Axios instance for Avon Health API requests
 * Automatically attaches access tokens and handles 401 errors
 */
export function createAuthenticatedClient(): AxiosInstance {
  const client = axios.create({
    baseURL: appConfig.avon.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Attach access token, JWT, and account to all requests
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const accessToken = await authService.getAccessToken();
        const jwt = await authService.getJWT();

        if (!config.headers) {
          config.headers = {} as any;
        }

        config.headers.Authorization = `Bearer ${accessToken}`;
        config.headers['x-jwt'] = jwt;
        config.headers['account'] = appConfig.avon.account;

        console.log(`[Auth Middleware] Request to ${config.url} with Bearer, JWT, and account`);

        return config;
      } catch (error) {
        console.error('[Auth Middleware] Failed to attach tokens:', error);
        return Promise.reject(error);
      }
    },
    (error) => {
      console.error('[Auth Middleware] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle 401 errors and retry
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        console.log('[Auth Middleware] 401 Unauthorized - clearing token and retrying');

        try {
          // Clear the invalid token
          authService.clearToken();

          // Get a new token
          const newToken = await authService.getAccessToken();

          // Update the authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          console.log('[Auth Middleware] Retrying request with new token');

          // Retry the original request
          return client(originalRequest);
        } catch (retryError) {
          console.error('[Auth Middleware] Retry failed:', retryError);
          return Promise.reject(retryError);
        }
      }

      // For non-401 errors or already retried requests, reject
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Express middleware to check if authentication is working
 * Can be used in routes that need to verify Avon Health API connectivity
 */
export async function validateAuthMiddleware(
  _req: any,
  res: any,
  next: any
): Promise<void> {
  try {
    const tokenInfo = authService.getTokenInfo();

    if (!tokenInfo.hasToken) {
      console.log('[Auth Middleware] No token present, will fetch on first API call');
    } else {
      console.log(`[Auth Middleware] Token valid for ${tokenInfo.expiresIn}s`);
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] Auth validation failed:', error);
    res.status(500).json({
      error: 'Authentication service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default createAuthenticatedClient;
