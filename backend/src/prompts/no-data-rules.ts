/**
 * No-Data Rules for LLM Prompts
 * Conservative, additive prompt enhancements
 * Safe to prepend to existing prompts without breaking behavior
 */

export const NO_DATA_CRITICAL_RULES = `
═══════════════════════════════════════════════════════════════════════════════
🚨 CRITICAL NO-DATA HANDLING RULES - MUST FOLLOW EXACTLY 🚨
═══════════════════════════════════════════════════════════════════════════════

RULE 1: ZERO-DATA DETECTION
- If context shows "0 records", "NO data", "not available", or empty results
- You MUST respond: "This information is not available in the patient's current records."
- DO NOT provide any specific details
- DO NOT use general medical knowledge
- DO NOT make assumptions or inferences

RULE 2: EXAMPLES OF REQUIRED RESPONSES
✅ Context: "0 family history records"
   → "No family history data is documented for this patient."

✅ Context: "0 appointments"
   → "There are no appointments scheduled for this patient."

✅ Context: "NO meaningful content" or "TEMPLATE/EMPTY"
   → "This information is not available in the patient's current records."

RULE 3: FORBIDDEN BEHAVIORS
❌ NEVER provide family history details if context shows 0 family history records
❌ NEVER list appointments if context shows 0 appointments
❌ NEVER describe insurance if context shows 0 insurance records
❌ NEVER use phrases like "likely", "probably", "typically" for missing data
❌ NEVER fill gaps with general medical knowledge

RULE 4: VERIFY BEFORE ANSWERING
Before generating your answer, ask yourself:
1. Does the context contain actual data for this question?
2. If I see "0 records" or "NO data", am I saying "not available"?
3. Am I only using information explicitly stated in the context?

If answer to #1 is NO, you MUST say "not available"
If answer to #2 is NO, STOP and fix your response
If answer to #3 is NO, you are HALLUCINATING - STOP

═══════════════════════════════════════════════════════════════════════════════
`;

export const NO_DATA_EXAMPLES = `
CORRECT NO-DATA EXAMPLES:

Q: "What is the patient's family history?"
Context: "0 family history records"
A: "No family history data is documented for this patient."

Q: "Does the patient have any upcoming appointments?"
Context: "0 appointments"
A: "There are no appointments scheduled for this patient."

Q: "What insurance does the patient have?"
Context: "0 insurance policies"
A: "No insurance information is available in the patient's current records."

INCORRECT EXAMPLES (HALLUCINATIONS):

Q: "What is the patient's family history?"
Context: "0 family history records"
A: ❌ "The patient may have a family history of diabetes and heart disease..."
^ WRONG - This is hallucination. Context shows 0 records.

Q: "Does the patient have any appointments?"
Context: "0 appointments"
A: ❌ "The patient should schedule regular checkups..."
^ WRONG - Providing advice when asked for appointments. Say "no appointments scheduled"

Q: "What insurance coverage does the patient have?"
Context: "0 insurance policies"
A: ❌ "Most patients have Medicare or private insurance..."
^ WRONG - This is general knowledge, not patient data. Say "not available"
`;

export const DATA_AVAILABILITY_WARNING = `
⚠️  DATA AVAILABILITY CHECK ⚠️

Before answering ANY question, check the context for these indicators:

NO DATA INDICATORS (must say "not available"):
- "0 records"
- "NO data"
- "not available"
- "not documented"
- "TEMPLATE/EMPTY PLACEHOLDER"
- "NO meaningful content"

If you see ANY of these for the requested information type, you MUST respond:
"This information is not available in the patient's current records."

Do NOT provide general medical information as a substitute.
Do NOT make educated guesses.
Do NOT use external knowledge.

ONLY report what is explicitly documented in THIS patient's records.
`;

/**
 * Get enhanced prompt with no-data rules prepended
 * Safe to use - only adds rules, doesn't change existing logic
 */
export function enhancePromptWithNoDataRules(originalPrompt: string): string {
  return `${NO_DATA_CRITICAL_RULES}

${DATA_AVAILABILITY_WARNING}

${NO_DATA_EXAMPLES}

═══════════════════════════════════════════════════════════════════════════════

${originalPrompt}`;
}

/**
 * Check if context indicates no data
 * Quick helper for prompt construction
 */
export function contextHasNoData(context: string): boolean {
  const noDataIndicators = [
    '0 records',
    '0 meds',
    '0 conditions',
    '0 allergies',
    'NO data',
    'not available',
    'NO meaningful content',
    'TEMPLATE/EMPTY'
  ];

  const contextLower = context.toLowerCase();
  return noDataIndicators.some(indicator =>
    contextLower.includes(indicator.toLowerCase())
  );
}

/**
 * Generate explicit no-data warning for context
 * Adds to context to make it crystal clear to LLM
 */
export function addNoDataWarningToContext(context: string, dataType: string): string {
  if (contextHasNoData(context)) {
    return `${context}

⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️
The context above shows NO DATA for ${dataType}.
You MUST respond: "This information is not available in the patient's current records."
DO NOT provide any specific details or use general medical knowledge.
⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️`;
  }
  return context;
}
