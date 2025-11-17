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
export type ExtractionType = 'medication_recommendation' | 'care_plan_note' | 'general_note';
/**
 * Provenance information for extraction
 */
export interface ExtractionProvenance {
    artifact_id: string;
    chunk_id: string;
    char_offsets: [number, number];
    supporting_text: string;
    confidence?: number;
}
/**
 * Single extraction result
 */
export interface Extraction {
    type: ExtractionType;
    content: Record<string, unknown>;
    provenance: ExtractionProvenance;
}
/**
 * Full extraction result from LLM
 */
export interface ExtractionResult {
    extractions: Extraction[];
    query?: string;
    total_chunks_analyzed?: number;
}
/**
 * Extraction configuration
 */
export interface ExtractionConfig {
    temperature: number;
    max_tokens: number;
    mode: 'extraction' | 'summarization';
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
declare class ExtractionPromptBuilder {
    /**
     * System prompt for medical information extraction
     */
    private readonly SYSTEM_PROMPT;
    /**
     * Default extraction configuration
     */
    private readonly DEFAULT_EXTRACTION_CONFIG;
    /**
     * Default summarization configuration
     */
    private readonly DEFAULT_SUMMARIZATION_CONFIG;
    /**
     * Build system prompt
     *
     * @returns System prompt for extraction
     */
    buildSystemPrompt(): string;
    /**
     * Format candidates for user prompt
     *
     * @param candidates - Retrieval candidates
     * @returns Formatted candidate text
     */
    formatCandidates(candidates: RetrievalCandidate[]): string;
    /**
     * Build extraction prompt
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @returns User prompt for extraction
     */
    buildExtractionPrompt(candidates: RetrievalCandidate[], query: StructuredQuery): string;
    /**
     * Build full prompt (system + user)
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param mode - Extraction mode (default: 'extraction')
     * @returns Complete formatted prompt
     */
    buildFullPrompt(candidates: RetrievalCandidate[], query: StructuredQuery, mode?: 'extraction' | 'summarization'): FormattedPrompt;
    /**
     * Get extraction configuration
     *
     * @param mode - Extraction mode
     * @returns Configuration
     */
    getConfig(mode?: 'extraction' | 'summarization'): ExtractionConfig;
    /**
     * Build summarization prompt
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @returns Summarization prompt
     */
    buildSummarizationPrompt(candidates: RetrievalCandidate[], query: StructuredQuery): string;
    /**
     * Format single candidate with highlighting
     *
     * @param candidate - Candidate to format
     * @param index - Candidate index
     * @param highlightTerms - Terms to highlight (optional)
     * @returns Formatted candidate text
     */
    formatSingleCandidate(candidate: RetrievalCandidate, index: number, highlightTerms?: string[]): string;
    /**
     * Build extraction prompt with metadata
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param includeScores - Include relevance scores (default: false)
     * @returns Extraction prompt with metadata
     */
    buildEnhancedPrompt(candidates: RetrievalCandidate[], query: StructuredQuery, includeScores?: boolean): string;
    /**
     * Estimate token count (rough approximation)
     *
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @returns Estimated token count
     */
    private estimateTokens;
    /**
     * Validate extraction result
     *
     * @param result - Extraction result to validate
     * @returns True if valid
     */
    validateExtractionResult(result: unknown): result is ExtractionResult;
    /**
     * Build few-shot examples prompt
     *
     * @returns Few-shot examples for extraction
     */
    buildFewShotExamples(): string;
    /**
     * Build prompt with few-shot examples
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @returns Prompt with examples
     */
    buildPromptWithExamples(candidates: RetrievalCandidate[], query: StructuredQuery): string;
    /**
     * Get default extraction config
     *
     * @returns Extraction config
     */
    getExtractionConfig(): ExtractionConfig;
    /**
     * Get default summarization config
     *
     * @returns Summarization config
     */
    getSummarizationConfig(): ExtractionConfig;
    /**
     * Truncate candidates to fit token limit
     *
     * @param candidates - Candidates to truncate
     * @param maxTokens - Maximum tokens (default: 4000)
     * @returns Truncated candidates
     */
    truncateCandidates(candidates: RetrievalCandidate[], maxTokens?: number): RetrievalCandidate[];
}
declare const extractionPromptBuilder: ExtractionPromptBuilder;
export default extractionPromptBuilder;
//# sourceMappingURL=extraction-prompt-builder.service.d.ts.map