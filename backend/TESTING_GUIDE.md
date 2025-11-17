# Testing Guide - Avon Health RAG System

This guide shows you how to test the system with real Avon Health API data.

## Quick Start

### 1. Get Test Credentials

Visit the Avon Health demo API to get test credentials:
- **URL:** https://demo-api.avonhealth.com
- You'll need:
  - `AVON_CLIENT_ID`
  - `AVON_CLIENT_SECRET`
  - A test `patient_id`

### 2. Configure Environment

Edit `backend/.env.development` and replace the placeholder values:

```bash
# Update these lines:
AVON_CLIENT_ID=your_actual_client_id_here
AVON_CLIENT_SECRET=your_actual_secret_here
OPENAI_KEY=sk-your_actual_openai_key_here
```

### 3. Run the Test Script

```bash
cd backend
npx tsx test-live-api.ts
```

## What the Test Does

The test script will:

1. ✅ **Test Authentication** - Verify your Avon Health credentials work
2. ✅ **Fetch EMR Data** - Get care plans, medications, and notes for a test patient
3. ✅ **Normalize Data** - Convert API responses to standard format
4. ✅ **Generate Embeddings** - Create vector embeddings using OpenAI
5. ✅ **Test Vector Store** - Store and search vectors with FAISS

## Expected Output

If everything works, you'll see:

```
╔════════════════════════════════════════════════════════════════╗
║       Avon Health RAG System - Live API Test                  ║
╚════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Authenticated client created
✅ Successfully made authenticated request
   Response status: 200

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 2: Fetch EMR Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successfully fetched EMR data:
   Care Plans: 5
   Medications: 12
   Notes: 8
   Total: 25 items
   Fetch time: 1234ms

...

🎉 All tests passed! Your system is working correctly.
```

## Troubleshooting

### Authentication Failed

**Error:** `❌ Authentication failed: Invalid client credentials`

**Solution:**
- Double-check your `AVON_CLIENT_ID` and `AVON_CLIENT_SECRET`
- Make sure there are no extra spaces
- Verify credentials at https://demo-api.avonhealth.com

### No Data Found

**Error:** `⚠️ No data found for this patient ID`

**Solution:**
- Update `TEST_PATIENT_ID` in `test-live-api.ts` with a valid test patient ID
- Common test patient IDs from Avon Health:
  - `patient_123`
  - `patient_demo_001`
  - Check the Avon Health API docs for current test patient IDs

### Embedding Failed

**Error:** `❌ Embedding generation failed: API key`

**Solution:**
- Set a valid OpenAI API key in `.env.development`
- Get one from: https://platform.openai.com/api-keys
- Format: `OPENAI_KEY=sk-...`

## Alternative: Test Individual Components

You can also test individual services using the example files:

### Test Authentication Only

```bash
npx tsx -e "
import './src/examples/auth.example';
import { exampleAuthenticatedRequest } from './src/examples/auth.example';
exampleAuthenticatedRequest();
"
```

### Test EMR Fetching Only

```bash
npx tsx -e "
import { exampleFetchAllData } from './src/examples/emr.example';
exampleFetchAllData();
"
```

### Test Embeddings Only

```bash
npx tsx -e "
import { exampleSingleEmbedding } from './src/examples/embedding.example';
exampleSingleEmbedding();
"
```

## Manual API Testing with curl

If you prefer to test the API manually:

### 1. Get Access Token

```bash
curl -X POST https://demo-api.avonhealth.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

### 2. Fetch Care Plans

```bash
curl https://demo-api.avonhealth.com/v2/care_plans?patient_id=patient_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Fetch Medications

```bash
curl https://demo-api.avonhealth.com/v2/medications?patient_id=patient_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing the Full RAG Pipeline

Once individual components work, test the full RAG pipeline:

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

### 2. Use the Health Check Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T...",
  "uptime": 123.456,
  "components": {
    "openai": "healthy",
    "vectordb": "healthy"
  }
}
```

### 3. Test Query Endpoint (when implemented)

```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What medications is the patient taking?",
    "patient_id": "patient_123"
  }'
```

## Next Steps

After verifying the backend works:

1. **Test the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Visit http://localhost:3000

2. **Try the UI:**
   - Enter a patient ID
   - Ask questions like:
     - "What care plans does this patient have?"
     - "What medications were prescribed last month?"
     - "Show me recent clinical notes"

## Common Test Patient Queries

Good questions to test with:

- "What is the patient's current treatment plan?"
- "What medications is the patient taking?"
- "Show me recent clinical notes"
- "What happened on January 15th?"
- "List all care plans from 2024"
- "What conditions is the patient being treated for?"

## Performance Benchmarks

Expected response times:

- **Authentication:** < 500ms (first request), < 50ms (cached)
- **EMR Data Fetch:** 500-2000ms (API dependent)
- **Normalization:** < 50ms
- **Embedding (single):** 200-500ms (OpenAI API)
- **Vector Search:** < 10ms (FAISS)
- **Full Query (end-to-end):** 1-3 seconds

---

## Support

If you encounter issues:

1. Check the error messages in the test output
2. Verify all credentials are correct
3. Check that all dependencies are installed: `npm install`
4. Try running with debug logging: `LOG_LEVEL=debug npx tsx test-live-api.ts`

For Avon Health API issues, refer to their documentation at https://demo-api.avonhealth.com/docs
