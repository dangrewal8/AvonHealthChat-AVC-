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

REASONING PROCESS (Chain-of-Thought):
1. UNDERSTAND: Analyze what the question is really asking
2. IDENTIFY: Determine what data sources are needed (medications, care plans, notes, vitals, etc.)
3. SEARCH: Look through relevant patient data systematically
4. ANALYZE: Consider relationships, temporal aspects, and clinical context
5. SYNTHESIZE: Formulate a complete, accurate answer
6. VERIFY: Double-check against the data for accuracy

CRITICAL RULES:
- ONLY use information from the provided patient data
- If information is not available, explicitly state this
- Never make assumptions or use general medical knowledge
- Distinguish between current/active vs past/inactive data
- Include specific dates, dosages, and citations
- Show your reasoning process

AVAILABLE DATA SOURCES:
- patient: Demographics, contact information
- care_plans: Diagnosed conditions, treatment plans
- medications: Current and past medications (check active field)
- notes: Clinical encounter notes
- allergies: Known allergies and sensitivities
- conditions: Medical conditions
- vitals: Vital signs (BP, HR, temp, weight, etc.)
- family_history: Family medical history
- appointments: Scheduled appointments
- documents, form_responses, insurance_policies

You must think step-by-step and show your reasoning.`;
        // Build comprehensive context with ALL patient data organized by type
        let fullContext = `=== PATIENT DATA ===\n\n`;
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
        // Medications
        if (patientData.medications && patientData.medications.length > 0) {
            const activeMeds = patientData.medications.filter((m) => m.active === true);
            const inactiveMeds = patientData.medications.filter((m) => m.active === false);
            fullContext += `[MEDICATIONS]\n`;
            fullContext += `Active (${activeMeds.length}):\n`;
            activeMeds.forEach((med, idx) => {
                fullContext += `${idx + 1}. ${med.name} - ${med.strength || 'dose not specified'}\n`;
                if (med.sig)
                    fullContext += `   Instructions: ${med.sig}\n`;
                if (med.start_date)
                    fullContext += `   Started: ${med.start_date}\n`;
                if (med.created_by)
                    fullContext += `   Prescribed by: ${med.created_by}\n`;
                fullContext += `   ID: ${med.id}\n`;
            });
            if (inactiveMeds.length > 0) {
                fullContext += `\nInactive/Past (${inactiveMeds.length}):\n`;
                inactiveMeds.forEach((med, idx) => {
                    fullContext += `${idx + 1}. ${med.name} - ${med.strength || 'dose not specified'}\n`;
                    if (med.sig)
                        fullContext += `   Instructions: ${med.sig}\n`;
                    if (med.start_date)
                        fullContext += `   Started: ${med.start_date}\n`;
                    if (med.end_date)
                        fullContext += `   Discontinued: ${med.end_date}\n`;
                    if (med.created_by)
                        fullContext += `   Prescribed by: ${med.created_by}\n`;
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
                if (allergy.reaction)
                    fullContext += `   Reaction: ${allergy.reaction}\n`;
                if (allergy.severity)
                    fullContext += `   Severity: ${allergy.severity}\n`;
                if (allergy.status)
                    fullContext += `   Status: ${allergy.status}\n`;
            });
            fullContext += `\n`;
        }
        // Vitals
        if (patientData.vitals && patientData.vitals.length > 0) {
            fullContext += `[VITAL_SIGNS] (${patientData.vitals.length} recordings)\n`;
            patientData.vitals.slice(0, 10).forEach((vital, idx) => {
                fullContext += `${idx + 1}. Date: ${vital.recorded_at || vital.created_at || 'Unknown'}\n`;
                if (vital.blood_pressure)
                    fullContext += `   BP: ${vital.blood_pressure}\n`;
                if (vital.heart_rate)
                    fullContext += `   HR: ${vital.heart_rate} bpm\n`;
                if (vital.temperature)
                    fullContext += `   Temp: ${vital.temperature}\n`;
                if (vital.weight)
                    fullContext += `   Weight: ${vital.weight}\n`;
                if (vital.height)
                    fullContext += `   Height: ${vital.height}\n`;
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
            fullContext += `[CLINICAL_NOTES] (${patientData.notes.length} total)\n`;
            patientData.notes.slice(0, 5).forEach((note, idx) => {
                fullContext += `${idx + 1}. ${note.name || 'Clinical Note'}\n`;
                if (note.created_at)
                    fullContext += `   Date: ${note.created_at}\n`;
                if (note.created_by)
                    fullContext += `   Provider: ${note.created_by}\n`;
                if (note.sections) {
                    note.sections.forEach((section) => {
                        if (section.name)
                            fullContext += `   ${section.name}\n`;
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
                if (appt.scheduled_at)
                    fullContext += `   Scheduled: ${appt.scheduled_at}\n`;
                if (appt.provider)
                    fullContext += `   Provider: ${appt.provider}\n`;
                if (appt.status)
                    fullContext += `   Status: ${appt.status}\n`;
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
Answer this question using chain-of-thought reasoning. Structure your response as follows:

REASONING:
[Show your step-by-step thinking process:
1. What is the question asking?
2. What data sources do I need to check?
3. What did I find in each source?
4. How do I synthesize this information?
5. What's my confidence level?]

SHORT_ANSWER:
[1-2 sentence direct answer with key facts]

DETAILED_SUMMARY:
[Comprehensive answer with:
- Complete information from the data
- Specific citations (e.g., "from CARE_PLAN #1: Anxiety")
- Relevant dates and details
- Clear statement if any information is unavailable]

Now provide your reasoned response:`;
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