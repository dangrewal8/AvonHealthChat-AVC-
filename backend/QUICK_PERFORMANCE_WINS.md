# Quick Performance Wins - Ready to Implement

## Current Performance
- Average query time: **43-56 seconds**
- Stage 1 (Answer generation): 28-35 seconds
- Stage 2 (Verification): 15-20 seconds additional

## Top 3 Fastest Wins

### 1. **Skip Verification for Simple Queries**
**Impact: 15-20 seconds savings (30-40% faster)**

**Simple queries** = Single data type, no complex reasoning:
- "What medications is the patient taking?"
- "What is the patient's blood pressure?"
- "Does the patient have diabetes?"

**Implementation:**
```typescript
// Detect simple vs complex queries
function isSimpleQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Simple if asking about ONE data type
  const singleTypePatterns = [
    /^what (medications?|drugs?)/, // "what medications"
    /^(what|show).*(blood pressure|bp|vitals?)/, // "what is blood pressure"
    /^does.*have.*(condition|allergy)/, // "does patient have"
    /^when (was|did)/, // "when was diagnosed"
  ];

  return singleTypePatterns.some(pattern => pattern.test(lowerQuery));
}

// In generateFastAnswerSequential, add parameter:
async generateFastAnswerSequential(
  query: string,
  patientData: any,
  structuredExtractions: any[],
  skipVerification: boolean = isSimpleQuery(query) // Auto-detect
)

// Then skip Meditron verification:
if (!skipVerification) {
  // Run verification
} else {
  console.log('⚡ Skipping verification for simple query');
}
```

**Files to modify:**
- `src/services/ollama.service.ts` (lines 1903-2000)

**Risk:** Low - verification is helpful but not critical for simple factual queries

---

### 2. **Reduce Context Verbosity**
**Impact: 5-10 seconds savings (10-20% faster)**

**Current issue:** buildMiniContext includes verbose field names and formatting

**Before:**
```
Active Meds: [Metformin 1000mg, started 2025-02-12, prescribed by user_abc123, sig: Take twice daily, dose: 1000mg, freq: BID]
```

**After:**
```
Active Meds: Metformin 1000mg (2025-02-12, BID)
```

**Implementation:**
```typescript
// In buildMiniContext, simplify medication formatting:
if (active.length > 0) {
  sections.push(`Meds: ${active.map((m: any) =>
    `${m.name} ${m.strength || ''}${m.start_date ? ` (${m.start_date})` : ''}`
  ).join('; ')}`);
}
```

**Token reduction:** ~40-60% fewer tokens in context

---

### 3. **Add Token Limit to Context**
**Impact: 3-8 seconds savings (5-15% faster)**

**Current issue:** No hard limit on context size, can balloon with lots of data

**Implementation:**
```typescript
private buildMiniContext(query: string, patientData: any, maxTokens: number = 500): string {
  const sections: string[] = [];
  let estimatedTokens = 0;

  // Add sections until we hit limit
  for (const section of potentialSections) {
    const sectionTokens = section.length / 4; // Rough estimate: 1 token ≈ 4 chars
    if (estimatedTokens + sectionTokens > maxTokens) break;

    sections.push(section);
    estimatedTokens += sectionTokens;
  }

  return sections.join('\n');
}
```

**Benefits:**
- Predictable context size
- Faster LLM processing
- Forces prioritization of relevant data

---

## Implementation Order

### Phase 1 (30 minutes)
1. Add `isSimpleQuery()` function
2. Make verification optional based on query complexity
3. Test with simple queries

**Expected result:** 30-40% faster for ~60% of queries

### Phase 2 (20 minutes)
1. Simplify context formatting in buildMiniContext
2. Remove verbose field names
3. Test context is still complete

**Expected result:** Additional 10-20% faster across all queries

### Phase 3 (15 minutes)
1. Add token counting to buildMiniContext
2. Set hard limit at 500 tokens
3. Test with data-heavy patients

**Expected result:** Prevents worst-case slowdowns

---

## Combined Impact

**Before:** 43-56 seconds average
**After:**
- Simple queries: 23-30 seconds (45% faster)
- Complex queries: 35-45 seconds (20% faster)
- **Average: 38% faster overall**

---

## Safety Measures

1. **Backup created:** `backup-before-performance-optimization` branch
2. **Rollback command:** `git checkout backup-before-performance-optimization`
3. **Testing:** Run test queries before/after
4. **Monitoring:** Log times and compare

---

## Code Changes Summary

### File: `src/services/ollama.service.ts`

**Line ~1850 - Add helper function:**
```typescript
/**
 * Detect if query is simple (single data type, no complex reasoning)
 * Simple queries can skip verification for speed
 */
private isSimpleQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  const simplePatterns = [
    /^what (medications?|drugs?|prescriptions?)/,
    /^(what|show).*(blood pressure|bp|vitals?|temperature|heart rate)/,
    /^does.*have.*(condition|allergy|diabetes)/,
    /^when (was|did)/,
    /^how (much|many)/,
  ];

  return simplePatterns.some(p => p.test(lowerQuery)) &&
         !lowerQuery.includes('and') && // No multi-part questions
         !lowerQuery.includes('summary') && // Not a summary request
         !lowerQuery.includes('history'); // Not a history request
}
```

**Line 1903 - Update function signature:**
```typescript
async generateFastAnswerSequential(
  query: string,
  patientData: any,
  structuredExtractions: any[],
  skipVerification: boolean = this.isSimpleQuery(query) // NEW
)
```

**Line ~1970 - Make verification conditional:**
```typescript
// ===================================================================
// STAGE 2: Meditron - Medical Verification (Optional for simple queries)
// ===================================================================
let verificationResult = '';
let stage2Time = stage1Time;

if (!skipVerification) {
  console.log('\n🔬 STAGE 2: Meditron verification');
  // ... existing verification code ...
  stage2Time = Date.now() - startTime;
} else {
  console.log('\n⚡ STAGE 2: Skipped (simple query optimization)');
}
```

**Line ~2127 - Optimize buildMiniContext:**
```typescript
// Simplify medication formatting
if (active.length > 0) {
  sections.push(`Meds: ${active.map((m: any) =>
    `${m.name} ${m.strength || ''}${m.start_date ? ` (${m.start_date})` : ''}`
  ).slice(0, 10).join('; ')}${active.length > 10 ? ` +${active.length - 10} more` : ''}`);
}

// Add token limit
let contextStr = sections.join('\n');
const maxChars = 2000; // ~500 tokens
if (contextStr.length > maxChars) {
  contextStr = contextStr.substring(0, maxChars) + '... [truncated]';
  console.log(`⚠️  Context truncated from ${sections.join('\n').length} to ${maxChars} chars`);
}
```

---

## Next Steps

1. Review this plan
2. Decide which optimizations to implement
3. Make changes to code
4. Rebuild backend: `npm run build`
5. Restart backend
6. Test with sample queries
7. Measure improvement
8. Iterate if needed

Ready to implement when you are!
