import { Router, Request, Response } from 'express';
import authService from '../services/auth.service';
import createAuthenticatedClient from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/auth/status
 * Check authentication status and token info
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const tokenInfo = authService.getTokenInfo();

    res.json({
      authenticated: tokenInfo.hasToken,
      expiresIn: tokenInfo.expiresIn,
      message: tokenInfo.hasToken
        ? `Token valid for ${tokenInfo.expiresIn} seconds`
        : 'No token present. Will authenticate on first API call.',
    });
  } catch (error) {
    console.error('[Auth Routes] Status check failed:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Force a token refresh
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    console.log('[Auth Routes] Forcing token refresh...');

    // Clear existing token
    authService.clearToken();

    // Get new token
    await authService.getAccessToken();

    const tokenInfo = authService.getTokenInfo();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresIn: tokenInfo.expiresIn,
    });
  } catch (error) {
    console.error('[Auth Routes] Token refresh failed:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/auth/test
 * Test authenticated request to Avon Health API
 */
router.get('/test', async (_req: Request, res: Response) => {
  try {
    console.log('[Auth Routes] Testing authenticated request...');

    const client = createAuthenticatedClient();

    // Try to make a simple request to verify authentication works
    // This endpoint should exist in the Avon Health API
    const response = await client.get('/v2/ping');

    res.json({
      success: true,
      message: 'Authenticated request successful',
      apiResponse: response.data,
    });
  } catch (error) {
    console.error('[Auth Routes] Test request failed:', error);

    const err = error as any;
    res.status(err.response?.status || 500).json({
      error: 'Authenticated request failed',
      message: err.message,
      details: err.response?.data,
    });
  }
});

export default router;
