/**
 * Extraction Prompt Builder Service
 *
 * Builds LLM prompts for structured data extraction from medical records.
 *
 * Features:
 * - Medical information extraction system prompt
 * - Candidate formatting for context
 * - Extraction prompt generation
 * - Temperature and token configuration
 * - Provenance tracking
 *
 */

import { RetrievalCandidate } from './retriever-agent.service';
import { StructuredQuery } from './query-understanding-agent.service';

/**
 * Extraction type
 */
export type ExtractionType = 'medication' | 'condition' | 'procedure' | 'measurement' | 'date' | 'patient_info' | 'demographic';

/**
 * Provenance information for extraction
 */
export interface ExtractionProvenance {
  artifact_id: string; // Source artifact
  chunk_id: string; // Source chunk
  char_offsets: [number, number]; // Character offsets in chunk
  supporting_text: string; // Exact quote from source
  confidence?: number; // Optional confidence score
}

/**
 * Single extraction result
 */
export interface Extraction {
  type: ExtractionType;
  content: Record<string, unknown>; // Extracted fields (flexible structure)
  provenance: ExtractionProvenance;
}

/**
 * Full extraction result from LLM
 */
export interface ExtractionResult {
  extractions: Extraction[];
  query?: string; // Original query
  total_chunks_analyzed?: number; // Number of chunks analyzed
}

/**
 * Extraction configuration
 */
export interface ExtractionConfig {
  temperature: number; // 0 for deterministic extraction
  max_tokens: number; // Maximum response tokens
  mode: 'extraction' | 'summarization'; // Extraction mode
}

/**
 * Formatted prompt result
 */
export interface FormattedPrompt {
  system_prompt: string;
  user_prompt: string;
  config: ExtractionConfig;
  total_chunks: number;
  estimated_tokens: number;
}

/**
 * Extraction Prompt Builder Class
 *
 * Builds prompts for LLM-based structured extraction
 */
class ExtractionPromptBuilder {
  /**
   * System prompt for medical information extraction
   */
  private readonly SYSTEM_PROMPT = `You are a medical information extraction assistant.

Your task: Extract structured information from medical records to answer a specific query.

Rules:
1. ONLY extract information explicitly stated in the provided chunks
2. DO NOT infer, assume, or add information not present
3. If information is not found, return an empty array
4. Include char_offsets for every extraction (where it was found in the text)
5. Be precise with dates, medications, dosages, and medical terms
6. Return valid JSON only

Output Format:
{
  "extractions": [
    {
      "type": "medication" | "condition" | "procedure" | "measurement" | "date" | "patient_info" | "demographic",
      "content": { ... extracted fields ... },
      "provenance": {
        "artifact_id": "...",
        "chunk_id": "...",
        "char_offsets": [start, end],
        "supporting_text": "exact quote from source",
        "confidence": 0.0-1.0
      }
    }
  ]
}

CRITICAL RULES:
- Each extraction MUST include provenance as a SINGLE OBJECT (NOT an array)
- If the same information appears in multiple chunks, create separate extractions
- Supporting text MUST be a direct quote from the source chunk
- ALWAYS include the WHY/indication/reason when extracting information IF it's explicitly stated in the source
- For medications: CRITICAL - Understand the difference between ROUTE and INDICATION:
  * ROUTE: How the medication is administered (e.g., "oral", "IV", "topical", "oral - tablet", "oral - capsule")
  * INDICATION: The medical reason/condition being treated (e.g., "Type 2 Diabetes", "hypertension", "depression")
  * DO NOT put route information in the indication field!
  * If the source says "oral tablet" or "oral capsule", that is the ROUTE, not the indication
  * Set indication to null if the medical reason is not explicitly stated in the source
  * Only populate indication if you find phrases like "for [condition]", "to treat [condition]", "prescribed for [reason]"
- For medications: Extract name, dosage, frequency, route (how taken), indication (why prescribed - may be null)
- Focus on answering the SPECIFIC question asked, not general information
- Confidence score (0.0-1.0): How certain you are this information is accurate based on source clarity
  - 0.9-1.0: Explicit, clear statement with indication (e.g., "prescribed Metformin 500mg for diabetes")
  - 0.7-0.9: Clear information with context (e.g., medication with dosage and frequency)
  - 0.5-0.7: Moderate confidence, some missing context
  - Below 0.5: Low confidence, unclear or partial information
- Use "medication" for medication-related extractions (include: name, dosage, frequency, route, indication)
- Use "condition" for diagnoses, symptoms, health conditions (include severity if mentioned)
- Use "procedure" for treatments, surgeries, medical procedures (include indication/reason)
- Use "measurement" for vital signs, lab results (include normal ranges if mentioned)
- Use "date" for important medical dates (diagnosis date, procedure date, etc.)
- Return empty array if no relevant information found
- NEVER return provenance as an array - it must always be a single object`;

  /**
   * Default extraction configuration
   */
  private readonly DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
    temperature: 0, // Deterministic
    max_tokens: 2000,
    mode: 'extraction',
  };

  /**
   * Default summarization configuration
   */
  private readonly DEFAULT_SUMMARIZATION_CONFIG: ExtractionConfig = {
    temperature: 0.3, // Slightly creative
    max_tokens: 2000,
    mode: 'summarization',
  };

  /**
   * Build system prompt
   *
   * @returns System prompt for extraction
   */
  buildSystemPrompt(): string {
    return this.SYSTEM_PROMPT;
  }

  /**
   * Format candidates for user prompt
   *
   * @param candidates - Retrieval candidates
   * @returns Formatted candidate text
   */
  formatCandidates(candidates: RetrievalCandidate[]): string {
    return candidates
      .map(
        (c, i) =>
          `[Chunk ${i + 1}]
Artifact ID: ${c.chunk.artifact_id}
Chunk ID: ${c.chunk.chunk_id}
Date: ${c.metadata.date || 'Unknown'}
Type: ${c.metadata.artifact_type || 'Unknown'}
Text: ${c.chunk.content}
`
      )
      .join('\n\n');
  }

  /**
   * Build extraction prompt
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @returns User prompt for extraction
   */
  buildExtractionPrompt(candidates: RetrievalCandidate[], query: StructuredQuery): string {
    return `Query: "${query.original_query}"

Retrieved Chunks:
${this.formatCandidates(candidates)}

Extract all relevant information to answer the query. Include precise provenance for each extraction.`;
  }

  /**
   * Build full prompt (system + user)
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @param mode - Extraction mode (default: 'extraction')
   * @returns Complete formatted prompt
   */
  buildFullPrompt(
    candidates: RetrievalCandidate[],
    query: StructuredQuery,
    mode: 'extraction' | 'summarization' = 'extraction'
  ): FormattedPrompt {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildExtractionPrompt(candidates, query);

    const config = mode === 'extraction' ? this.DEFAULT_EXTRACTION_CONFIG : this.DEFAULT_SUMMARIZATION_CONFIG;

    return {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      config,
      total_chunks: candidates.length,
      estimated_tokens: this.estimateTokens(systemPrompt, userPrompt),
    };
  }

  /**
   * Get extraction configuration
   *
   * @param mode - Extraction mode
   * @returns Configuration
   */
  getConfig(mode: 'extraction' | 'summarization' = 'extraction'): ExtractionConfig {
    return mode === 'extraction' ? { ...this.DEFAULT_EXTRACTION_CONFIG } : { ...this.DEFAULT_SUMMARIZATION_CONFIG };
  }

  /**
   * Build summarization prompt
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @returns Summarization prompt
   */
  buildSummarizationPrompt(
    candidates: RetrievalCandidate[],
    query: StructuredQuery,
    conversationHistory?: Array<{ role: string; content: string }>
  ): string {
    let prompt = '';

    // PRIORITY 3: Add conversation context if available
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `## Previous Conversation\n\n`;
      conversationHistory.forEach((msg, idx) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${msg.content}\n\n`;
      });
      prompt += `---\n\n`;
    }

    prompt += `Query: "${query.original_query}"

Retrieved Information:
${this.formatCandidates(candidates)}

Provide a concise summary that answers the query. Include key facts, dates, and relevant details.`;

    // Add follow-up question instructions if conversation exists
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `\n\nNote: This is a follow-up question. Consider the previous conversation context when formulating your response.`;
    }

    return prompt;
  }

  /**
   * Format single candidate with highlighting
   *
   * @param candidate - Candidate to format
   * @param index - Candidate index
   * @param highlightTerms - Terms to highlight (optional)
   * @returns Formatted candidate text
   */
  formatSingleCandidate(candidate: RetrievalCandidate, index: number, highlightTerms?: string[]): string {
    let content = candidate.chunk.content;

    // Simple highlighting (for display purposes)
    if (highlightTerms && highlightTerms.length > 0) {
      for (const term of highlightTerms) {
        const regex = new RegExp(`(${term})`, 'gi');
        content = content.replace(regex, '**$1**');
      }
    }

    return `[Chunk ${index + 1}]
Artifact ID: ${candidate.chunk.artifact_id}
Chunk ID: ${candidate.chunk.chunk_id}
Date: ${candidate.metadata.date || 'Unknown'}
Type: ${candidate.metadata.artifact_type || 'Unknown'}
Score: ${candidate.score.toFixed(4)}
Text: ${content}
`;
  }

  /**
   * Build extraction prompt with metadata
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @param includeScores - Include relevance scores (default: false)
   * @returns Extraction prompt with metadata
   */
  buildEnhancedPrompt(
    candidates: RetrievalCandidate[],
    query: StructuredQuery,
    includeScores: boolean = false
  ): string {
    const formattedCandidates = candidates
      .map((c, i) => {
        const baseFormat = `[Chunk ${i + 1}]
Artifact ID: ${c.chunk.artifact_id}
Chunk ID: ${c.chunk.chunk_id}
Date: ${c.metadata.date || 'Unknown'}
Type: ${c.metadata.artifact_type || 'Unknown'}`;

        const scoreInfo = includeScores ? `\nRelevance Score: ${c.score.toFixed(4)}` : '';

        return `${baseFormat}${scoreInfo}
Text: ${c.chunk.content}
`;
      })
      .join('\n\n');

    return `Query: "${query.original_query}"

Retrieved Chunks (${candidates.length} total):
${formattedCandidates}

Extract all relevant information to answer the query. Include precise provenance for each extraction.`;
  }

  /**
   * Estimate token count (rough approximation)
   *
   * @param systemPrompt - System prompt
   * @param userPrompt - User prompt
   * @returns Estimated token count
   */
  private estimateTokens(systemPrompt: string, userPrompt: string): number {
    // Rough estimate: ~4 characters per token
    const totalChars = systemPrompt.length + userPrompt.length;
    return Math.ceil(totalChars / 4);
  }

  /**
   * Validate extraction result
   *
   * @param result - Extraction result to validate
   * @returns True if valid
   */
  validateExtractionResult(result: unknown): result is ExtractionResult {
    if (typeof result !== 'object' || result === null) {
      return false;
    }

    const r = result as ExtractionResult;

    if (!Array.isArray(r.extractions)) {
      return false;
    }

    // Validate each extraction
    for (const extraction of r.extractions) {
      if (!extraction.type || !extraction.content || !extraction.provenance) {
        return false;
      }

      const provenance = extraction.provenance;
      if (
        !provenance.artifact_id ||
        !provenance.chunk_id ||
        !Array.isArray(provenance.char_offsets) ||
        provenance.char_offsets.length !== 2 ||
        !provenance.supporting_text
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Build few-shot examples prompt
   *
   * @returns Few-shot examples for extraction
   */
  buildFewShotExamples(): string {
    return `Example 1 (medication - WITH indication - medical reason stated):
Query: "What medications is the patient taking?"
Chunk: "Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management. Monitor blood glucose levels."
Extraction:
{
  "type": "medication",
  "content": {
    "name": "Metformin",
    "dosage": "500mg",
    "frequency": "twice daily",
    "route": "oral",
    "indication": "Type 2 Diabetes management",
    "status": "prescribed"
  },
  "provenance": {
    "artifact_id": "note_123",
    "chunk_id": "chunk_456",
    "char_offsets": [18, 82],
    "supporting_text": "prescribed Metformin 500mg twice daily for Type 2 Diabetes management",
    "confidence": 0.96
  }
}

Example 1b (medication - WITHOUT indication - only route information):
Query: "What medications is the patient taking?"
Chunk: "Medication: Sertraline (oral - capsule)"
Extraction:
{
  "type": "medication",
  "content": {
    "name": "Sertraline",
    "dosage": null,
    "frequency": null,
    "route": "oral - capsule",
    "indication": null,
    "status": null
  },
  "provenance": {
    "artifact_id": "med_789",
    "chunk_id": "chunk_101",
    "char_offsets": [12, 40],
    "supporting_text": "Sertraline (oral - capsule)",
    "confidence": 0.85
  }
}

Example 2 (condition):
Query: "What are the patient's diagnoses?"
Chunk: "Patient diagnosed with Type 2 Diabetes Mellitus in March 2024."
Extraction:
{
  "type": "condition",
  "content": {
    "diagnosis": "Type 2 Diabetes Mellitus",
    "onset_date": "March 2024"
  },
  "provenance": {
    "artifact_id": "note_123",
    "chunk_id": "chunk_789",
    "char_offsets": [19, 62],
    "supporting_text": "diagnosed with Type 2 Diabetes Mellitus in March 2024",
    "confidence": 0.98
  }
}

Example 3 (measurement):
Query: "What are the patient's recent vital signs?"
Chunk: "Blood pressure: 140/90 mmHg, Heart rate: 78 bpm."
Extraction:
{
  "type": "measurement",
  "content": {
    "type": "blood_pressure",
    "value": "140/90 mmHg"
  },
  "provenance": {
    "artifact_id": "note_456",
    "chunk_id": "chunk_101",
    "char_offsets": [0, 28],
    "supporting_text": "Blood pressure: 140/90 mmHg",
    "confidence": 0.92
  }
}

Example 4 (patient_info):
Query: "What is the patient's name?"
Chunk: "Patient Name: John Smith, DOB: 1/15/1980, MRN: 12345"
Extraction:
{
  "type": "patient_info",
  "content": {
    "name": "John Smith",
    "field": "name"
  },
  "provenance": {
    "artifact_id": "demo_123",
    "chunk_id": "chunk_202",
    "char_offsets": [14, 24],
    "supporting_text": "Patient Name: John Smith",
    "confidence": 0.98
  }
}`;
  }

  /**
   * Build prompt with few-shot examples
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @returns Prompt with examples
   */
  buildPromptWithExamples(candidates: RetrievalCandidate[], query: StructuredQuery): string {
    const examples = this.buildFewShotExamples();

    return `Query: "${query.original_query}"

Few-Shot Examples:
${examples}

Retrieved Chunks:
${this.formatCandidates(candidates)}

Extract all relevant information following the examples above. Include precise provenance for each extraction.`;
  }

  /**
   * Get default extraction config
   *
   * @returns Extraction config
   */
  getExtractionConfig(): ExtractionConfig {
    return { ...this.DEFAULT_EXTRACTION_CONFIG };
  }

  /**
   * Get default summarization config
   *
   * @returns Summarization config
   */
  getSummarizationConfig(): ExtractionConfig {
    return { ...this.DEFAULT_SUMMARIZATION_CONFIG };
  }

  /**
   * Truncate candidates to fit token limit
   *
   * @param candidates - Candidates to truncate
   * @param maxTokens - Maximum tokens (default: 4000)
   * @returns Truncated candidates
   */
  truncateCandidates(candidates: RetrievalCandidate[], maxTokens: number = 4000): RetrievalCandidate[] {
    const systemPromptTokens = Math.ceil(this.SYSTEM_PROMPT.length / 4);
    const availableTokens = maxTokens - systemPromptTokens - 500; // Reserve 500 for query and formatting

    let totalTokens = 0;
    const truncated: RetrievalCandidate[] = [];

    for (const candidate of candidates) {
      const candidateTokens = Math.ceil(candidate.chunk.content.length / 4);

      if (totalTokens + candidateTokens > availableTokens) {
        break;
      }

      truncated.push(candidate);
      totalTokens += candidateTokens;
    }

    return truncated;
  }
}

// Export singleton instance
const extractionPromptBuilder = new ExtractionPromptBuilder();
export default extractionPromptBuilder;
