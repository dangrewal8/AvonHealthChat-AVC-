# Authentication Service

OAuth2 client credentials authentication for Avon Health API.

## Overview

The authentication service handles:
- OAuth2 client credentials flow
- Automatic token refresh before expiration
- In-memory token storage
- Retry logic with exponential backoff
- Request queuing during token refresh
- 401 error handling and re-authentication

## Usage

### Basic Usage

```typescript
import authService from './services/auth.service';

// Get a valid access token
const token = await authService.getAccessToken();
console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### With Authenticated Client (Recommended)

```typescript
import createAuthenticatedClient from './middleware/auth.middleware';

// Create an axios client with automatic authentication
const client = createAuthenticatedClient();

// Make authenticated requests - tokens are handled automatically
const response = await client.get('/v2/care_plans?patient_id=123');
```

### Manual Token Management

```typescript
import authService from './services/auth.service';

// Check token status
const info = authService.getTokenInfo();
console.log(info);
// { hasToken: true, expiresIn: 3540 }

// Clear token (force re-authentication on next request)
authService.clearToken();

// Get new token
const newToken = await authService.getAccessToken();
```

## Features

### 1. Automatic Token Refresh

Tokens are automatically refreshed 60 seconds before expiration.

```typescript
// First call - fetches new token
const token1 = await authService.getAccessToken();

// Subsequent calls - returns cached token
const token2 = await authService.getAccessToken(); // Same token

// Wait until near expiration...
// Next call - automatically fetches new token
const token3 = await authService.getAccessToken(); // New token
```

### 2. Request Queuing

If multiple requests need a token while one is being refreshed, they are queued:

```typescript
// All three requests will queue and get the same new token
const [token1, token2, token3] = await Promise.all([
  authService.getAccessToken(),
  authService.getAccessToken(),
  authService.getAccessToken(),
]);
```

### 3. Retry Logic

Failed authentication requests are retried with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay

```typescript
try {
  const token = await authService.getAccessToken();
} catch (error) {
  // All 3 attempts failed
  console.error('Authentication failed:', error);
}
```

### 4. 401 Error Handling

The authenticated client automatically handles 401 errors:

```typescript
const client = createAuthenticatedClient();

try {
  // If this returns 401, the client will:
  // 1. Clear the invalid token
  // 2. Fetch a new token
  // 3. Retry the request with the new token
  const response = await client.get('/v2/notes');
} catch (error) {
  // Only thrown if retry also fails
  console.error('Request failed:', error);
}
```

## API Endpoints

### GET /api/auth/status

Check current authentication status.

**Response:**
```json
{
  "authenticated": true,
  "expiresIn": 3540,
  "message": "Token valid for 3540 seconds"
}
```

### POST /api/auth/refresh

Force a token refresh.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "expiresIn": 3600
}
```

### GET /api/auth/test

Test an authenticated request to Avon Health API.

**Response:**
```json
{
  "success": true,
  "message": "Authenticated request successful",
  "apiResponse": { ... }
}
```

## Configuration

Required environment variables:

```env
AVON_CLIENT_ID=your_client_id
AVON_CLIENT_SECRET=your_client_secret
AVON_BASE_URL=https://demo-api.avonhealth.com
```

## Token Storage

Tokens are stored **in-memory only** for security:

```typescript
interface StoredToken {
  accessToken: string;
  expiresAt: number;     // Unix timestamp
  tokenType: string;     // "Bearer"
}
```

Benefits:
- No persistence to disk
- Tokens cleared on server restart
- No risk of token leakage through file system

## Error Handling

### Authentication Errors

```typescript
try {
  const token = await authService.getAccessToken();
} catch (error) {
  if (error.message.includes('OAuth2 authentication failed: 401')) {
    // Invalid credentials
    console.error('Check AVON_CLIENT_ID and AVON_CLIENT_SECRET');
  } else if (error.message.includes('timeout')) {
    // Network timeout
    console.error('Avon Health API unreachable');
  } else {
    // Other errors
    console.error('Authentication error:', error.message);
  }
}
```

### Request Errors with Authenticated Client

```typescript
const client = createAuthenticatedClient();

try {
  const response = await client.get('/v2/invalid_endpoint');
} catch (error) {
  if (error.response?.status === 401) {
    // Should not happen - client auto-retries 401s
    console.error('Authentication failed after retry');
  } else if (error.response?.status === 404) {
    console.error('Endpoint not found');
  } else {
    console.error('Request failed:', error.message);
  }
}
```

## Testing

### Test Authentication Status

```bash
curl http://localhost:3001/api/auth/status
```

### Force Token Refresh

```bash
curl -X POST http://localhost:3001/api/auth/refresh
```

### Test Authenticated Request

```bash
curl http://localhost:3001/api/auth/test
```

## Implementation Details

### Token Expiration Buffer

Tokens are considered expired 60 seconds before actual expiration to prevent race conditions:

```typescript
const TOKEN_BUFFER_MS = 60000; // 60 seconds

// Token expires at: now + 3600s
// Token considered expired at: now + 3600s - 60s = now + 3540s
```

### Exponential Backoff

Retry delays follow exponential backoff:

```typescript
const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);

// Attempt 1: 1000 * 2^0 = 1000ms
// Attempt 2: 1000 * 2^1 = 2000ms
// Attempt 3: 1000 * 2^2 = 4000ms
```

## Security Best Practices

✅ **Tokens stored in memory only**
✅ **Tokens never logged to console**
✅ **Automatic token rotation**
✅ **Invalid tokens cleared immediately**
✅ **HTTPS enforced in production**
✅ **Client credentials never exposed to frontend**

## Common Issues

### "Missing required environment variable: AVON_CLIENT_ID"

**Solution:** Copy `.env.example` to `.env` and add your credentials

### "OAuth2 authentication timeout"

**Solution:** Check network connectivity to `AVON_BASE_URL`

### "OAuth2 authentication failed: 401"

**Solution:** Verify `AVON_CLIENT_ID` and `AVON_CLIENT_SECRET` are correct

### Tokens not refreshing

**Solution:** Check server logs for errors. Token should auto-refresh 60 seconds before expiry.
