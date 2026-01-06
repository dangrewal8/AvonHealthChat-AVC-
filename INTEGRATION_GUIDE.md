# Anti-Hallucination Integration Guide
**Status:** Ready to integrate after test completion
**Files Created:** 4 new files (utilities, services, prompts, monitoring)
**Risk Level:** LOW - Safe, additive changes

---

## 📁 Files Created (Ready But Not Yet Integrated)

### 1. Utilities
✅ `backend/src/utils/data-availability.util.ts`
- Helper functions for checking data availability
- Non-invasive, can be used anywhere
- Safe to add to codebase

### 2. Services
✅ `backend/src/services/answer-validator.service.ts`
- Validation and auto-correction logic
- Tracks hallucination metrics
- Ready to integrate into query pipeline

### 3. Prompts
✅ `backend/src/prompts/no-data-rules.ts`
- Enhanced prompt templates with NO-DATA rules
- Safe to prepend to existing prompts
- Improves LLM behavior without breaking existing flow

### 4. Monitoring
✅ `backend/src/routes/monitoring.routes.ts`
- New endpoints for hallucination tracking
- `/monitoring/hallucinations` - Get metrics
- `/monitoring/health/detailed` - Enhanced health check

---

## 🔧 Integration Steps (After Test Completes)

### Step 1: Add Monitoring Routes (5 minutes)

**File:** `backend/src/index.ts`

**Add after existing routes:**
```typescript
import monitoringRoutes from './routes/monitoring.routes';

// After existing routes
app.use('/monitoring', monitoringRoutes);
```

**Test:**
```bash
curl http://localhost:3001/monitoring/hallucinations
curl http://localhost:3001/monitoring/health/detailed
```

**Risk:** None - new endpoints only

---

### Step 2: Enhance Prompts (10 minutes)

**File:** `backend/src/services/ollama.service.ts`

**Find existing prompts and wrap them:**
```typescript
import { enhancePromptWithNoDataRules } from '../prompts/no-data-rules';

// In generateAnswer or similar methods
const originalPrompt = `Your existing prompt here...`;
const enhancedPrompt = enhancePromptWithNoDataRules(originalPrompt);

// Use enhancedPrompt instead of originalPrompt
```

**Locations to update:**
- Line ~170: Main query prompt
- Line ~350: Detailed answer prompt
- Line ~480: Any other LLM prompts

**Risk:** Low - only adds rules at beginning of prompt

---

### Step 3: Add Data Availability Check (15 minutes)

**File:** `backend/src/routes/async-query.routes.ts`

**Add short-circuit for no-data scenarios:**
```typescript
import { checkDataAvailability, generateNoDataResponse, detectDataType } from '../utils/data-availability.util';

// In processQueryAsync function, after building context:
async function processQueryAsync(jobId: string, query: string, patient_id: string, options: any) {
  // ... existing code to build context ...

  // NEW: Check data availability
  const detectedTypes = detectDataType(query);
  const primaryType = detectedTypes[0];

  if (primaryType) {
    const availabilityCheck = checkDataAvailability(miniContext, primaryType);

    if (!availabilityCheck.hasData) {
      // Short-circuit - return "not available" immediately
      console.log(`⚠️  No data for ${primaryType} - short-circuit response`);

      const noDataResponse = generateNoDataResponse(primaryType);

      return {
        query_id: jobId,
        ...noDataResponse,
        structured_extractions: [],
        provenance: [],
        confidence: {
          overall: 1.0,
          breakdown: { retrieval: 1.0, reasoning: 1.0, extraction: 1.0 },
          explanation: 'No data available - did not query LLM'
        },
        metadata: {
          patient_id,
          query_time: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
          short_circuited: true,
          no_data_detected: true
        }
      };
    }
  }

  // Continue with existing LLM processing...
}
```

**Risk:** Low - only adds early return for no-data cases

---

### Step 4: Add Validation Layer (20 minutes)

**File:** `backend/src/routes/async-query.routes.ts`

**Add after LLM generates answer:**
```typescript
import { answerValidator } from '../services/answer-validator.service';

// After getting result from LLM
const result = await ollamaService.generateAnswer(query, miniContext, options);

// NEW: Validate and auto-correct if needed
const validatedResult = answerValidator.correctHallucination(
  query,
  result,
  miniContext
);

// Use validatedResult instead of result
return {
  query_id: jobId,
  ...validatedResult,
  // ... rest of response
};
```

**Risk:** Low - adds validation without changing flow

---

### Step 5: Rebuild TypeScript (2 minutes)

```bash
cd backend
npm run build
```

**Check for errors:**
- Should compile cleanly
- New files will be in `dist/` folder

---

### Step 6: Restart Backend (1 minute)

```bash
# Stop current backend
pkill -f "node.*backend"

# Start with new code
npm start
```

**Verify:**
- Health check: `curl http://localhost:3001/health`
- Monitoring: `curl http://localhost:3001/monitoring/health/detailed`

---

### Step 7: Test Anti-Hallucination (15 minutes)

**Test no-data scenarios:**
```bash
# Family history (no data)
curl -X POST http://localhost:3001/api/query/async \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the patient'\''s family history?", "patient_id": "user_n15wtm6xCNQGrmgfMCGOVaqEq0S2", "options": {"answerFormat": "short"}}'

# Wait for job_id, then check status
# Expected: "No family history data is documented for this patient."
```

**Verify:**
- ✅ Says "not available" for family history
- ✅ Says "not available" for appointments
- ✅ Says "not available" for insurance
- ✅ Still provides data for medications, conditions, etc.

---

## 🎯 Expected Results After Integration

### Before Integration
| Scenario | Accuracy | Issue |
|----------|----------|-------|
| Family History (no data) | 16.7% | Hallucinating |
| Appointments (no data) | TBD | Likely hallucinating |
| Insurance (no data) | TBD | Likely hallucinating |

### After Integration
| Scenario | Expected Accuracy | Method |
|----------|-------------------|--------|
| Family History (no data) | 100% | Short-circuit + validation |
| Appointments (no data) | 100% | Short-circuit + validation |
| Insurance (no data) | 100% | Short-circuit + validation |

---

## 🔍 Verification Checklist

After integration, verify:
- [ ] Monitoring endpoint accessible (`/monitoring/hallucinations`)
- [ ] Enhanced health check working (`/monitoring/health/detailed`)
- [ ] Family history returns "not available" (test 5 questions)
- [ ] Appointments return "not available" (test 5 questions)
- [ ] Insurance returns "not available" (test 5 questions)
- [ ] Medications still return data correctly (test 5 questions)
- [ ] Conditions still return data correctly (test 5 questions)
- [ ] No regression in existing functionality
- [ ] Hallucination metrics tracking working
- [ ] Validation layer catching hallucinations

---

## 🚨 Rollback Plan (If Needed)

If integration causes issues:

**1. Revert code changes:**
```bash
cd backend
git checkout src/index.ts
git checkout src/routes/async-query.routes.ts
git checkout src/services/ollama.service.ts
npm run build
npm restart
```

**2. Keep new files:**
- Utilities, services, prompts, monitoring files are safe
- They don't affect existing code unless imported

**3. Gradual integration:**
- Add monitoring routes only (Step 1)
- Add prompts only (Step 2)
- Add validation last (Step 4)
- Test between each step

---

## 📊 Monitoring After Integration

**Check hallucination metrics regularly:**
```bash
curl http://localhost:3001/monitoring/hallucinations | jq
```

**Expected output:**
```json
{
  "status": "ok",
  "metrics": {
    "total": 0,
    "byCorrected": {
      "corrected": 0,
      "notCorrected": 0
    },
    "byDataType": {},
    "hallucination_rate": "0.00%",
    "threshold_warning": "Normal"
  }
}
```

**Alert if:**
- `hallucination_rate` > 5%
- `threshold_warning` = "HIGH HALLUCINATION RATE"
- Manual review if total > 10 in a day

---

## ✅ Safe Integration Principles

**What makes this safe:**
1. **Additive only** - Not removing or changing existing code
2. **New files** - Not modifying critical existing files
3. **Optional routes** - Monitoring doesn't affect main flow
4. **Gradual** - Can integrate step by step
5. **Reversible** - Easy to rollback if needed
6. **Tested** - Will test before full integration

**Conservative approach:**
- ✅ Add monitoring first (safest)
- ✅ Enhance prompts (safe, improves behavior)
- ✅ Add validation last (most impactful)
- ✅ Test thoroughly between steps

---

## 📝 Post-Integration Tasks

After successful integration:
- [ ] Document hallucination rate baseline
- [ ] Set up automated monitoring alerts
- [ ] Create runbook for high hallucination rates
- [ ] Train team on new monitoring endpoints
- [ ] Update API documentation
- [ ] Schedule follow-up testing (weekly)

---

**Integration Status:** Ready to proceed after test completion
**Estimated Time:** 1 hour total
**Risk Level:** LOW
**Rollback Time:** 5 minutes
**Testing Time:** 30 minutes

---

**Next Step:** Wait for comprehensive test to complete, analyze results, then integrate Phase 1 fixes.
