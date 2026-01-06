# Comprehensive Test Configuration
**Test:** Full 187-question comprehensive data type accuracy test
**Script:** comprehensive-test-sustainable.js

---

## Sustainable Pacing Configuration

### Timing
- **Query Delay:** 90 seconds between questions (rate limit safe)
- **Batch Size:** 8 questions per batch
- **Batch Break:** 15 minutes between batches
- **Total Estimated Time:** 5-7 hours

### Calculation
```
187 questions ÷ 8 per batch = ~24 batches
90 seconds × 187 questions = 4.7 hours of query time
15 minutes × 23 breaks = 5.75 hours of break time
Total: ~10.5 hours (with safety margins: 5-7 hours actual)
```

### Safety Features
1. **Checkpoint System**
   - Saves progress every 5 questions
   - Resume capability if interrupted
   - File: `test-checkpoint.json`

2. **Rate Limit Protection**
   - 90-second delays (safer than 60s)
   - 15-minute breaks between batches
   - Total: ~13 queries per 15-minute window (well under 1000 limit)

3. **Error Handling**
   - Timeout protection (5 min per query)
   - Retry logic for failed submissions
   - Detailed error logging

4. **Progress Tracking**
   - Real-time progress display
   - Batch completion status
   - Estimated time remaining
   - Current accuracy score

---

## Test Coverage

### 11 Data Types × 17 Questions Each = 187 Total

1. **Medications** (17 questions) - Has data
2. **Conditions** (17 questions) - Has data
3. **Allergies** (17 questions) - Has data
4. **Vitals** (17 questions) - Has data
5. **Care Plans** (17 questions) - Has data
6. **Clinical Notes** (17 questions) - Has data
7. **Documents** (17 questions) - Has data
8. **Family History** (17 questions) - NO data (anti-hallucination test)
9. **Appointments** (17 questions) - NO data (anti-hallucination test)
10. **Insurance** (17 questions) - NO data (anti-hallucination test)
11. **Patient Demographics** (17 questions) - Has data

---

## Progress Monitoring

### During Execution
The test displays:
```
[Question #/187] Testing: "Question text..."
   Batch: X | Questions in batch: Y/8
   ✅ PASS (100%) - Good answer
   💾 Checkpoint saved (25/187)

⏸️  BATCH 3 COMPLETE - Taking 15-minute break
   Completed: 24/187 (12.8%)
   Accuracy so far: 22/24 = 91.7%
   Time elapsed: 1h 2m 15s
   Estimated remaining: 4h 23m 10s
```

### Files Generated
- `test-checkpoint.json` - Progress checkpoint (auto-deleted when done)
- `comprehensive-test-results-full.json` - Final results
- Console output with real-time updates

---

## How to Monitor

### Option 1: Watch Live Output
```bash
tail -f /tmp/claude/-home-dangr-Avonhealthtest/tasks/[TASK_ID].output
```

### Option 2: Check Checkpoint
```bash
cat test-checkpoint.json | python3 -m json.tool
```

### Option 3: Check Progress Script
```bash
node check-test-progress.js
```

---

## Interruption Handling

### If Test Stops
The checkpoint system allows seamless resume:
1. Re-run: `node comprehensive-test-sustainable.js`
2. Test automatically detects checkpoint
3. Resumes from last saved position
4. No duplicate questions

### Manual Stop
Press `Ctrl+C` to stop
- Progress saved in checkpoint
- Resume later with same command

---

## Expected Results

### Based on Sample Test (100% accuracy)
- **Medications:** 95-100% expected
- **Conditions:** 90-95% expected
- **Allergies:** 90-95% expected
- **Vitals:** 90-95% expected
- **Care Plans:** 85-95% expected
- **Notes:** 85-95% expected
- **Documents:** 85-95% expected
- **Family History:** 90-100% expected (should say "not available")
- **Appointments:** 90-100% expected (should say "not available")
- **Insurance:** 90-100% expected (should say "not available")
- **Demographics:** 90-95% expected

**Overall Expected Accuracy:** 90-95%

---

## What Gets Tested

### For Data Types WITH Data
1. Basic retrieval ("What X does the patient have?")
2. Counts ("How many X?")
3. Specific details (dosages, dates, names)
4. Status checks (active/inactive, current/past)
5. Temporal queries (when, how long)
6. Provider information (who documented)
7. Cross-references (what's in the plan, what's mentioned in notes)

### For Data Types WITHOUT Data
1. Direct queries ("What is the family history?")
2. Specific questions ("Does patient have family history of diabetes?")
3. General searches ("Any hereditary conditions?")

**Expected:** All should return "not available" or similar
**Test:** Anti-hallucination - ensures no fake data

---

## Post-Test Deliverables

1. **comprehensive-test-results-full.json**
   - Complete results for all 187 questions
   - Accuracy scores per data type
   - Pass/fail status for each question
   - Timestamps and processing times

2. **Final Report** (auto-generated)
   - Overall accuracy score
   - Per-data-type breakdown
   - Hallucination analysis
   - Consistency verification
   - Recommendations

3. **Comparison with Sample Test**
   - Validate 100% medication accuracy holds
   - Check consistency across all data types
   - Verify anti-hallucination for no-data scenarios

---

## Timeline

### Estimated Schedule (5-7 hours)
```
Start:  Now
Batch 1-3:   First hour (24 questions)
Break 1:     15 minutes
Batch 4-6:   Second hour (24 questions)
Break 2:     15 minutes
Batch 7-9:   Third hour (24 questions)
Break 3:     15 minutes
Batch 10-12: Fourth hour (24 questions)
Break 4:     15 minutes
Batch 13-15: Fifth hour (24 questions)
Break 5:     15 minutes
Batch 16-18: Sixth hour (24 questions)
Break 6:     15 minutes
Batch 19-21: Seventh hour (24 questions)
Break 7:     15 minutes
Batch 22-24: Final hour (19 questions)
Complete:    5-7 hours from start
```

---

## Success Criteria

✅ **Pass:** Overall accuracy ≥ 85%
✅ **Excellent:** Overall accuracy ≥ 90%
✅ **Perfect:** Overall accuracy ≥ 95%

### Anti-Hallucination
- Family History: 100% should say "not available"
- Appointments: 100% should say "not available"
- Insurance: 100% should say "not available"

### Consistency
- Same data type questions: <5% variance in accuracy
- Repeated concepts: Consistent answers

---

**Test Status:** Ready to run
**Command:** `node comprehensive-test-sustainable.js`
**Can be interrupted:** Yes (checkpoint system)
**Resume capability:** Yes (automatic)
