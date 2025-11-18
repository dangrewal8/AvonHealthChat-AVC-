# Avon Health API Authentication & Debugging Guide

## Two-Step JWT Authentication Flow

The system now implements a secure two-step authentication process to access Avon Health EMR endpoints:

### Step 1: OAuth2 Bearer Token
```
POST /oauth2/token
Body: {
  grant_type: "client_credentials",
  client_id: "<your_client_id>",
  client_secret: "<your_client_secret>"
}
Response: {
  access_token: "<bearer_token>",
  token_type: "Bearer",
  expires_in: 3600
}
```

### Step 2: JWT Token Exchange
```
POST /v2/auth/jwt
Headers: {
  Authorization: "Bearer <bearer_token>"
}
Body: {
  account: "<your_account>",
  user_id: "<your_user_id>"
}
Response: {
  jwt_token: "<jwt_token>",
  expires_in: 3600
}
```

### Step 3: EMR Data Access
```
GET /v2/care_plans?patient_id=<patient_id>
Headers: {
  Authorization: "Bearer <jwt_token>"
}
```

## Environment Variables Required

Add these to your `.env` file:

```env
# OAuth2 Credentials (Step 1)
AVON_CLIENT_ID=your_client_id_here
AVON_CLIENT_SECRET=your_client_secret_here
AVON_BASE_URL=https://demo-api.avonhealth.com

# JWT Parameters (Step 2)
AVON_ACCOUNT=your_account_here
AVON_USER_ID=your_user_id_here
```

## Debugging 401 Errors

### Common Causes & Solutions

#### 1. Invalid OAuth2 Credentials
**Symptom:** Bearer token request fails (Step 1)
**Check:**
```bash
# Look for this error in logs:
❌ OAuth2 token error: ...
```
**Solution:**
- Verify `AVON_CLIENT_ID` and `AVON_CLIENT_SECRET` are correct
- Ensure credentials are active in Avon Health dashboard
- Check base URL is correct

#### 2. Invalid Account or User ID
**Symptom:** JWT token exchange fails (Step 2)
**Check:**
```bash
# Look for this error in logs:
❌ JWT token error: ...
   Account: demo_account
   User ID: demo_user_123
```
**Solution:**
- Verify `AVON_ACCOUNT` matches your organization's account name
- Verify `AVON_USER_ID` is a valid user in your account
- Contact Avon Health support to confirm account details

#### 3. Wrong Patient ID Format
**Symptom:** EMR endpoints return 401 even with valid JWT token
**Check:**
```bash
# Look for these errors in logs:
📡 Making GET request to /v2/care_plans?patient_id=demo_user_123
❌ Avon Health API error (/v2/care_plans?patient_id=demo_user_123):
   Status: 401
```
**Solution:**

The `patient_id` parameter might need a different format than `user_id`. Try these patterns:

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `user_id` as-is | `demo_user_123` | Default - try first |
| Numeric only | `123` | If IDs have prefixes |
| `patient_` prefix | `patient_demo_user_123` | If API uses patient namespace |
| `user_` prefix | `user_demo_user_123` | If API uses user namespace |

**Automated Testing:**
The service includes a test method to try different patterns:
```typescript
await avonHealthService.testPatientIdFormats();
```

This will automatically test common patterns and report which one works.

#### 4. JWT Token Expired
**Symptom:** Works initially, then starts failing
**Solution:**
- JWT tokens are cached with 90% expiry margin
- Service automatically refreshes tokens
- If issues persist, restart the backend

## Testing Authentication

### 1. Test Full Auth Flow
```bash
npm start
```

Look for these success messages:
```
🏥 Testing Avon Health API authentication...
🔐 Step 1: Obtaining OAuth2 bearer token...
✅ Bearer token obtained successfully
🔐 Step 2: Exchanging bearer token for JWT token...
   Account: <your_account>
   User ID: <your_user_id>
✅ JWT token obtained successfully
✅ Full authentication flow successful
✅ Avon Health API connected successfully (OAuth2 + JWT)
```

### 2. Test Patient Data Retrieval
Make a query request:
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What medications does the patient take?",
    "patient_id": "your_patient_id_here"
  }'
```

### 3. Monitor Detailed Logs
The service provides comprehensive logging:
```
================================================================================
📝 Processing query for patient demo_user_123:
   Query: "What medications does the patient take?"

🧠 Query Analysis:
   Intent: medications (95% confidence)
   Question Type: what
   Complexity: simple (score: 0)

📡 Fetching patient data from Avon Health API...
🔍 Fetching care plans for patient_id: demo_user_123
   ℹ️  Using user_id as patient_id
📡 Making GET request to /v2/care_plans?patient_id=demo_user_123
✅ Request successful: /v2/care_plans?patient_id=demo_user_123
```

## Patient ID Discovery

If you're getting 401 errors on EMR endpoints but JWT token succeeds:

### Option 1: Check API Documentation
Consult Avon Health API documentation for correct `patient_id` format

### Option 2: Contact Support
Ask Avon Health support:
- "What format should patient_id use for EMR endpoints?"
- "Is patient_id the same as user_id used in JWT authentication?"
- "Can you provide an example patient_id for testing?"

### Option 3: Use Different Test IDs
If you have multiple users/patients in your account, try different IDs:
```typescript
// Try with different patient IDs
const testIds = ['user_123', 'patient_123', '123'];
for (const id of testIds) {
  try {
    await avonHealthService.getCarePlans(id);
    console.log(`✅ SUCCESS with patient_id: ${id}`);
    break;
  } catch (error) {
    console.log(`❌ Failed with patient_id: ${id}`);
  }
}
```

## Enhanced Logging

To enable maximum debugging:

1. **Check startup logs** - Full auth flow is tested on startup
2. **Check query logs** - Each API request is logged with:
   - Endpoint URL
   - Request method
   - Authorization header type (Bearer)
   - Response status
   - Error details if failed

3. **Enable verbose mode** (optional):
```typescript
// In avonhealth.service.ts, uncomment for maximum verbosity:
console.log('JWT Token:', jwtToken.substring(0, 20) + '...');
console.log('Full request:', { method, url, headers });
```

## Next Steps After Authentication Works

Once authentication is successful:

1. **Document the working patient_id format** for your team
2. **Test all EMR endpoints:**
   - `/v2/care_plans?patient_id=<id>`
   - `/v2/medications?patient_id=<id>`
   - `/v2/notes?patient_id=<id>`

3. **Configure frontend** to use correct patient_id format
4. **Set up monitoring** for token expiry and refresh

## Support Resources

- **Avon Health API Docs:** Check your Avon Health dashboard
- **Support Contact:** Contact your Avon Health account representative
- **Logs Location:** Console output when running `npm start`

## Quick Checklist

- [ ] `AVON_CLIENT_ID` and `AVON_CLIENT_SECRET` are correct
- [ ] `AVON_ACCOUNT` matches organization account
- [ ] `AVON_USER_ID` is a valid user in the account
- [ ] Backend starts successfully with "✅ Full authentication flow successful"
- [ ] Bearer token obtained (Step 1) ✅
- [ ] JWT token obtained (Step 2) ✅
- [ ] EMR endpoints work (Step 3) ⚠️  **Debug patient_id format if failing**

## Example Working Configuration

```env
# Replace with your actual values
AVON_CLIENT_ID=abc123xyz789
AVON_CLIENT_SECRET=secret_key_here_very_long
AVON_BASE_URL=https://api.avonhealth.com
AVON_ACCOUNT=my_organization
AVON_USER_ID=user_12345

# For queries, try these patient_id values:
# - user_12345 (same as user_id)
# - patient_user_12345 (with prefix)
# - 12345 (numeric only)
```

---

**Last Updated:** 2025-11-18
**Authentication Flow Version:** 2.0 (Two-step OAuth2 + JWT)
