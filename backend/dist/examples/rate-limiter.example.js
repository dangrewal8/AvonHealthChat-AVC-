"use strict";
/**
 * Rate Limiter Usage Examples
 *
 * Demonstrates:
 * - Basic rate limiting
 * - Sliding window algorithm
 * - Per-user, per-endpoint, and global limits
 * - Express middleware integration
 * - Rate limit headers
 * - Cleanup and maintenance
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicCheck = exampleBasicCheck;
exports.exampleSlidingWindow = exampleSlidingWindow;
exports.examplePerUserLimit = examplePerUserLimit;
exports.examplePerEndpointLimit = examplePerEndpointLimit;
exports.exampleGlobalLimit = exampleGlobalLimit;
exports.exampleRateLimitHeaders = exampleRateLimitHeaders;
exports.exampleRetryAfterHeader = exampleRetryAfterHeader;
exports.exampleCleanup = exampleCleanup;
exports.exampleReset = exampleReset;
exports.exampleCustomConfig = exampleCustomConfig;
exports.exampleExpressMiddleware = exampleExpressMiddleware;
exports.exampleCombinedMiddleware = exampleCombinedMiddleware;
exports.exampleRateLimitExceeded = exampleRateLimitExceeded;
exports.exampleRealWorldAPI = exampleRealWorldAPI;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const rate_limiter_middleware_1 = __importDefault(require("../middleware/rate-limiter.middleware"));
/**
 * Example 1: Basic rate limit check
 */
function exampleBasicCheck() {
    console.log('Example 1: Basic Rate Limit Check');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 5 };
    const userId = 'user_123';
    // Make 6 requests
    for (let i = 1; i <= 6; i++) {
        const result = rate_limiter_middleware_1.default.checkLimit(userId, config);
        console.log(`  Request ${i}:`);
        console.log('    Allowed:', result.allowed);
        console.log('    Remaining:', result.remaining);
        if (!result.allowed) {
            console.log('    Retry after:', result.retryAfter, 'seconds');
        }
        // Record request if allowed
        if (result.allowed) {
            rate_limiter_middleware_1.default.recordRequest(userId, config);
        }
    }
    console.log('\n  ✅ Success\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 2: Sliding window behavior
 */
async function exampleSlidingWindow() {
    console.log('Example 2: Sliding Window Behavior');
    console.log('-'.repeat(80));
    const config = { windowMs: 1000, max: 3 }; // 3 requests per second
    const userId = 'user_456';
    console.log('  Making 3 requests (should all pass):\n');
    // Make 3 requests
    for (let i = 1; i <= 3; i++) {
        const result = rate_limiter_middleware_1.default.checkLimit(userId, config);
        console.log(`    Request ${i}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
        if (result.allowed) {
            rate_limiter_middleware_1.default.recordRequest(userId, config);
        }
    }
    console.log('\n  4th request (should be blocked):\n');
    const result4 = rate_limiter_middleware_1.default.checkLimit(userId, config);
    console.log(`    Request 4: ${result4.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    console.log('\n  Waiting 1 second for window to slide...\n');
    // Wait for window to slide
    await new Promise(resolve => setTimeout(resolve, 1100));
    console.log('  5th request (should pass - oldest request expired):\n');
    const result5 = rate_limiter_middleware_1.default.checkLimit(userId, config);
    console.log(`    Request 5: ${result5.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    console.log('\n  ✅ Success (sliding window working)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 3: Per-user rate limiting
 */
function examplePerUserLimit() {
    console.log('Example 3: Per-User Rate Limiting');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 60 }; // 60 requests/minute
    const users = ['user_001', 'user_002', 'user_003'];
    console.log('  Rate limit: 60 requests/minute per user\n');
    users.forEach(userId => {
        // Make 3 requests per user
        for (let i = 0; i < 3; i++) {
            const result = rate_limiter_middleware_1.default.checkLimit(userId, config);
            if (result.allowed) {
                rate_limiter_middleware_1.default.recordRequest(userId, config);
            }
        }
        const remaining = rate_limiter_middleware_1.default.getRemainingQuota(userId, config);
        console.log(`    ${userId}: ${remaining} requests remaining`);
    });
    console.log('\n  ✅ Success (per-user tracking)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 4: Per-endpoint rate limiting
 */
function examplePerEndpointLimit() {
    console.log('Example 4: Per-Endpoint Rate Limiting');
    console.log('-'.repeat(80));
    const config = { windowMs: 1000, max: 10 }; // 10 requests/second
    const endpoints = [
        'endpoint:/api/query',
        'endpoint:/api/sessions',
        'endpoint:/api/health',
    ];
    console.log('  Rate limit: 10 requests/second per endpoint\n');
    endpoints.forEach(endpoint => {
        // Make 5 requests per endpoint
        for (let i = 0; i < 5; i++) {
            const result = rate_limiter_middleware_1.default.checkLimit(endpoint, config);
            if (result.allowed) {
                rate_limiter_middleware_1.default.recordRequest(endpoint, config);
            }
        }
        const remaining = rate_limiter_middleware_1.default.getRemainingQuota(endpoint, config);
        console.log(`    ${endpoint}: ${remaining} requests remaining`);
    });
    console.log('\n  ✅ Success (per-endpoint tracking)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 5: Global rate limiting
 */
function exampleGlobalLimit() {
    console.log('Example 5: Global Rate Limiting');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 1000 }; // 1000 requests/minute
    console.log('  Rate limit: 1000 requests/minute (global)\n');
    // Simulate 50 requests from various sources
    for (let i = 0; i < 50; i++) {
        const result = rate_limiter_middleware_1.default.checkLimit('global', config);
        if (result.allowed) {
            rate_limiter_middleware_1.default.recordRequest('global', config);
        }
    }
    const remaining = rate_limiter_middleware_1.default.getRemainingQuota('global', config);
    console.log('    Global requests made: 50');
    console.log('    Remaining quota:', remaining);
    console.log('\n  ✅ Success (global tracking)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 6: Rate limit headers
 */
function exampleRateLimitHeaders() {
    console.log('Example 6: Rate Limit Headers');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 60 };
    const userId = 'user_789';
    // Make a request
    rate_limiter_middleware_1.default.recordRequest(userId, config);
    const result = rate_limiter_middleware_1.default.checkLimit(userId, config);
    console.log('  Rate limit headers:\n');
    console.log('    X-RateLimit-Limit:', config.max);
    console.log('    X-RateLimit-Remaining:', result.remaining);
    console.log('    X-RateLimit-Reset:', new Date(result.resetTime).toISOString());
    console.log('\n  ✅ Success\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 7: Retry-After header
 */
function exampleRetryAfterHeader() {
    console.log('Example 7: Retry-After Header');
    console.log('-'.repeat(80));
    const config = { windowMs: 10000, max: 2 }; // 2 requests per 10 seconds
    const userId = 'user_101';
    console.log('  Making 3 requests (3rd should be blocked):\n');
    for (let i = 1; i <= 3; i++) {
        const result = rate_limiter_middleware_1.default.checkLimit(userId, config);
        console.log(`    Request ${i}:`);
        console.log('      Allowed:', result.allowed);
        if (!result.allowed) {
            console.log('      Retry-After:', result.retryAfter, 'seconds');
        }
        if (result.allowed) {
            rate_limiter_middleware_1.default.recordRequest(userId, config);
        }
    }
    console.log('\n  ✅ Success\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 8: Cleanup expired requests
 */
function exampleCleanup() {
    console.log('Example 8: Cleanup Expired Requests');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 60 };
    // Create requests for multiple users
    for (let i = 0; i < 10; i++) {
        rate_limiter_middleware_1.default.recordRequest(`user_${i}`, config);
    }
    console.log('  Before cleanup:');
    console.log('    Tracked keys:', rate_limiter_middleware_1.default.getRequestCount());
    // Cleanup
    rate_limiter_middleware_1.default.cleanup();
    console.log('\n  After cleanup:');
    console.log('    Tracked keys:', rate_limiter_middleware_1.default.getRequestCount());
    console.log('    (No change - requests still within window)');
    console.log('\n  ✅ Success\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 9: Reset rate limiter
 */
function exampleReset() {
    console.log('Example 9: Reset Rate Limiter');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 60 };
    // Make some requests
    for (let i = 0; i < 5; i++) {
        rate_limiter_middleware_1.default.recordRequest(`user_${i}`, config);
    }
    console.log('  Before reset:');
    console.log('    Tracked keys:', rate_limiter_middleware_1.default.getRequestCount());
    // Reset
    rate_limiter_middleware_1.default.reset();
    console.log('\n  After reset:');
    console.log('    Tracked keys:', rate_limiter_middleware_1.default.getRequestCount());
    console.log('\n  ✅ Success\n');
}
/**
 * Example 10: Custom rate limit configuration
 */
function exampleCustomConfig() {
    console.log('Example 10: Custom Rate Limit Configuration');
    console.log('-'.repeat(80));
    // Custom config: 5 requests per 10 seconds
    const customConfig = { windowMs: 10000, max: 5 };
    const userId = 'user_custom';
    console.log('  Custom rate limit: 5 requests per 10 seconds\n');
    for (let i = 1; i <= 6; i++) {
        const result = rate_limiter_middleware_1.default.checkLimit(userId, customConfig);
        console.log(`    Request ${i}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
        if (result.allowed) {
            rate_limiter_middleware_1.default.recordRequest(userId, customConfig);
        }
    }
    console.log('\n  ✅ Success (custom configuration)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 11: Express middleware simulation
 */
function exampleExpressMiddleware() {
    console.log('Example 11: Express Middleware Simulation');
    console.log('-'.repeat(80));
    // Simulate Express request/response
    const mockReq = {
        user: { id: 'user_express' },
        ip: '127.0.0.1',
        method: 'GET',
        path: '/api/query',
    };
    const mockRes = {
        headers: {},
        statusCode: 200,
        setHeader(key, value) {
            this.headers[key] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
        },
    };
    const mockNext = () => {
        console.log('    Next middleware called');
    };
    console.log('  Simulating Express middleware:\n');
    // Create middleware
    const middleware = rate_limiter_middleware_1.default.middleware('user');
    // Call middleware
    middleware(mockReq, mockRes, mockNext);
    console.log('    Status:', mockRes.statusCode);
    console.log('    Headers:', mockRes.headers);
    console.log('\n  ✅ Success\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 12: Combined middleware
 */
function exampleCombinedMiddleware() {
    console.log('Example 12: Combined Middleware');
    console.log('-'.repeat(80));
    console.log('  Combined middleware checks:');
    console.log('    1. Global limit (1000 req/min)');
    console.log('    2. User limit (60 req/min)');
    console.log('    3. Endpoint limit (10 req/sec)\n');
    const mockReq = {
        user: { id: 'user_combined' },
        ip: '127.0.0.1',
        method: 'POST',
        path: '/api/query',
    };
    const mockRes = {
        headers: {},
        statusCode: 200,
        setHeader(key, value) {
            this.headers[key] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
        },
    };
    const mockNext = () => {
        console.log('    All limits passed - request allowed');
    };
    // Create combined middleware
    const middleware = rate_limiter_middleware_1.default.combinedMiddleware();
    // Call middleware
    middleware(mockReq, mockRes, mockNext);
    console.log('\n  ✅ Success (combined limits checked)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 13: Rate limit exceeded scenario
 */
function exampleRateLimitExceeded() {
    console.log('Example 13: Rate Limit Exceeded Scenario');
    console.log('-'.repeat(80));
    const config = { windowMs: 60000, max: 3 };
    const userId = 'user_exceeded';
    console.log('  Making 4 requests (limit: 3):\n');
    for (let i = 1; i <= 4; i++) {
        const result = rate_limiter_middleware_1.default.checkLimit(userId, config);
        console.log(`    Request ${i}:`);
        console.log('      Status:', result.allowed ? 'ALLOWED' : 'BLOCKED');
        console.log('      Remaining:', result.remaining);
        if (!result.allowed) {
            console.log('      Error: Rate limit exceeded');
            console.log('      Retry after:', result.retryAfter, 'seconds');
        }
        if (result.allowed) {
            rate_limiter_middleware_1.default.recordRequest(userId, config);
        }
    }
    console.log('\n  ✅ Success (rate limit enforced)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 14: Real-world API scenario
 */
function exampleRealWorldAPI() {
    console.log('Example 14: Real-World API Scenario');
    console.log('-'.repeat(80));
    console.log('  Scenario: Patient query API\n');
    const userConfig = { windowMs: 60000, max: 60 };
    const endpointConfig = { windowMs: 1000, max: 10 };
    // Simulate 15 requests from same user to same endpoint
    const userId = 'user:patient_123';
    const endpoint = 'endpoint:POST:/api/query';
    console.log('  Making 15 rapid requests:\n');
    let allowedCount = 0;
    let blockedCount = 0;
    for (let i = 1; i <= 15; i++) {
        const userResult = rate_limiter_middleware_1.default.checkLimit(userId, userConfig);
        const endpointResult = rate_limiter_middleware_1.default.checkLimit(endpoint, endpointConfig);
        const allowed = userResult.allowed && endpointResult.allowed;
        if (allowed) {
            rate_limiter_middleware_1.default.recordRequest(userId, userConfig);
            rate_limiter_middleware_1.default.recordRequest(endpoint, endpointConfig);
            allowedCount++;
        }
        else {
            blockedCount++;
        }
        if (i <= 5 || i > 10) {
            console.log(`    Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
        }
        else if (i === 6) {
            console.log('    ...');
        }
    }
    console.log('\n  Summary:');
    console.log('    Allowed:', allowedCount);
    console.log('    Blocked:', blockedCount);
    console.log('    (Blocked by endpoint limit: 10 req/sec)');
    console.log('\n  ✅ Success (real-world scenario)\n');
    // Reset for next example
    rate_limiter_middleware_1.default.reset();
}
/**
 * Example 15: Explain rate limiter
 */
function exampleExplain() {
    console.log('Example 15: Explain Rate Limiter');
    console.log('-'.repeat(80));
    const explanation = rate_limiter_middleware_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('RATE LIMITER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBasicCheck();
        await exampleSlidingWindow();
        examplePerUserLimit();
        examplePerEndpointLimit();
        exampleGlobalLimit();
        exampleRateLimitHeaders();
        exampleRetryAfterHeader();
        exampleCleanup();
        exampleReset();
        exampleCustomConfig();
        exampleExpressMiddleware();
        exampleCombinedMiddleware();
        exampleRateLimitExceeded();
        exampleRealWorldAPI();
        exampleExplain();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=rate-limiter.example.js.map