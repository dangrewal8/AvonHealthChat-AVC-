"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Extraction Prompt Builder Class
 *
 * Builds prompts for LLM-based structured extraction
 */
class ExtractionPromptBuilder {
    /**
     * System prompt for medical information extraction
     */
    SYSTEM_PROMPT = `You are a medical information extraction assistant.

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
      "type": "medication_recommendation" | "care_plan_note" | "general_note",
      "content": { ... extracted fields ... },
      "provenance": {
        "artifact_id": "...",
        "chunk_id": "...",
        "char_offsets": [start, end],
        "supporting_text": "exact quote from source"
      }
    }
  ]
}

Important:
- Each extraction MUST include provenance with exact char_offsets
- Supporting text MUST be a direct quote from the source chunk
- Use "medication_recommendation" for medication-related extractions
- Use "care_plan_note" for treatment plans, care instructions
- Use "general_note" for other clinical information
- Return empty array if no relevant information found`;
    /**
     * Default extraction configuration
     */
    DEFAULT_EXTRACTION_CONFIG = {
        temperature: 0, // Deterministic
        max_tokens: 2000,
        mode: 'extraction',
    };
    /**
     * Default summarization configuration
     */
    DEFAULT_SUMMARIZATION_CONFIG = {
        temperature: 0.3, // Slightly creative
        max_tokens: 2000,
        mode: 'summarization',
    };
    /**
     * Build system prompt
     *
     * @returns System prompt for extraction
     */
    buildSystemPrompt() {
        return this.SYSTEM_PROMPT;
    }
    /**
     * Format candidates for user prompt
     *
     * @param candidates - Retrieval candidates
     * @returns Formatted candidate text
     */
    formatCandidates(candidates) {
        return candidates
            .map((c, i) => `[Chunk ${i + 1}]
Artifact ID: ${c.chunk.artifact_id}
Chunk ID: ${c.chunk.chunk_id}
Date: ${c.metadata.date || 'Unknown'}
Type: ${c.metadata.artifact_type || 'Unknown'}
Text: ${c.chunk.content}
`)
            .join('\n\n');
    }
    /**
     * Build extraction prompt
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @returns User prompt for extraction
     */
    buildExtractionPrompt(candidates, query) {
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
    buildFullPrompt(candidates, query, mode = 'extraction') {
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
    getConfig(mode = 'extraction') {
        return mode === 'extraction' ? { ...this.DEFAULT_EXTRACTION_CONFIG } : { ...this.DEFAULT_SUMMARIZATION_CONFIG };
    }
    /**
     * Build summarization prompt
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @returns Summarization prompt
     */
    buildSummarizationPrompt(candidates, query) {
        return `Query: "${query.original_query}"

Retrieved Information:
${this.formatCandidates(candidates)}

Provide a concise summary that answers the query. Include key facts, dates, and relevant details.`;
    }
    /**
     * Format single candidate with highlighting
     *
     * @param candidate - Candidate to format
     * @param index - Candidate index
     * @param highlightTerms - Terms to highlight (optional)
     * @returns Formatted candidate text
     */
    formatSingleCandidate(candidate, index, highlightTerms) {
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
    buildEnhancedPrompt(candidates, query, includeScores = false) {
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
    estimateTokens(systemPrompt, userPrompt) {
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
    validateExtractionResult(result) {
        if (typeof result !== 'object' || result === null) {
            return false;
        }
        const r = result;
        if (!Array.isArray(r.extractions)) {
            return false;
        }
        // Validate each extraction
        for (const extraction of r.extractions) {
            if (!extraction.type || !extraction.content || !extraction.provenance) {
                return false;
            }
            const provenance = extraction.provenance;
            if (!provenance.artifact_id ||
                !provenance.chunk_id ||
                !Array.isArray(provenance.char_offsets) ||
                provenance.char_offsets.length !== 2 ||
                !provenance.supporting_text) {
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
    buildFewShotExamples() {
        return `Example 1:
Query: "What medications is the patient taking?"
Chunk: "Patient prescribed Metformin 500mg twice daily for diabetes management."
Extraction:
{
  "type": "medication_recommendation",
  "content": {
    "medication": "Metformin",
    "dosage": "500mg",
    "frequency": "twice daily",
    "indication": "diabetes management"
  },
  "provenance": {
    "artifact_id": "note_123",
    "chunk_id": "chunk_456",
    "char_offsets": [18, 71],
    "supporting_text": "prescribed Metformin 500mg twice daily for diabetes management"
  }
}

Example 2:
Query: "What is the care plan?"
Chunk: "Follow up in 2 weeks for blood pressure check. Continue current medications."
Extraction:
{
  "type": "care_plan_note",
  "content": {
    "follow_up": "2 weeks",
    "purpose": "blood pressure check",
    "instructions": "Continue current medications"
  },
  "provenance": {
    "artifact_id": "note_123",
    "chunk_id": "chunk_789",
    "char_offsets": [0, 76],
    "supporting_text": "Follow up in 2 weeks for blood pressure check. Continue current medications."
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
    buildPromptWithExamples(candidates, query) {
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
    getExtractionConfig() {
        return { ...this.DEFAULT_EXTRACTION_CONFIG };
    }
    /**
     * Get default summarization config
     *
     * @returns Summarization config
     */
    getSummarizationConfig() {
        return { ...this.DEFAULT_SUMMARIZATION_CONFIG };
    }
    /**
     * Truncate candidates to fit token limit
     *
     * @param candidates - Candidates to truncate
     * @param maxTokens - Maximum tokens (default: 4000)
     * @returns Truncated candidates
     */
    truncateCandidates(candidates, maxTokens = 4000) {
        const systemPromptTokens = Math.ceil(this.SYSTEM_PROMPT.length / 4);
        const availableTokens = maxTokens - systemPromptTokens - 500; // Reserve 500 for query and formatting
        let totalTokens = 0;
        const truncated = [];
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
exports.default = extractionPromptBuilder;
//# sourceMappingURL=extraction-prompt-builder.service.js.map