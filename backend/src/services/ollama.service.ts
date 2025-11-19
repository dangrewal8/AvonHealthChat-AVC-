/**
 * Ollama Service
 * Handles embeddings and LLM generation using local Ollama instance
 * HIPAA-compliant - all processing stays local
 */

import axios, { AxiosInstance } from 'axios';
import type {
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
} from '../types';

export class OllamaService {
  private client: AxiosInstance;
  private embeddingModel: string;
  private llmModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(
    baseUrl: string,
    embeddingModel: string,
    llmModel: string,
    maxTokens: number,
    temperature: number
  ) {
    this.client = axios.create({
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
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  /**
   * Generate embedding for text using nomic-embed-text
   * Returns 768-dimensional vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const request: OllamaEmbeddingRequest = {
        model: this.embeddingModel,
        prompt: text,
      };

      const response = await this.client.post<OllamaEmbeddingResponse>(
        '/api/embeddings',
        request
      );

      return response.data.embedding;
    } catch (error: any) {
      console.error('Ollama embedding error:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate text using Meditron LLM
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    temperature?: number
  ): Promise<string> {
    try {
      const request: OllamaGenerateRequest = {
        model: this.llmModel,
        prompt,
        system: systemPrompt,
        temperature: temperature ?? this.temperature,
        max_tokens: this.maxTokens,
        stream: false,
      };

      const response = await this.client.post<OllamaGenerateResponse>(
        '/api/generate',
        request
      );

      return response.data.response;
    } catch (error: any) {
      console.error('Ollama generation error:', error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * Generate structured answer from retrieved documents
   * ENHANCED with extensive medical question-answering guidelines
   */
  async generateRAGAnswer(
    query: string,
    context: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<{ short_answer: string; detailed_summary: string }> {
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
  async reasonWithChainOfThought(
    query: string,
    patientData: {
      patient: any;
      care_plans: any[];
      medications: any[];
      notes: any[];
      allergies: any[];
      conditions: any[];
      vitals: any[];
      family_history: any[];
      appointments: any[];
      documents: any[];
      form_responses: any[];
      insurance_policies: any[];
    },
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<{ short_answer: string; detailed_summary: string; reasoning_chain: string[] }> {

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
- Include specific dates, dosages, and citations when available

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
- care_plans: Diagnosed conditions, treatment plans, diagnoses
- medications: Current prescriptions (active=true), past medications (active=false), dosages, instructions
- notes: Clinical encounter notes, provider observations, visit summaries
- allergies: Known allergies, reactions, severity
- conditions: Medical diagnoses, active/inactive status
- vitals: Blood pressure, heart rate, temperature, weight, height, O2 sat, respiratory rate
- family_history: Genetic/hereditary conditions, family member diagnoses
- appointments: Scheduled visits, past appointments, providers
- documents: Forms, consent documents, patient paperwork
- form_responses: Patient-completed questionnaires
- insurance_policies: Coverage information

QUESTION-TO-DATA MAPPING (help user find what they need):
- "lab results" → Check vitals (closest), notes (may mention), or state "not available"
- "test results" → Check notes, vitals, or state "not available"
- "imaging/x-rays" → Check notes (may reference), documents, or state "not available"
- "procedures" → Check notes (may document), care plans, or state "not available"
- "diagnoses/conditions" → Check care_plans (primary), conditions, medications (can infer)
- "symptoms" → Check notes (patient reports), vitals (objective findings)
- "provider/doctor" → Check care_plans.created_by, medications.created_by, notes.created_by
- "treatment plan" → Check care_plans, medications, notes
- "medical history" → Check care_plans, medications (timeline), notes
- "current health status" → Synthesize care_plans + medications + recent vitals

You must think step-by-step, be honest about gaps, and help users find relevant information even when exact match isn't available.`;

    // Build comprehensive context with ALL patient data organized by type
    let fullContext = `=== PATIENT DATA ===\n\n`;

    // DATA AVAILABILITY SUMMARY (helps Meditron know what's available upfront)
    fullContext += `[DATA AVAILABILITY SUMMARY]\n`;
    fullContext += `✓ Patient Demographics: ${patientData.patient ? 'Available' : 'Not available'}\n`;
    fullContext += `✓ Care Plans: ${patientData.care_plans?.length || 0} records\n`;
    fullContext += `✓ Medications: ${patientData.medications?.length || 0} records (${patientData.medications?.filter((m: any) => m.active).length || 0} active, ${patientData.medications?.filter((m: any) => !m.active).length || 0} inactive)\n`;
    fullContext += `✓ Clinical Notes: ${patientData.notes?.length || 0} records\n`;
    fullContext += `✓ Allergies: ${patientData.allergies?.length || 0} records\n`;
    fullContext += `✓ Vital Signs: ${patientData.vitals?.length || 0} recordings\n`;
    fullContext += `✓ Family History: ${patientData.family_history?.length || 0} records\n`;
    fullContext += `✓ Appointments: ${patientData.appointments?.length || 0} records\n`;
    fullContext += `✓ Documents: ${patientData.documents?.length || 0} files\n`;
    fullContext += `✓ Form Responses: ${patientData.form_responses?.length || 0} forms\n`;
    fullContext += `✓ Insurance: ${patientData.insurance_policies?.length || 0} policies\n`;
    fullContext += `\n⚠️  NOT AVAILABLE: Lab results, imaging/radiology, procedures (may be mentioned in notes)\n\n`;

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

    // Care Plans (Conditions/Diagnoses)
    if (patientData.care_plans && patientData.care_plans.length > 0) {
      fullContext += `[CARE_PLANS] (${patientData.care_plans.length} total)\n`;
      patientData.care_plans.forEach((cp, idx) => {
        fullContext += `${idx + 1}. ${cp.name || 'Untitled'}\n`;
        if (cp.description) fullContext += `   Description: ${cp.description}\n`;
        if (cp.created_at) fullContext += `   Created: ${cp.created_at}\n`;
        if (cp.created_by) fullContext += `   Created by: ${cp.created_by}\n`;
        fullContext += `   ID: ${cp.id}\n`;
      });
      fullContext += `\n`;
    }

    // Medications
    if (patientData.medications && patientData.medications.length > 0) {
      const activeMeds = patientData.medications.filter((m: any) => m.active === true);
      const inactiveMeds = patientData.medications.filter((m: any) => m.active === false);

      fullContext += `[MEDICATIONS]\n`;
      fullContext += `Active (${activeMeds.length}):\n`;
      activeMeds.forEach((med, idx) => {
        fullContext += `${idx + 1}. ${med.name} - ${med.strength || 'dose not specified'}\n`;
        if (med.sig) fullContext += `   Instructions: ${med.sig}\n`;
        if (med.start_date) fullContext += `   Started: ${med.start_date}\n`;
        if (med.created_by) fullContext += `   Prescribed by: ${med.created_by}\n`;
        fullContext += `   ID: ${med.id}\n`;
      });

      if (inactiveMeds.length > 0) {
        fullContext += `\nInactive/Past (${inactiveMeds.length}):\n`;
        inactiveMeds.forEach((med, idx) => {
          fullContext += `${idx + 1}. ${med.name} - ${med.strength || 'dose not specified'}\n`;
          if (med.sig) fullContext += `   Instructions: ${med.sig}\n`;
          if (med.start_date) fullContext += `   Started: ${med.start_date}\n`;
          if (med.end_date) fullContext += `   Discontinued: ${med.end_date}\n`;
          if (med.created_by) fullContext += `   Prescribed by: ${med.created_by}\n`;
          fullContext += `   ID: ${med.id}\n`;
        });
      }
      fullContext += `\n`;
    }

    // Allergies
    if (patientData.allergies && patientData.allergies.length > 0) {
      fullContext += `[ALLERGIES] (${patientData.allergies.length} total)\n`;
      patientData.allergies.forEach((allergy, idx) => {
        fullContext += `${idx + 1}. ${allergy.allergen || 'Unknown allergen'}\n`;
        if (allergy.reaction) fullContext += `   Reaction: ${allergy.reaction}\n`;
        if (allergy.severity) fullContext += `   Severity: ${allergy.severity}\n`;
        if (allergy.status) fullContext += `   Status: ${allergy.status}\n`;
      });
      fullContext += `\n`;
    }

    // Vitals
    if (patientData.vitals && patientData.vitals.length > 0) {
      fullContext += `[VITAL_SIGNS] (${patientData.vitals.length} recordings)\n`;
      patientData.vitals.slice(0, 10).forEach((vital, idx) => {
        fullContext += `${idx + 1}. Date: ${vital.recorded_at || vital.created_at || 'Unknown'}\n`;
        if (vital.blood_pressure) fullContext += `   BP: ${vital.blood_pressure}\n`;
        if (vital.heart_rate) fullContext += `   HR: ${vital.heart_rate} bpm\n`;
        if (vital.temperature) fullContext += `   Temp: ${vital.temperature}\n`;
        if (vital.weight) fullContext += `   Weight: ${vital.weight}\n`;
        if (vital.height) fullContext += `   Height: ${vital.height}\n`;
      });
      fullContext += `\n`;
    }

    // Family History
    if (patientData.family_history && patientData.family_history.length > 0) {
      fullContext += `[FAMILY_HISTORY]\n`;
      patientData.family_history.forEach((fh, idx) => {
        fullContext += `${idx + 1}. Relationship: ${fh.relationship || 'Unknown'}\n`;
        if (fh.diagnoses && fh.diagnoses.length > 0) {
          fullContext += `   Conditions: ${fh.diagnoses.map((d: any) => d.description || d.diagnosis).join(', ')}\n`;
        }
      });
      fullContext += `\n`;
    }

    // Clinical Notes
    if (patientData.notes && patientData.notes.length > 0) {
      fullContext += `[CLINICAL_NOTES] (${patientData.notes.length} total)\n`;
      patientData.notes.slice(0, 5).forEach((note, idx) => {
        fullContext += `${idx + 1}. ${note.name || 'Clinical Note'}\n`;
        if (note.created_at) fullContext += `   Date: ${note.created_at}\n`;
        if (note.created_by) fullContext += `   Provider: ${note.created_by}\n`;
        if (note.sections) {
          note.sections.forEach((section: any) => {
            if (section.name) fullContext += `   ${section.name}\n`;
          });
        }
      });
      fullContext += `\n`;
    }

    // Appointments
    if (patientData.appointments && patientData.appointments.length > 0) {
      fullContext += `[APPOINTMENTS] (${patientData.appointments.length} total)\n`;
      patientData.appointments.forEach((appt, idx) => {
        fullContext += `${idx + 1}. ${appt.title || 'Appointment'}\n`;
        if (appt.scheduled_at) fullContext += `   Scheduled: ${appt.scheduled_at}\n`;
        if (appt.provider) fullContext += `   Provider: ${appt.provider}\n`;
        if (appt.status) fullContext += `   Status: ${appt.status}\n`;
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
[Show your sophisticated reasoning process:
1. What is the question asking? (Core intent + sub-questions)
2. What data sources do I need? (Primary + secondary + tertiary)
3. What DIRECT evidence did I find? (Explicit statements → HIGH confidence)
   - List with evidence strength: ⭐⭐⭐ STRONG / ⭐⭐ MODERATE / ⭐ WEAK / ❓ NONE
4. What INDIRECT evidence exists? (Can I infer from related data? → MEDIUM confidence)
   - Medications → conditions
   - Vitals patterns → health status
   - Multiple weak signals → synthesized conclusion
5. Evidence synthesis: How do multiple sources combine?
   - 1 STRONG source = HIGH confidence
   - 2+ MODERATE sources = MEDIUM-HIGH confidence
   - 3+ WEAK sources = MEDIUM confidence
   - Mix of sources = Weighted average
6. What can I CONFIRM vs INFER vs SUGGEST?
   - CONFIRMED: Explicit in data (HIGH)
   - INFERRED: Logical derivation (MEDIUM)
   - SUGGESTED: Weak signals (LOW)
   - UNKNOWN: No data (acknowledge gap)
7. Partial answer construction: Provide what I DO know, acknowledge what I don't
8. Final answer with confidence levels per claim]

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
[Comprehensive multi-level answer with:

**CONFIRMED INFORMATION (HIGH CONFIDENCE):**
- Explicit data from primary sources
- Example: "Patient has diabetes (CARE_PLAN #3, created 2024-03-10) ⭐⭐⭐"

**REASONED INFERENCES (MEDIUM CONFIDENCE):**
- Logical conclusions from indirect evidence
- Example: "Patient likely has hypertension based on: 1) Taking Lisinopril 10mg (BP medication), 2) Recent BP readings 140/90, 3) Provider notes mention BP monitoring (synthesized inference, MEDIUM-HIGH confidence) ⭐⭐"

**SUGGESTIVE INDICATORS (LOW CONFIDENCE):**
- Weak signals that point to possibilities
- Example: "Family history shows diabetes (mother), recent weight loss noted, increased thirst in notes - may indicate diabetes risk (suggestive, LOW confidence) ⭐"

**DATA GAPS (ACKNOWLEDGED):**
- What's missing and what would help
- Example: "No lab results available. A1C or fasting glucose would confirm diabetes status. Available alternatives: vital signs, medication list ❓"

**SYNTHESIS & RECOMMENDATIONS:**
- Overall clinical picture from available data
- Confidence level for overall answer
- What additional data would improve confidence]

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
      const reasoning_chain: string[] = [];
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
    } catch (error: any) {
      console.error('Chain-of-thought reasoning failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract structured information from text
   */
  async extractStructuredInfo(
    text: string,
    targetTypes: string[]
  ): Promise<Array<{ type: string; value: string; confidence: number }>> {
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
    } catch (error) {
      console.error('Structured extraction failed:', error);
      return [];
    }
  }
}
