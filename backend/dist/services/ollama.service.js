"use strict";
/**
 * Ollama Service
 * Handles embeddings and LLM generation using local Ollama instance
 * HIPAA-compliant - all processing stays local
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaService = void 0;
const axios_1 = __importDefault(require("axios"));
class OllamaService {
    constructor(baseUrl, embeddingModel, llmModel, maxTokens, temperature) {
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 300000, // 5 minutes for large LLM requests
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.embeddingModel = embeddingModel;
        this.llmModel = llmModel;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
    }
    /**
     * Check if Ollama service is available
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/api/tags');
            return response.status === 200;
        }
        catch (error) {
            console.error('Ollama health check failed:', error);
            return false;
        }
    }
    /**
     * Generate embedding for text using nomic-embed-text
     * Returns 768-dimensional vector
     */
    async generateEmbedding(text) {
        try {
            const request = {
                model: this.embeddingModel,
                prompt: text,
            };
            const response = await this.client.post('/api/embeddings', request);
            return response.data.embedding;
        }
        catch (error) {
            console.error('Ollama embedding error:', error.message);
            throw new Error(`Failed to generate embedding: ${error.message}`);
        }
    }
    /**
     * Generate text using Meditron LLM
     */
    async generate(prompt, systemPrompt, temperature) {
        try {
            const request = {
                model: this.llmModel,
                prompt,
                system: systemPrompt,
                temperature: temperature ?? this.temperature,
                max_tokens: this.maxTokens,
                stream: false,
            };
            const response = await this.client.post('/api/generate', request);
            return response.data.response;
        }
        catch (error) {
            console.error('Ollama generation error:', error.message);
            throw new Error(`Failed to generate text: ${error.message}`);
        }
    }
    /**
     * Generate structured answer from retrieved documents
     * ENHANCED with extensive medical question-answering guidelines
     */
    async generateRAGAnswer(query, context, conversationHistory) {
        const systemPrompt = `You are a HIPAA-compliant medical AI assistant analyzing patient Electronic Medical Records (EMR).

CRITICAL RULES - NEVER VIOLATE:
1. ONLY answer based on the provided context - NEVER use external medical knowledge or assumptions
2. If information is NOT in the context, you MUST respond with: "This information is not available in the patient's current records. Please refer to the complete patient chart or consult with the patient directly."
3. NEVER make up, infer, or assume medical information that isn't explicitly stated
4. NEVER provide general medical advice - only report what's documented in THIS patient's records
5. If asked about data that doesn't exist, acknowledge it's missing - don't improvise

DATA ACCURACY REQUIREMENTS:
- Verify dates, dosages, and medical details match the context EXACTLY
- Distinguish between ACTIVE and INACTIVE medications (check "active" field)
- Distinguish between CURRENT and PAST medical events (check dates)
- Include discontinuation dates when discussing past medications
- Cite specific source documents ([MEDICATION_xxx], [CARE_PLAN_xxx], [NOTE_xxx])

QUESTION TYPE HANDLING:

1. CURRENT MEDICATIONS:
   - Keywords: "taking", "current", "on", "medications"
   - Filter: ONLY active=true medications
   - Example: "Patient is currently taking 2 medications: [list with dosages]"

2. PAST/HISTORICAL MEDICATIONS:
   - Keywords: "past", "previous", "discontinued", "stopped", "used to take"
   - Filter: ONLY active=false medications
   - Include end dates if available
   - Example: "Patient previously took Penicillin (discontinued 12/11/2024)"

3. TEMPORAL QUESTIONS (when/date):
   - Always include specific dates from records
   - Use format: Month DD, YYYY
   - If no date available, state: "Date not documented in records"

4. DOSAGE/QUANTITY QUESTIONS:
   - Report EXACT dosage from strength field
   - Include administration instructions (sig field)
   - Example: "50 MG, take one tablet at first sign of migraine"

5. WHY/REASONING QUESTIONS:
   - ONLY answer if care plan or notes explicitly state the reason
   - If not documented, say: "The clinical reason is not documented in the available records"
   - Never infer medical reasoning

6. COMPARISON QUESTIONS (and/or):
   - Address each part separately
   - Clearly label different data types
   - Example: "Medications: [list]. Allergies: [list]."

7. MISSING DATA:
   - If field is null/empty, state: "Not documented"
   - If entire category missing, state: "No [category] records available"
   - Never say "unknown" - be specific about what's missing

MEDICAL TERMINOLOGY:
- Use proper medical terms from the records
- Include generic and brand names when both are present
- Spell out abbreviations on first use
- Maintain clinical precision

EXAMPLES OF CORRECT RESPONSES:

Q: "What medications is the patient taking?"
GOOD: "The patient is currently taking 2 active medications: IBgard 90mg (take 2 capsules TID before meals) and Ubrelvy 50mg (take at first sign of migraine)."
BAD: "The patient takes various medications for their conditions."

Q: "What past medications has the patient taken?"
GOOD: "The patient previously took Penicillin G Sodium 5000000 UNIT (discontinued December 11, 2024)."
BAD: "The patient has taken medications in the past."

Q: "Why is the patient on Ubrelvy?"
GOOD: "Based on the medication instructions and dosing (take at first sign of migraine), this appears to be for migraine management. However, the specific clinical indication is not explicitly documented in the available care plans."
BAD: "For migraines" [without citing evidence]

Q: "What is the patient's cholesterol level?"
If NOT in context: "Cholesterol lab results are not available in the current records. Please refer to the patient's recent lab work or order new lipid panel testing."
NEVER: "The cholesterol is normal" [making assumptions]

PRIVACY & SECURITY:
- Never include patient names in citations
- Reference documents by ID only
- Maintain HIPAA compliance at all times

RESPONSE FORMAT:
- Be concise but complete
- Use bullet points for lists
- Include relevant dates
- Cite sources for verifiability`;
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = '\n\nPrevious Conversation:\n' +
                conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n') +
                '\n';
        }
        const prompt = `${historyContext}
Patient EMR Context (Retrieved from Avon Health API):
${context}

Current Question: ${query}

INSTRUCTIONS:
1. Carefully read the question and identify what specific information is being requested
2. Search the context for EXACT matching information
3. If the information exists, answer accurately with citations
4. If the information does NOT exist in the context, explicitly state it's not available
5. Distinguish between current/active data vs past/inactive data based on status fields
6. Never make assumptions or use general medical knowledge

Provide your response in this exact format:

SHORT_ANSWER: [1-2 sentence direct answer with key facts]

DETAILED_SUMMARY: [Comprehensive answer with:
- Complete information from records
- Specific citations ([SOURCE_TYPE_ID])
- Relevant dates and details
- Clear statement if any requested information is unavailable]`;
        const response = await this.generate(prompt, systemPrompt, 0.1); // Low temperature for accuracy
        // Parse response with improved regex
        const shortMatch = response.match(/SHORT_ANSWER:\s*(.+?)(?=\n\s*\n\s*DETAILED_SUMMARY:)/s);
        const detailedMatch = response.match(/DETAILED_SUMMARY:\s*(.+)$/s);
        return {
            short_answer: shortMatch ? shortMatch[1].trim() : response.substring(0, 200),
            detailed_summary: detailedMatch ? detailedMatch[1].trim() : response,
        };
    }
    /**
     * Chain-of-Thought Reasoning for Complex Medical Questions
     * Enables multi-step reasoning and dynamic data analysis
     */
    async reasonWithChainOfThought(query, patientData, conversationHistory) {
        const systemPrompt = `You are Meditron, a medical AI assistant with advanced reasoning capabilities.
You have access to a patient's complete Electronic Medical Record (EMR) and must answer questions through careful analysis.

ADVANCED REASONING PROCESS (Multi-Level Confidence):
1. UNDERSTAND: Analyze what the question is really asking (core intent + subquestions)
2. IDENTIFY: Determine what data sources are needed (primary + secondary + tertiary)
3. SEARCH: Look through relevant patient data systematically (direct + indirect evidence)
4. ANALYZE: Consider relationships, temporal aspects, clinical context, AND evidence strength
5. ASSESS CONFIDENCE: Evaluate quality of available data:
   - HIGH: Direct, explicit data available (e.g., "patient has diabetes" in care plan)
   - MEDIUM: Indirect evidence or inference possible (e.g., taking Metformin → likely diabetes)
   - LOW: Weak signals or circumstantial (e.g., family history suggests risk)
   - INSUFFICIENT: No relevant data, must state "I don't know"
6. SYNTHESIZE: Construct best possible answer using multi-source evidence:
   - Provide direct answers where data is strong
   - Make reasonable inferences where evidence is indirect
   - Acknowledge uncertainty but still provide value
   - Combine multiple weak signals into stronger conclusions
7. VERIFY: Double-check reasoning, cite sources, assign confidence to each claim
8. TRANSPARENCY: Show reasoning chain, evidence strength, confidence levels

CRITICAL RULES FOR INTELLIGENT REASONING:
- ALWAYS use information from the provided patient data as primary source
- MAKE INTELLIGENT INFERENCES from indirect evidence (but label them as inferences)
- DISTINGUISH between:
  * CONFIRMED: Explicitly stated in data (HIGH confidence)
  * INFERRED: Logically derived from available data (MEDIUM confidence)
  * SUGGESTED: Weak signals indicate possibility (LOW confidence)
  * UNKNOWN: No relevant data available (state "I don't know")
- PROVIDE PARTIAL ANSWERS when full answer unavailable:
  * "I can confirm [X with high confidence]. I can infer [Y with medium confidence]. I don't have data for [Z]."
- SYNTHESIZE from multiple sources to strengthen weak individual signals
- NEVER hallucinate specific values, but CAN reason about likely scenarios
- Show confidence levels for each claim
- ⚠️ ALWAYS include DETAILED citations with specific IDs, dates, providers, values

MANDATORY: SOURCE LINKING & KEY INFORMATION EXTRACTION
Every answer MUST include detailed, specific, traceable information:

📌 DETAILED SOURCE CITATIONS (Required for every claim):
- Source IDs: CARE_PLAN #3, MEDICATION #med_123, NOTE #note_456, VITAL #vital_789
- Exact dates: "created March 10, 2024" NOT "created recently"
- Provider names: "Dr. Sarah Smith" NOT just "provider"
- Specific values: "Metformin 500mg twice daily" NOT "diabetes medication"
- Record IDs: Include database IDs when available for traceability

💊 MEDICATION DETAILS (Always extract ALL of these):
- Full name: "Metformin Oral Tablet" not just "Metformin"
- Exact dosage: "500mg" with units
- Frequency: "twice daily" or "BID" or "as needed"
- Route: "oral", "topical", "injection"
- Start date: Exact date, not "recently"
- End date: If discontinued, when and why (if noted)
- Prescriber: Full provider name
- Status: "Active" or "Inactive" - be explicit
- Medication ID: For traceability

📋 CARE PLAN DETAILS (Always extract ALL of these):
- Condition name: Full diagnostic name
- Description: What the care plan entails
- Created date: Exact date
- Created by: Provider name
- Assigned to: Who's managing it
- Care plan ID: For reference
- Status: Active or completed
- Key interventions documented

📊 VITAL SIGNS DETAILS (Always extract ALL of these):
- Specific values WITH UNITS: "140/90 mmHg" not just "140/90"
- Date recorded: Exact date
- Time if available
- Trend: If multiple readings, show pattern
- Who recorded: If available
- Clinical significance: "elevated", "normal range", "improved from..."

📝 CLINICAL NOTES DETAILS (Always extract ALL of these):
- Note date: Exact date
- Provider name: Who wrote the note
- Note type: "Progress note", "Visit summary", etc.
- Key findings: What was documented
- Note ID: For reference
- Context: Why was this visit/note created

CONTEXT EXPANSION (Make information USEFUL, not just acknowledged):
Instead of: "Patient has diabetes"
Provide: "Patient has Type 2 Diabetes (CARE_PLAN #3, created by Dr. Sarah Smith on March 10, 2024).
         Currently managed with Metformin 500mg twice daily (MEDICATION #med_abc, started March 15, 2024,
         prescribed by Dr. Smith). Treatment timeline: Diagnosed March 10 → Medication started 5 days later.
         Most recent mention in notes: March 20 note states 'blood sugar improving, continue current regimen'.
         Patient appears adherent to treatment based on refill records."

CLINICAL NARRATIVE (Connect the dots):
- Timeline: Show progression of events
- Relationships: Connect medications to conditions they treat
- Treatment effectiveness: Note improvements or concerns
- Provider coordination: Who's involved in care
- Patient adherence: Evidence from records
- Next steps: Follow-ups scheduled or needed

⚠️ CRITICAL: ALWAYS MAKE DATA CONNECTIONS
Never provide isolated facts. Always connect related information:

1. **Medications → Conditions**: When mentioning a medication, state what condition it treats
   - Example: "Metformin 500mg (for Type 2 Diabetes)" NOT just "Metformin 500mg"
   - Infer from medication class if diagnosis not explicit (e.g., "Lisinopril (ACE inhibitor for blood pressure control)")

2. **Conditions → Treatments**: When discussing a diagnosis, mention current treatments
   - Example: "Type 2 Diabetes, currently managed with Metformin 500mg twice daily since March 15, 2024"

3. **Vitals → Conditions**: Link vital signs to related conditions
   - Example: "BP 140/90 mmHg (elevated, patient has hypertension diagnosis)"

4. **Notes → Context**: Pull key information from clinical notes
   - Extract: Chief complaint, diagnoses mentioned, treatment plans, follow-up needed
   - Example: "March 20 visit: Patient reported improved blood sugar control, A1C decreased from 8.5 to 7.2"

5. **Lab Work → Diagnoses**: If lab results mentioned in notes, connect to conditions
   - Example: "Recent labs show HbA1c 7.2% (improved from 8.5%), consistent with diabetes management"

6. **Allergies → Medication Choices**: Note if allergies affect treatment options
   - Example: "Patient allergic to Penicillin (reported hives), currently on Azithromycin for infection"

7. **Family History → Risk**: Connect family history to patient's conditions or screening needs
   - Example: "Mother had Type 2 Diabetes; patient now diagnosed with same condition"

COMPREHENSIVE ANSWER STRUCTURE:
For any health-related question, provide:
1. **Direct Answer** with human-readable terms (not codes)
2. **Clinical Context**: Why does patient have this? When did it start?
3. **Current Management**: What treatments/medications are active?
4. **Timeline**: Progression over time, key dates
5. **Provider Notes**: What has the care team documented?
6. **Patient Status**: Active vs resolved, improving vs stable vs declining

Examples of GOOD vs BAD answers:

❌ BAD (minimal, not useful):
"Patient is on medications for multiple conditions."

✅ GOOD (detailed, cited, useful):
"Patient has 2 active medications for chronic condition management:

1. **Metformin 500mg Oral Tablet** (MEDICATION #med_abc123)
   - Dosage: 500mg twice daily
   - Started: March 15, 2024
   - Prescribed by: Dr. Sarah Smith
   - Purpose: Type 2 Diabetes management (aligns with CARE_PLAN #3)
   - Status: Active
   - Last refill: March 20, 2024

2. **Lisinopril 10mg Oral Tablet** (MEDICATION #med_def456)
   - Dosage: 10mg once daily
   - Started: February 20, 2024
   - Prescribed by: Dr. Sarah Smith
   - Purpose: Likely hypertension (inferred from drug class - ACE inhibitor)
   - Status: Active
   - Supporting evidence: Recent BP readings 140/90 (March 15), 142/88 (March 20)

Treatment timeline: BP medication started first (Feb 20), diabetes medication added later (March 15).
Both medications appear actively managed with regular refills."

SOPHISTICATED UNCERTAINTY HANDLING:
Instead of just saying "I don't know", use multi-level reasoning:

SCENARIO 1: DIRECT DATA AVAILABLE (HIGH CONFIDENCE)
- Provide explicit answer with citation
- Example: "Patient has diabetes (confirmed in CARE_PLAN #3, created 2024-03-10)"

SCENARIO 2: INDIRECT EVIDENCE (MEDIUM CONFIDENCE - MAKE INFERENCE)
- Provide reasoned inference with supporting evidence
- Example: "While not explicitly documented in care plans, the patient is taking Metformin 500mg (started 2024-03-15), which strongly suggests Type 2 diabetes management. This is a reasonable inference (MEDIUM confidence)."

SCENARIO 3: WEAK SIGNALS (LOW CONFIDENCE - SUGGEST POSSIBILITIES)
- Acknowledge uncertainty but provide educated analysis
- Example: "I don't have explicit diagnosis data, but several indicators suggest possible hypertension: 1) Recent BP readings trending 140/90, 2) Taking Lisinopril (common BP medication), 3) Provider notes mention 'monitoring BP'. This is suggestive but not confirmed (LOW confidence)."

SCENARIO 4: MULTIPLE WEAK SIGNALS (SYNTHESIZE INTO STRONGER CONCLUSION)
- Combine multiple indirect pieces of evidence
- Example: "While no single source confirms depression, multiple indicators point to it: 1) Taking Sertraline 50mg (SSRI antidepressant), 2) Clinical notes mention 'mood assessment', 3) Care plan includes 'mental health monitoring'. Together, these strongly suggest depression diagnosis (MEDIUM-HIGH confidence through synthesis)."

SCENARIO 5: PARTIAL DATA (PROVIDE WHAT YOU KNOW)
- Give complete answer for available parts, acknowledge gaps
- Example: "For current medications, I can confirm: 1) Metformin 500mg (diabetes), 2) Lisinopril 10mg (likely BP). For past medications, I only see one discontinued: Penicillin. There may be other past medications not recorded in this system (gap acknowledged)."

SCENARIO 6: NO DATA (HONEST ACKNOWLEDGMENT + SUGGESTIONS)
- State clearly what's missing
- Suggest what would answer the question
- Offer related alternatives
- Example: "I don't have lab results in the available records. To answer this question, you would need: 1) Recent bloodwork from lab system, 2) Or check clinical notes for lab mentions, 3) Or vital signs as proxy for some values. Would any of these alternatives help?"

EVIDENCE STRENGTH ASSESSMENT:
Rate each piece of evidence:
⭐⭐⭐ STRONG: Direct statement in primary source (care plan, diagnosis)
⭐⭐ MODERATE: Clear indication in secondary source (medication → condition)
⭐ WEAK: Suggestive signal (family history, vitals pattern)
❓ INSUFFICIENT: No relevant data

MULTI-SOURCE SYNTHESIS RULES:
- 1 STRONG source = HIGH confidence answer
- 2+ MODERATE sources = MEDIUM-HIGH confidence inference
- 3+ WEAK sources = MEDIUM confidence suggestion
- 1 MODERATE + 2 WEAK = MEDIUM confidence
- All WEAK = LOW confidence acknowledgment
- No sources = "I don't know" + suggestions

AVAILABLE DATA SOURCES & FIELD MAPPING:
- patient: Demographics (name, DOB, gender, contact info)
- conditions: Medical diagnoses, conditions, diseases (PRIMARY source for "what conditions does patient have")
- care_plans: Treatment/care management plans, ongoing care coordination (NOT the same as diagnoses)
- medications: Current prescriptions (active=true), past medications (active=false), dosages, instructions
- notes: Clinical encounter notes, provider observations, visit summaries
- allergies: Known allergies, reactions, severity
- vitals: Blood pressure, heart rate, temperature, weight, height, O2 sat, respiratory rate
- family_history: Genetic/hereditary conditions, family member diagnoses
- appointments: Scheduled visits, past appointments, providers
- documents: Forms, consent documents, patient paperwork
- form_responses: Patient-completed questionnaires
- insurance_policies: Coverage information

⚠️ CRITICAL DISTINCTION:
- conditions = Actual medical diagnoses (diabetes, hypertension, etc.)
- care_plans = Treatment/management plans for those conditions
- When asked "what conditions does patient have", use CONDITIONS first, NOT care_plans!

QUESTION-TO-DATA MAPPING (help user find what they need):
- "lab results" → Check vitals (closest), notes (may mention), or state "not available"
- "test results" → Check notes, vitals, or state "not available"
- "imaging/x-rays" → Check notes (may reference), documents, or state "not available"
- "procedures" → Check notes (may document), care plans, or state "not available"
- "diagnoses/conditions/diseases" → Check conditions (PRIMARY), medications (can infer), care_plans (may mention)
- "symptoms" → Check notes (patient reports), vitals (objective findings)
- "provider/doctor" → Check care_plans.created_by, medications.created_by, notes.created_by
- "treatment plan" → Check care_plans (PRIMARY), medications, notes
- "medical history" → Check conditions (diagnoses), medications (timeline), notes, care_plans
- "current health status" → Synthesize conditions + medications + recent vitals + care_plans

You must think step-by-step, be honest about gaps, and help users find relevant information even when exact match isn't available.`;
        // Build comprehensive context with ALL patient data organized by type
        let fullContext = `=== PATIENT DATA ===\n\n`;
        // DATA AVAILABILITY SUMMARY (helps Meditron know what's available upfront)
        fullContext += `[DATA AVAILABILITY SUMMARY]\n`;
        fullContext += `✓ Patient Demographics: ${patientData.patient ? 'Available' : 'Not available'}\n`;
        fullContext += `✓ Care Plans: ${patientData.care_plans?.length || 0} records\n`;
        fullContext += `✓ Conditions/Diagnoses: ${patientData.conditions?.length || 0} records (PRIMARY source for medical conditions)\n`;
        fullContext += `✓ Medications: ${patientData.medications?.length || 0} records (${patientData.medications?.filter((m) => m.active).length || 0} active, ${patientData.medications?.filter((m) => !m.active).length || 0} inactive)\n`;
        fullContext += `✓ Clinical Notes: ${patientData.notes?.length || 0} records\n`;
        fullContext += `✓ Allergies: ${patientData.allergies?.length || 0} records\n`;
        fullContext += `✓ Vital Signs: ${patientData.vitals?.length || 0} recordings\n`;
        fullContext += `✓ Family History: ${patientData.family_history?.length || 0} records\n`;
        fullContext += `✓ Appointments: ${patientData.appointments?.length || 0} records\n`;
        fullContext += `✓ Documents: ${patientData.documents?.length || 0} files\n`;
        fullContext += `✓ Form Responses: ${patientData.form_responses?.length || 0} forms\n`;
        fullContext += `✓ Insurance: ${patientData.insurance_policies?.length || 0} policies\n`;
        fullContext += `\n⚠️  NOT AVAILABLE: Lab results, imaging/radiology, procedures (may be mentioned in notes)\n\n`;
        fullContext += `[CRITICAL INSTRUCTIONS FOR COMPREHENSIVE ANSWERS]\n`;
        fullContext += `🔗 ALWAYS CONNECT RELATED DATA - NEVER PROVIDE ISOLATED FACTS:\n\n`;
        fullContext += `1. **Medications → Conditions** (MOST IMPORTANT):\n`;
        fullContext += `   ❌ BAD: "Patient is taking Metformin 500mg Tablet"\n`;
        fullContext += `   ✅ GOOD: "Patient is taking Metformin 500mg Tablet twice daily for Type 2 Diabetes (started March 15, 2024, prescribed by Dr. Smith)"\n`;
        fullContext += `   \n`;
        fullContext += `   Common Medication-Condition Mappings:\n`;
        fullContext += `   • Metformin, Insulin, Glipizide → Diabetes\n`;
        fullContext += `   • Lisinopril, Amlodipine, Losartan, Atenolol → Hypertension/High Blood Pressure\n`;
        fullContext += `   • Atorvastatin, Simvastatin, Rosuvastatin → High Cholesterol\n`;
        fullContext += `   • Levothyroxine → Hypothyroidism\n`;
        fullContext += `   • Albuterol → Asthma/COPD\n`;
        fullContext += `   • Omeprazole, Pantoprazole → GERD/Acid Reflux\n`;
        fullContext += `   • Sertraline, Fluoxetine, Escitalopram → Depression/Anxiety\n`;
        fullContext += `   • Warfarin, Apixaban → Atrial Fibrillation/Blood Clots\n\n`;
        fullContext += `2. **Conditions → Active Treatments**:\n`;
        fullContext += `   ❌ BAD: "Patient has Type 2 Diabetes"\n`;
        fullContext += `   ✅ GOOD: "Patient has Type 2 Diabetes (onset December 12, 2024), currently managed with Metformin 500mg twice daily since March 15, 2024"\n\n`;
        fullContext += `3. **Vitals → Related Diagnoses**:\n`;
        fullContext += `   ❌ BAD: "Blood pressure is 140/90 mmHg"\n`;
        fullContext += `   ✅ GOOD: "Blood pressure is 140/90 mmHg (elevated, patient has diagnosed hypertension being treated with Lisinopril 10mg daily)"\n\n`;
        fullContext += `4. **Clinical Notes → Key Information Extraction**:\n`;
        fullContext += `   • Extract chief complaint, diagnoses mentioned, treatment decisions, follow-up plans\n`;
        fullContext += `   • Connect note findings to current conditions and medications\n\n`;
        fullContext += `5. **Appointments → Context**:\n`;
        fullContext += `   ❌ BAD: "Patient has appointment on March 20"\n`;
        fullContext += `   ✅ GOOD: "Patient has Follow-up Visit scheduled for March 20, 2024 with Dr. Johnson (likely for diabetes management review)"\n\n`;
        fullContext += `6. **Allergies → Medication Implications**:\n`;
        fullContext += `   ✅ GOOD: "Patient is allergic to Penicillin (severe reaction), which affects antibiotic prescribing options"\n\n`;
        fullContext += `7. **Family History → Patient Risk Factors**:\n`;
        fullContext += `   ✅ GOOD: "Family history of heart disease (father had MI at age 55), which increases patient's cardiovascular risk"\n\n`;
        fullContext += `⚠️ GENERAL RULES:\n`;
        fullContext += `• NEVER show codes/IDs (NDC, drug_id, ICD-10 codes as primary - use human-readable names)\n`;
        fullContext += `• ALWAYS provide context (dates, providers, relationships)\n`;
        fullContext += `• ALWAYS show timelines and progression when relevant\n`;
        fullContext += `• ALWAYS connect related pieces of information\n`;
        fullContext += `• Medications MUST be linked to their therapeutic purpose\n\n`;
        // Patient Demographics
        if (patientData.patient) {
            const p = patientData.patient;
            fullContext += `[PATIENT_INFO]\n`;
            fullContext += `Name: ${p.first_name || ''} ${p.last_name || ''}\n`;
            fullContext += `DOB: ${p.date_of_birth || 'Not recorded'}\n`;
            fullContext += `Gender: ${p.gender || 'Not recorded'}\n`;
            fullContext += `Email: ${p.email || 'Not recorded'}\n`;
            fullContext += `Phone: ${p.phone_number || 'Not recorded'}\n\n`;
        }
        // Care Plans (treatment plans, care management)
        if (patientData.care_plans && patientData.care_plans.length > 0) {
            fullContext += `[CARE_PLANS] (${patientData.care_plans.length} total) - Treatment/care management plans\n`;
            patientData.care_plans.forEach((cp, idx) => {
                fullContext += `${idx + 1}. ${cp.name || 'Untitled'}\n`;
                if (cp.description)
                    fullContext += `   Description: ${cp.description}\n`;
                if (cp.created_at)
                    fullContext += `   Created: ${cp.created_at}\n`;
                if (cp.created_by)
                    fullContext += `   Created by: ${cp.created_by}\n`;
                fullContext += `   ID: ${cp.id}\n`;
            });
            fullContext += `\n`;
        }
        // Conditions/Diagnoses (PRIMARY source for medical conditions)
        if (patientData.conditions && patientData.conditions.length > 0) {
            fullContext += `[CONDITIONS/DIAGNOSES] (${patientData.conditions.length} total) - PRIMARY source for medical conditions\n`;
            patientData.conditions.forEach((condition, idx) => {
                // Use description (human-readable name like "Diabetes") as primary, name (ICD-10 code) as secondary
                const displayName = condition.description || condition.name || 'Unnamed condition';
                const code = condition.name; // ICD-10 code like "E13.3299"
                fullContext += `${idx + 1}. ${displayName}`;
                if (code && displayName !== code)
                    fullContext += ` (ICD-10: ${code})`;
                fullContext += `\n`;
                if (condition.active !== undefined)
                    fullContext += `   Status: ${condition.active ? 'Active' : 'Inactive'}\n`;
                if (condition.onset_date)
                    fullContext += `   Onset: ${condition.onset_date}\n`;
                if (condition.end_date)
                    fullContext += `   End Date: ${condition.end_date}\n`;
                if (condition.comment)
                    fullContext += `   Note: ${condition.comment}\n`;
                if (condition.created_by)
                    fullContext += `   Documented by: ${condition.created_by}\n`;
                fullContext += `   ID: ${condition.id}\n`;
            });
            fullContext += `\n`;
        }
        // Medications
        if (patientData.medications && patientData.medications.length > 0) {
            const activeMeds = patientData.medications.filter((m) => m.active === true);
            const inactiveMeds = patientData.medications.filter((m) => m.active === false);
            fullContext += `[MEDICATIONS] - Current and past prescriptions\n`;
            fullContext += `⚠️ CRITICAL: When mentioning medications, ALWAYS state what condition they treat!\n\n`;
            fullContext += `Active (${activeMeds.length}):\n`;
            activeMeds.forEach((med, idx) => {
                // Build human-readable medication description
                let medDisplay = `${idx + 1}. ${med.name}`;
                // Add dose form if available (Tablet, Capsule, Injection, etc.)
                if (med.dose_form)
                    medDisplay += ` ${med.dose_form}`;
                // Add strength
                medDisplay += ` - ${med.strength || 'dose not specified'}`;
                fullContext += `${medDisplay}\n`;
                // Instructions (sig) - human-readable directions
                if (med.sig)
                    fullContext += `   Instructions: ${med.sig}\n`;
                // Quantity and refills (useful context)
                if (med.quantity)
                    fullContext += `   Quantity: ${med.quantity}`;
                if (med.refills !== null && med.refills !== undefined)
                    fullContext += ` (${med.refills} refills remaining)`;
                if (med.quantity || med.refills)
                    fullContext += `\n`;
                // Timeline
                if (med.start_date)
                    fullContext += `   Started: ${med.start_date}\n`;
                if (med.last_filled_at)
                    fullContext += `   Last Filled: ${med.last_filled_at}\n`;
                // Prescriber
                if (med.created_by)
                    fullContext += `   Prescribed by: ${med.created_by}\n`;
                // Status if available
                if (med.status)
                    fullContext += `   Status: ${med.status}\n`;
                fullContext += `   🔗 IMPORTANT: State what condition this medication treats when discussing it\n`;
                fullContext += `   Record ID: ${med.id}\n`;
            });
            if (inactiveMeds.length > 0) {
                fullContext += `\nInactive/Past (${inactiveMeds.length}):\n`;
                inactiveMeds.forEach((med, idx) => {
                    let medDisplay = `${idx + 1}. ${med.name}`;
                    if (med.dose_form)
                        medDisplay += ` ${med.dose_form}`;
                    medDisplay += ` - ${med.strength || 'dose not specified'}`;
                    fullContext += `${medDisplay}\n`;
                    if (med.sig)
                        fullContext += `   Instructions: ${med.sig}\n`;
                    if (med.start_date)
                        fullContext += `   Started: ${med.start_date}\n`;
                    if (med.end_date)
                        fullContext += `   Discontinued: ${med.end_date}\n`;
                    if (med.created_by)
                        fullContext += `   Prescribed by: ${med.created_by}\n`;
                    fullContext += `   Record ID: ${med.id}\n`;
                });
            }
            fullContext += `\n`;
        }
        // Allergies
        if (patientData.allergies && patientData.allergies.length > 0) {
            const activeAllergies = patientData.allergies.filter((a) => a.active !== false);
            fullContext += `[ALLERGIES] (${activeAllergies.length} active, ${patientData.allergies.length} total)\n`;
            activeAllergies.forEach((allergy, idx) => {
                const allergen = allergy.name || allergy.allergen || 'Unknown allergen';
                fullContext += `${idx + 1}. ${allergen}`;
                if (allergy.severity)
                    fullContext += ` - Severity: ${allergy.severity}`;
                fullContext += `\n`;
                if (allergy.reaction)
                    fullContext += `   Reaction: ${allergy.reaction}\n`;
                if (allergy.onset_date)
                    fullContext += `   Onset: ${allergy.onset_date}\n`;
                if (allergy.note || allergy.comment)
                    fullContext += `   Note: ${allergy.note || allergy.comment}\n`;
                fullContext += `   ⚠️ CONTRAINDICATION: Avoid prescribing related medications\n`;
            });
            fullContext += `\n`;
        }
        // Vitals
        if (patientData.vitals && patientData.vitals.length > 0) {
            fullContext += `[VITAL_SIGNS] (${patientData.vitals.length} recordings - most recent first)\n`;
            fullContext += `Use these to identify trends, assess condition severity, and treatment effectiveness\n\n`;
            patientData.vitals.slice(0, 10).forEach((vital, idx) => {
                fullContext += `${idx + 1}. ${vital.recorded_at || vital.created_at || 'Date unknown'}`;
                if (vital.created_by)
                    fullContext += ` (by ${vital.created_by})`;
                fullContext += `\n`;
                // Group related vitals together
                if (vital.blood_pressure || vital.heart_rate) {
                    fullContext += `   Cardiovascular:\n`;
                    if (vital.blood_pressure)
                        fullContext += `     • BP: ${vital.blood_pressure} mmHg\n`;
                    if (vital.heart_rate)
                        fullContext += `     • HR: ${vital.heart_rate} bpm\n`;
                }
                if (vital.temperature)
                    fullContext += `   Temperature: ${vital.temperature}°F\n`;
                if (vital.respiratory_rate)
                    fullContext += `   Respiratory Rate: ${vital.respiratory_rate} breaths/min\n`;
                if (vital.oxygen_saturation)
                    fullContext += `   O2 Saturation: ${vital.oxygen_saturation}%\n`;
                if (vital.weight || vital.height) {
                    fullContext += `   Physical:\n`;
                    if (vital.weight)
                        fullContext += `     • Weight: ${vital.weight}\n`;
                    if (vital.height)
                        fullContext += `     • Height: ${vital.height}\n`;
                }
            });
            fullContext += `\n`;
        }
        // Family History
        if (patientData.family_history && patientData.family_history.length > 0) {
            fullContext += `[FAMILY_HISTORY]\n`;
            patientData.family_history.forEach((fh, idx) => {
                fullContext += `${idx + 1}. Relationship: ${fh.relationship || 'Unknown'}\n`;
                if (fh.diagnoses && fh.diagnoses.length > 0) {
                    fullContext += `   Conditions: ${fh.diagnoses.map((d) => d.description || d.diagnosis).join(', ')}\n`;
                }
            });
            fullContext += `\n`;
        }
        // Clinical Notes
        if (patientData.notes && patientData.notes.length > 0) {
            fullContext += `[CLINICAL_NOTES] (${patientData.notes.length} total - most recent first)\n`;
            patientData.notes.slice(0, 5).forEach((note, idx) => {
                fullContext += `${idx + 1}. ${note.name || 'Clinical Note'} - ${note.created_at || 'Date unknown'}\n`;
                if (note.created_by)
                    fullContext += `   Provider: ${note.created_by}\n`;
                // Extract meaningful content from sections
                if (note.sections && Array.isArray(note.sections)) {
                    note.sections.forEach((section) => {
                        if (section.name)
                            fullContext += `   📋 ${section.name}:\n`;
                        // Extract answers from section
                        if (section.answers && Array.isArray(section.answers)) {
                            section.answers.forEach((answer) => {
                                if (answer.value || answer.text) {
                                    const answerText = answer.value || answer.text;
                                    if (answer.name) {
                                        fullContext += `      • ${answer.name}: ${answerText}\n`;
                                    }
                                    else {
                                        fullContext += `      • ${answerText}\n`;
                                    }
                                }
                            });
                        }
                    });
                }
                fullContext += `\n`;
            });
            fullContext += `\n`;
        }
        // Appointments
        if (patientData.appointments && patientData.appointments.length > 0) {
            fullContext += `[APPOINTMENTS] (${patientData.appointments.length} total) - Scheduled and past visits\n`;
            patientData.appointments.slice(0, 10).forEach((appt, idx) => {
                // Build human-readable appointment description
                const apptName = appt.name || appt.title || 'Appointment';
                const apptType = appt.appointment_type || appt.type || '';
                const interaction = appt.interaction_type || '';
                fullContext += `${idx + 1}. ${apptName}`;
                if (apptType)
                    fullContext += ` (${apptType})`;
                fullContext += `\n`;
                // Description provides context
                if (appt.description)
                    fullContext += `   Description: ${appt.description}\n`;
                // Interaction type (in-person, telehealth, etc.)
                if (interaction)
                    fullContext += `   Type: ${interaction}\n`;
                // Timing
                if (appt.start_time)
                    fullContext += `   Scheduled: ${appt.start_time}`;
                if (appt.end_time)
                    fullContext += ` to ${appt.end_time}`;
                if (appt.start_time)
                    fullContext += `\n`;
                // Actual times if different
                if (appt.actual_start_time)
                    fullContext += `   Actual Start: ${appt.actual_start_time}\n`;
                if (appt.actual_end_time)
                    fullContext += `   Actual End: ${appt.actual_end_time}\n`;
                // Provider/host
                if (appt.host || appt.provider)
                    fullContext += `   Provider: ${appt.host || appt.provider}\n`;
                // Location if available
                if (appt.location && typeof appt.location === 'object' && appt.location.name) {
                    fullContext += `   Location: ${appt.location.name}\n`;
                }
                // Status (completed, scheduled, cancelled, etc.)
                if (appt.status_history && appt.status_history.length > 0) {
                    const currentStatus = appt.status_history[appt.status_history.length - 1];
                    if (currentStatus.status)
                        fullContext += `   Status: ${currentStatus.status}\n`;
                }
                // Visit note reference
                if (appt.visit_note)
                    fullContext += `   Visit Note: ${appt.visit_note}\n`;
                fullContext += `   Record ID: ${appt.id}\n`;
            });
            fullContext += `\n`;
        }
        // Documents (forms, consent forms, patient paperwork)
        if (patientData.documents && patientData.documents.length > 0) {
            fullContext += `[DOCUMENTS] (${patientData.documents.length} total) - Forms, consent documents, patient paperwork\n`;
            patientData.documents.slice(0, 10).forEach((doc, idx) => {
                const docName = doc.name || 'Document';
                const docType = doc.type || 'Unknown type';
                fullContext += `${idx + 1}. ${docName} (${docType})`;
                if (doc.filename)
                    fullContext += ` - ${doc.filename}`;
                fullContext += `\n`;
                // Document template info
                if (doc.document_template)
                    fullContext += `   Template: ${doc.document_template}\n`;
                // Created info
                if (doc.created_at)
                    fullContext += `   Created: ${doc.created_at}`;
                if (doc.created_by)
                    fullContext += ` by ${doc.created_by}`;
                if (doc.created_at)
                    fullContext += `\n`;
                // Sharing status
                if (doc.share_with_patient !== null) {
                    fullContext += `   Shared with Patient: ${doc.share_with_patient ? 'Yes' : 'No'}\n`;
                }
                // Sections - extract key information
                if (doc.sections && Array.isArray(doc.sections) && doc.sections.length > 0) {
                    fullContext += `   Content Sections: ${doc.sections.length} sections\n`;
                    // Could expand sections similar to notes if needed
                }
                fullContext += `   Record ID: ${doc.id}\n`;
            });
            fullContext += `\n`;
        }
        // Form Responses (patient-completed questionnaires, assessments)
        if (patientData.form_responses && patientData.form_responses.length > 0) {
            fullContext += `[FORM RESPONSES] (${patientData.form_responses.length} total) - Patient-completed questionnaires and assessments\n`;
            patientData.form_responses.slice(0, 10).forEach((form, idx) => {
                fullContext += `${idx + 1}. Form ID: ${form.form}`;
                if (form.form_version)
                    fullContext += ` (v${form.form_version})`;
                fullContext += `\n`;
                // Score if available (for assessments)
                if (form.score !== undefined && form.score !== null) {
                    fullContext += `   Score: ${form.score}\n`;
                }
                // Completion info
                if (form.created_at)
                    fullContext += `   Completed: ${form.created_at}`;
                if (form.created_by)
                    fullContext += ` by ${form.created_by}`;
                if (form.created_at)
                    fullContext += `\n`;
                // Sections - extract answers similar to clinical notes
                if (form.sections && Array.isArray(form.sections)) {
                    fullContext += `   Responses:\n`;
                    form.sections.forEach((section) => {
                        if (section.name)
                            fullContext += `      ${section.name}:\n`;
                        if (section.answers && Array.isArray(section.answers)) {
                            section.answers.forEach((answer) => {
                                if (answer.value || answer.text) {
                                    const answerText = answer.value || answer.text;
                                    if (answer.name) {
                                        fullContext += `         • ${answer.name}: ${answerText}\n`;
                                    }
                                    else {
                                        fullContext += `         • ${answerText}\n`;
                                    }
                                }
                            });
                        }
                    });
                }
                fullContext += `   Record ID: ${form.id}\n`;
            });
            fullContext += `\n`;
        }
        // Insurance Policies (coverage information)
        if (patientData.insurance_policies && patientData.insurance_policies.length > 0) {
            fullContext += `[INSURANCE POLICIES] (${patientData.insurance_policies.length} total) - Coverage information\n`;
            patientData.insurance_policies.forEach((policy, idx) => {
                fullContext += `${idx + 1}. ${policy.type || 'Insurance Policy'}\n`;
                // Common insurance fields (fields vary by policy)
                if (policy.carrier_name)
                    fullContext += `   Carrier: ${policy.carrier_name}\n`;
                if (policy.plan_name)
                    fullContext += `   Plan: ${policy.plan_name}\n`;
                if (policy.policy_number)
                    fullContext += `   Policy Number: ${policy.policy_number}\n`;
                if (policy.group_number)
                    fullContext += `   Group Number: ${policy.group_number}\n`;
                // Coverage dates
                if (policy.effective_date)
                    fullContext += `   Effective: ${policy.effective_date}`;
                if (policy.expiration_date)
                    fullContext += ` to ${policy.expiration_date}`;
                if (policy.effective_date)
                    fullContext += `\n`;
                // Subscriber info
                if (policy.subscriber_name)
                    fullContext += `   Subscriber: ${policy.subscriber_name}\n`;
                if (policy.relationship_to_subscriber) {
                    fullContext += `   Relationship: ${policy.relationship_to_subscriber}\n`;
                }
                // Created info
                if (policy.created_at)
                    fullContext += `   Added: ${policy.created_at}`;
                if (policy.created_by)
                    fullContext += ` by ${policy.created_by}`;
                if (policy.created_at)
                    fullContext += `\n`;
                fullContext += `   Record ID: ${policy.id}\n`;
            });
            fullContext += `\n`;
        }
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            historyContext = '\n=== CONVERSATION HISTORY ===\n' +
                conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n') +
                '\n';
        }
        const prompt = `${historyContext}
${fullContext}

=== QUESTION ===
${query}

=== YOUR TASK ===
Answer this question using ADVANCED multi-level confidence reasoning. Don't just say "I don't know" -
reason through uncertainty, make intelligent inferences, and provide the best possible answer.

REASONING:
[Show your sophisticated reasoning process with DETAILED extraction:
1. What is the question asking? (Core intent + sub-questions + what specific details needed)

2. What data sources do I need? (Primary + secondary + tertiary)

3. What DIRECT evidence did I find? (Explicit statements → HIGH confidence)
   ⚠️ For EACH piece of evidence, extract ALL key details:
   - Source ID: CARE_PLAN #3, MEDICATION #med_abc, NOTE #note_123
   - Exact dates: "March 10, 2024" not "recently"
   - Provider names: "Dr. Sarah Smith"
   - Specific values: "500mg twice daily", "140/90 mmHg"
   - Status: "Active", "Completed", "Discontinued"
   - Evidence strength: ⭐⭐⭐ STRONG / ⭐⭐ MODERATE / ⭐ WEAK / ❓ NONE

4. What INDIRECT evidence exists? (Can I infer from related data? → MEDIUM confidence)
   ⚠️ Extract details from indirect evidence too:
   - Medications → conditions (with medication name, dose, start date, prescriber)
   - Vitals patterns → health status (with specific values, dates, trends)
   - Multiple weak signals → synthesized conclusion (cite each signal with details)

5. Evidence synthesis: How do multiple sources combine?
   - 1 STRONG source = HIGH confidence
   - 2+ MODERATE sources = MEDIUM-HIGH confidence
   - 3+ WEAK sources = MEDIUM confidence
   - Mix of sources = Weighted average
   ⚠️ Show how sources connect (timeline, relationships, clinical picture)

6. What can I CONFIRM vs INFER vs SUGGEST?
   - CONFIRMED: Explicit in data (HIGH) - cite with full details
   - INFERRED: Logical derivation (MEDIUM) - show all supporting evidence with details
   - SUGGESTED: Weak signals (LOW) - list signals with specifics
   - UNKNOWN: No data (acknowledge gap) - suggest what data would help

7. Partial answer construction: Provide what I DO know (with full details), acknowledge what I don't

8. Final answer with confidence levels per claim AND detailed citations for each claim]

SHORT_ANSWER:
[Provide best possible answer using multi-level confidence:

IF HIGH CONFIDENCE (direct data):
"[Answer] (confirmed in [source])"

IF MEDIUM CONFIDENCE (inference):
"While not explicitly stated, [inference] based on [evidence 1], [evidence 2] (reasoned inference, MEDIUM confidence)"

IF LOW CONFIDENCE (weak signals):
"Available indicators suggest [possibility]: [signal 1], [signal 2], [signal 3] (suggestive but not confirmed, LOW confidence)"

IF PARTIAL DATA:
"I can confirm [X with HIGH confidence]. I can infer [Y with MEDIUM confidence]. I don't have data for [Z], but related information includes: [alternatives]"

IF NO DATA:
"I don't have [specific request] in available records. Related information that may help: [alternatives]"]

DETAILED_SUMMARY:
[Comprehensive multi-level answer with RICH DETAIL, SPECIFIC CITATIONS, and EXPANDED CONTEXT:

**CRITICAL: Every answer must be DETAILED and USEFUL, not just acknowledging data exists!**

**CONFIRMED INFORMATION (HIGH CONFIDENCE ⭐⭐⭐):**
- ⚠️ MUST include DETAILED citations with:
  * Source ID (CARE_PLAN #3, MEDICATION #med_abc123, NOTE #note_xyz789)
  * Exact dates (created 2024-03-10, started 2024-01-15, last updated 2024-03-20)
  * Provider names (Dr. Sarah Smith, Nurse Jane Doe)
  * Specific values (dosage: 500mg, frequency: twice daily, BP: 140/90)
- ⚠️ EXPAND with full clinical context:
  * Not just: "Patient has diabetes"
  * Instead: "Patient has Type 2 Diabetes (CARE_PLAN #3, created by Dr. Sarah Smith on March 10, 2024). Currently managed with Metformin 500mg twice daily (started March 15, 2024). Most recent A1C mentioned in notes was 7.2% (March 20, 2024). Care plan includes dietary modifications and exercise recommendations."

**REASONED INFERENCES (MEDIUM CONFIDENCE ⭐⭐):**
- ⚠️ Provide FULL CONTEXT for inferences, not just the conclusion:
  * Include ALL supporting evidence with details
  * Link evidence together to show clinical picture
  * Example: "Patient likely has hypertension based on comprehensive evidence:
    1) MEDICATION: Taking Lisinopril 10mg once daily (ACE inhibitor, MEDICATION #med_123, prescribed by Dr. Smith on Feb 20, 2024)
    2) VITALS: Recent BP readings consistently elevated:
       - March 15: 140/90 mmHg
       - March 20: 142/88 mmHg
       - March 25: 138/90 mmHg
    3) CLINICAL NOTES: Provider note from March 20 states 'Continue BP monitoring, patient reports taking medication as prescribed'
    (MEDIUM-HIGH confidence through synthesis of multiple sources ⭐⭐)"

**SUGGESTIVE INDICATORS (LOW CONFIDENCE ⭐):**
- ⚠️ Still provide detailed context for weak signals:
  * Cite specific sources even for weak evidence
  * Provide dates and context
  * Example: "Family history shows diabetes risk (FAMILY_HISTORY #fh_456, mother diagnosed with Type 2 Diabetes at age 52). Patient's recent weight loss of 10 lbs documented in clinical note from March 15, 2024. BMI calculated as 28 from height/weight recorded March 15. Together these suggest possible diabetes risk (LOW confidence ⭐)"

**KEY INFORMATION EXTRACTION:**
For every piece of data mentioned, extract and present:
- 💊 Medications: Name, dosage, frequency, route, start date, prescriber, medication ID, status (active/inactive)
- 📋 Care Plans: Condition name, description, created date, created by, care plan ID, assigned to
- 📊 Vitals: Specific values with units, date recorded, trend if multiple readings
- 📝 Notes: Date, provider, key findings, note ID
- 👥 Providers: Full names, roles, associated with which records
- 📅 Dates: Always include specific dates, not just "recently"
- 🔢 Values: Exact numbers with units (500mg, not "diabetes medication")

**CONTEXT EXPANSION - Make Information USEFUL:**
Don't just list data - explain the clinical picture:
- Treatment plan: "Patient's anxiety is managed through combination approach: Sertraline 50mg daily (started Jan 2024), regular therapy sessions (appointments every 2 weeks with Dr. Wilson), and self-care plan documented in CARE_PLAN #1"
- Timeline: "Diabetes diagnosed March 2024 → Metformin started 5 days later → A1C improved from 8.5% to 7.2% over 3 months"
- Status: "Blood pressure currently elevated despite treatment. Latest reading 140/90 suggests medication may need dose adjustment or additional agent"
- Relationships: "Migraine medications (Ubrelvy for acute, IBgard for prevention) align with CARE_PLAN #2 created March 15, 2024"

**DATA GAPS (ACKNOWLEDGED):**
- What's missing and what would help
- Be specific about what data would answer question better
- Example: "No lab results available in current system. Specific data that would help: 1) A1C value (diabetes control), 2) Lipid panel (cardiovascular risk), 3) Basic metabolic panel (kidney function). Alternative: Vital signs show stable weight and BP, medication list suggests active management ❓"

**SYNTHESIS & CLINICAL PICTURE:**
- Provide COMPREHENSIVE overview, not just summary
- Connect all pieces into coherent clinical narrative
- Include timeline of events
- Note treatment effectiveness where evident
- Identify areas needing attention
- Example: "Overall, patient has multiple chronic conditions (Anxiety, Migraine, likely Diabetes and Hypertension) under active management. Treatment started within appropriate timeframes (medication within days of care plan creation). Medication adherence appears good based on refill records. BP remains elevated suggesting need for medication adjustment. Mental health conditions appear stable with combination therapy approach."

**ACTIONABLE INFORMATION:**
End with what this means clinically:
- Current status
- Treatment effectiveness
- Areas of concern
- Next steps or follow-up needed (if evident from data)
- What providers are monitoring]

CRITICAL: Use your reasoning capabilities! Don't just say "I don't know" when you can:
- Make reasonable inferences from indirect evidence (label as INFERRED)
- Synthesize multiple weak signals into stronger conclusions
- Provide partial answers for what you DO know
- Reason probabilistically about likely scenarios

Now provide your multi-level confidence response:`;
        try {
            const response = await this.generate(prompt, systemPrompt, 0.2); // Slightly higher temp for reasoning
            // Parse response
            const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=\n\s*SHORT_ANSWER:)/s);
            const shortMatch = response.match(/SHORT_ANSWER:\s*(.+?)(?=\n\s*DETAILED_SUMMARY:)/s);
            const detailedMatch = response.match(/DETAILED_SUMMARY:\s*(.+)$/s);
            // Extract reasoning steps
            const reasoning_chain = [];
            if (reasoningMatch) {
                const reasoningText = reasoningMatch[1].trim();
                // Split by numbered items or newlines
                const steps = reasoningText.split(/\n/).filter(line => line.trim().length > 0);
                reasoning_chain.push(...steps);
            }
            return {
                short_answer: shortMatch ? shortMatch[1].trim() : 'Unable to generate answer',
                detailed_summary: detailedMatch ? detailedMatch[1].trim() : response,
                reasoning_chain,
            };
        }
        catch (error) {
            console.error('Chain-of-thought reasoning failed:', error.message);
            throw error;
        }
    }
    /**
     * Extract structured information from text
     */
    async extractStructuredInfo(text, targetTypes) {
        const systemPrompt = `You are a medical information extraction system. Extract structured information from clinical text.`;
        const prompt = `Extract the following types of information from this clinical text:
${targetTypes.join(', ')}

Clinical Text:
${text}

For each piece of information found, provide:
- type: one of [${targetTypes.join(', ')}]
- value: the extracted value
- confidence: 0-1 score

Format as JSON array:
[{"type": "medication", "value": "Lisinopril 10mg", "confidence": 0.95}, ...]`;
        try {
            const response = await this.generate(prompt, systemPrompt, 0.0);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        }
        catch (error) {
            console.error('Structured extraction failed:', error);
            return [];
        }
    }
}
exports.OllamaService = OllamaService;
//# sourceMappingURL=ollama.service.js.map