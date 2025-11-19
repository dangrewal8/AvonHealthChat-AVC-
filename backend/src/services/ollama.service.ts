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
