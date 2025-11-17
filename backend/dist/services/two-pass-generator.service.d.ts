/**
 * Two-Pass Generator Service
 *
 * Implements two-pass generation to prevent hallucinations per ChatGPT specification:
 * - Pass 1: Extraction (temperature = 0) - Deterministic fact extraction
 * - Pass 2: Summarization (temperature = 0.3) - Natural language generation
 *
 * Why Two-Pass:
 * - Pass 1 ensures factual extraction with no hallucinations
 * - Pass 2 creates readable summary from extracted facts only
 * - Separation prevents model from inventing unsupported claims
 *
 */
import { RetrievalCandidate } from './retriever-agent.service';
import { StructuredQuery } from './query-understanding-agent.service';
import { Extraction } from './extraction-prompt-builder.service';
/**
 * Generated answer from summarization pass
 */
export interface GeneratedAnswer {
    short_answer: string;
    detailed_summary: string;
    model: string;
    tokens_used: number;
    extractions_count: number;
}
/**
 * Complete two-pass result
 */
export interface TwoPassResult {
    extractions: Extraction[];
    summary: GeneratedAnswer;
    pass1_tokens: number;
    pass2_tokens: number;
    total_tokens: number;
    execution_time_ms: number;
}
/**
 * Two-pass generation configuration
 */
export interface TwoPassConfig {
    extraction_model: string;
    summarization_model: string;
    extraction_temperature: number;
    summarization_temperature: number;
    extraction_max_tokens: number;
    summarization_max_tokens: number;
    enable_validation: boolean;
}
/**
 * Two-Pass Generator Class
 *
 * Orchestrates two-pass generation using LLM factory (Ollama)
 */
declare class TwoPassGenerator {
    /**
     * Default configuration
     */
    private readonly DEFAULT_CONFIG;
    /**
     * Summarization system prompt
     */
    private readonly SUMMARIZATION_SYSTEM_PROMPT;
    /**
     * Generate answer using two-pass approach
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param config - Optional configuration override
     * @returns Complete two-pass result
     */
    generateAnswer(candidates: RetrievalCandidate[], query: StructuredQuery, config?: Partial<TwoPassConfig>): Promise<TwoPassResult>;
    /**
     * Pass 1: Extraction (temperature = 0)
     *
     * Extracts structured facts deterministically
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param config - Configuration
     * @returns Structured extractions and token count
     */
    extractionPass(candidates: RetrievalCandidate[], query: StructuredQuery, config: TwoPassConfig): Promise<{
        extractions: Extraction[];
        tokens: number;
    }>;
    /**
     * Pass 2: Summarization (temperature = 0.3)
     *
     * Creates natural language summary from extractions
     *
     * @param extractions - Extracted facts from pass 1
     * @param query - Structured query
     * @param config - Configuration
     * @returns Generated answer and token count
     */
    summarizationPass(extractions: Extraction[], query: StructuredQuery, config: TwoPassConfig): Promise<{
        summary: GeneratedAnswer;
        tokens: number;
    }>;
    /**
     * Build summarization prompt from extractions
     *
     * @param extractions - Extracted facts
     * @param query - Structured query
     * @returns Summarization user prompt
     */
    private buildSummarizationPrompt;
    /**
     * Get default configuration
     *
     * @returns Default two-pass config
     */
    getDefaultConfig(): TwoPassConfig;
    /**
     * Validate two-pass result
     *
     * @param result - Two-pass result to validate
     * @returns True if valid
     */
    validateResult(result: TwoPassResult): boolean;
    /**
     * Generate answer with retries
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param config - Configuration
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Two-pass result
     */
    generateAnswerWithRetries(candidates: RetrievalCandidate[], query: StructuredQuery, config?: Partial<TwoPassConfig>, maxRetries?: number): Promise<TwoPassResult>;
    /**
     * Explain why two-pass is used
     *
     * @returns Explanation of two-pass approach
     */
    explainTwoPass(): string;
    /**
     * Get summarization system prompt
     *
     * @returns Summarization system prompt
     */
    getSummarizationSystemPrompt(): string;
}
declare const twoPassGenerator: TwoPassGenerator;
export default twoPassGenerator;
//# sourceMappingURL=two-pass-generator.service.d.ts.map