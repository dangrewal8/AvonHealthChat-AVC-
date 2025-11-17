"use strict";
/**
 * Authentication Service Usage Examples
 *
 * This file demonstrates how to use the OAuth2 authentication service
 * to make authenticated requests to the Avon Health API.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleAuthenticatedRequest = exampleAuthenticatedRequest;
exports.exampleCheckAuthStatus = exampleCheckAuthStatus;
exports.exampleParallelRequests = exampleParallelRequests;
exports.exampleManualTokenManagement = exampleManualTokenManagement;
exports.exampleErrorHandling = exampleErrorHandling;
exports.exampleExpressRoute = exampleExpressRoute;
exports.exampleBatchRequests = exampleBatchRequests;
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const auth_service_1 = __importDefault(require("../services/auth.service"));
/**
 * Example 1: Making authenticated API requests
 */
async function exampleAuthenticatedRequest() {
    // Create an authenticated client
    const client = (0, auth_middleware_1.default)();
    try {
        // Make requests - authentication is handled automatically
        const carePlans = await client.get('/v2/care_plans', {
            params: {
                patient_id: 'patient_123',
            },
        });
        console.log('Care plans fetched:', carePlans.data);
        return carePlans.data;
    }
    catch (error) {
        console.error('Failed to fetch care plans:', error);
        throw error;
    }
}
/**
 * Example 2: Checking authentication status before making requests
 */
async function exampleCheckAuthStatus() {
    // Check if we have a valid token
    const tokenInfo = auth_service_1.default.getTokenInfo();
    if (!tokenInfo.hasToken) {
        console.log('No token available, will fetch on first request');
    }
    else {
        console.log(`Token available, expires in ${tokenInfo.expiresIn} seconds`);
        if (tokenInfo.expiresIn && tokenInfo.expiresIn < 300) {
            console.log('Token expiring soon, consider refreshing');
        }
    }
}
/**
 * Example 3: Making multiple parallel authenticated requests
 */
async function exampleParallelRequests(patientId) {
    const client = (0, auth_middleware_1.default)();
    try {
        // All requests share the same token and queue if needed
        const [carePlans, medications, notes] = await Promise.all([
            client.get('/v2/care_plans', { params: { patient_id: patientId } }),
            client.get('/v2/medications', { params: { patient_id: patientId } }),
            client.get('/v2/notes', { params: { patient_id: patientId } }),
        ]);
        return {
            carePlans: carePlans.data,
            medications: medications.data,
            notes: notes.data,
        };
    }
    catch (error) {
        console.error('Failed to fetch patient data:', error);
        throw error;
    }
}
/**
 * Example 4: Manual token management
 */
async function exampleManualTokenManagement() {
    try {
        // Get a token manually
        const token = await auth_service_1.default.getAccessToken();
        console.log('Got token:', token.substring(0, 20) + '...');
        // Check token info
        const info = auth_service_1.default.getTokenInfo();
        console.log('Token info:', info);
        // Clear token if needed (force re-authentication)
        auth_service_1.default.clearToken();
        console.log('Token cleared');
        // Next request will fetch a new token
        const newToken = await auth_service_1.default.getAccessToken();
        console.log('Got new token:', newToken.substring(0, 20) + '...');
    }
    catch (error) {
        console.error('Token management failed:', error);
        throw error;
    }
}
/**
 * Example 5: Error handling with retries
 */
async function exampleErrorHandling(patientId) {
    const client = (0, auth_middleware_1.default)();
    try {
        const response = await client.get('/v2/care_plans', {
            params: { patient_id: patientId },
        });
        return response.data;
    }
    catch (error) {
        if (error.response) {
            // API returned an error response
            console.error('API Error:', {
                status: error.response.status,
                message: error.response.data,
            });
            if (error.response.status === 401) {
                // Should rarely happen - client auto-retries 401s
                throw new Error('Authentication failed after retry');
            }
            else if (error.response.status === 404) {
                throw new Error('Patient not found');
            }
            else if (error.response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
        }
        else if (error.code === 'ECONNABORTED') {
            // Timeout
            throw new Error('Request timeout - Avon Health API unreachable');
        }
        else {
            // Network or other error
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}
/**
 * Example 6: Using in an Express route
 */
function exampleExpressRoute() {
    return async (req, res) => {
        const { patient_id } = req.query;
        if (!patient_id) {
            return res.status(400).json({ error: 'patient_id is required' });
        }
        try {
            const client = (0, auth_middleware_1.default)();
            const carePlans = await client.get('/v2/care_plans', {
                params: { patient_id },
            });
            res.json({
                success: true,
                data: carePlans.data,
            });
        }
        catch (error) {
            console.error('Route error:', error);
            res.status(error.response?.status || 500).json({
                error: 'Failed to fetch care plans',
                message: error.message,
            });
        }
    };
}
/**
 * Example 7: Batch requests with authentication
 */
async function exampleBatchRequests(patientIds) {
    const client = (0, auth_middleware_1.default)();
    const results = await Promise.allSettled(patientIds.map(async (patientId) => {
        const response = await client.get('/v2/care_plans', {
            params: { patient_id: patientId },
        });
        return {
            patientId,
            data: response.data,
        };
    }));
    const successful = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
    const failed = results
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason);
    return {
        successful,
        failed,
        total: patientIds.length,
        successCount: successful.length,
        failureCount: failed.length,
    };
}
//# sourceMappingURL=auth.example.js.map