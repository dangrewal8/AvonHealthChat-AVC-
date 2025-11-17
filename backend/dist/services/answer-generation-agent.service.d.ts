/**
 * Answer Generation Agent
 *
 * Orchestrates extraction and summarization to generate complete answers.
 *
 * Features:
 * - Two-pass generation (extraction + summarization)
 * - Provenance validation
 * - Char offset verification
 * - Artifact existence checking
 * - Performance tracking
 * - Error handling
 *
 */
import { RetrievalCandidate } from './retriever-agent.service';
import { StructuredQuery } from './query-understanding-agent.service';
import { Extraction } from './extraction-prompt-builder.service';
/**
 * Generated answer with extractions and summaries
 */
export interface GeneratedAnswer {
    short_answer: string;
    detailed_summary: string;
    structured_extractions: Extraction[];
    model: string;
    total_tokens: number;
    generation_time_ms: number;
}
/**
 * Validation result for extractions
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Answer Generation Agent Error
 */
export declare class AnswerGenerationError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
/**
 * Answer Generation Agent Class
 *
 * Orchestrates two-pass generation with validation
 */
declare class AnswerGenerationAgent {
    /**
     * Generate answer from candidates and query
     *
     * @param candidates - Retrieved candidates
     * @param query - Structured query
     * @returns Generated answer with validated extractions
     */
    generate(candidates: RetrievalCandidate[], query: StructuredQuery): Promise<GeneratedAnswer>;
    /**
     * Validate extractions
     *
     * Checks:
     * - Provenance exists
     * - Char offsets are valid
     * - Supporting text matches source
     * - Artifact IDs exist in candidates
     *
     * @param extractions - Extractions to validate
     * @param candidates - Retrieved candidates
     * @returns Validation result
     */
    validateExtractions(extractions: Extraction[], candidates: RetrievalCandidate[]): ValidationResult;
    /**
     * Validate provenance for a single extraction
     *
     * @param extraction - Extraction to validate
     * @param candidates - Retrieved candidates
     * @returns True if provenance is valid
     */
    validateProvenance(extraction: Extraction, candidates: RetrievalCandidate[]): boolean;
    /**
     * Check if char offsets are valid for a chunk
     *
     * @param chunk_id - Chunk ID
     * @param char_offsets - Character offsets [start, end]
     * @param candidates - Retrieved candidates
     * @returns True if offsets are valid
     */
    checkCharOffsets(chunk_id: string, char_offsets: [number, number], candidates: RetrievalCandidate[]): boolean;
    /**
     * Verify artifact exists in candidates
     *
     * @param artifact_id - Artifact ID
     * @param candidates - Retrieved candidates
     * @returns True if artifact exists
     */
    verifyArtifactExists(artifact_id: string, candidates: RetrievalCandidate[]): boolean;
    /**
     * Get extraction statistics
     *
     * @param extractions - Extractions to analyze
     * @returns Statistics object
     */
    getExtractionStats(extractions: Extraction[]): {
        total: number;
        by_type: Record<string, number>;
        with_provenance: number;
        avg_supporting_text_length: number;
    };
    /**
     * Format answer for display
     *
     * @param answer - Generated answer
     * @returns Formatted string
     */
    formatAnswer(answer: GeneratedAnswer): string;
    /**
     * Explain answer generation process
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const answerGenerationAgent: AnswerGenerationAgent;
export default answerGenerationAgent;
//# sourceMappingURL=answer-generation-agent.service.d.ts.map