"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const llm_factory_service_1 = __importDefault(require("./llm-factory.service"));
const extraction_prompt_builder_service_1 = __importDefault(require("./extraction-prompt-builder.service"));
/**
 * Two-Pass Generator Class
 *
 * Orchestrates two-pass generation using LLM factory (Ollama)
 */
class TwoPassGenerator {
    /**
     * Default configuration
     */
    DEFAULT_CONFIG = {
        extraction_model: 'meditron', // Not used with factory (factory chooses model)
        summarization_model: 'meditron', // Not used with factory (factory chooses model)
        extraction_temperature: 0, // Deterministic
        summarization_temperature: 0.3, // Slightly creative
        extraction_max_tokens: 2000,
        summarization_max_tokens: 500,
        enable_validation: true,
    };
    /**
     * Summarization system prompt
     */
    SUMMARIZATION_SYSTEM_PROMPT = `You are a medical summarization assistant.

Your task: Create a concise, accurate summary of extracted information.

Rules:
1. ONLY summarize the provided extractions
2. DO NOT add new information
3. Keep the short answer under 50 words
4. Keep the detailed summary under 200 words
5. Use natural, professional language
6. Cite sources by artifact ID when mentioning findings

Output Format:
First line: Short answer (under 50 words)

Remaining lines: Detailed summary with source citations`;
    /**
     * Generate answer using two-pass approach
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param config - Optional configuration override
     * @returns Complete two-pass result
     */
    async generateAnswer(candidates, query, config = {}) {
        const startTime = Date.now();
        const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
        // Pass 1: Extraction (temperature = 0)
        const { extractions, tokens: pass1Tokens } = await this.extractionPass(candidates, query, finalConfig);
        // Pass 2: Summarization (temperature = 0.3)
        const { summary, tokens: pass2Tokens } = await this.summarizationPass(extractions, query, finalConfig);
        const executionTime = Date.now() - startTime;
        return {
            extractions,
            summary,
            pass1_tokens: pass1Tokens,
            pass2_tokens: pass2Tokens,
            total_tokens: pass1Tokens + pass2Tokens,
            execution_time_ms: executionTime,
        };
    }
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
    async extractionPass(candidates, query, config) {
        // Build extraction prompt
        const fullPrompt = extraction_prompt_builder_service_1.default.buildFullPrompt(candidates, query, 'extraction');
        // Call LLM factory with temperature = 0 (uses Ollama provider)
        const result = await llm_factory_service_1.default.extract(fullPrompt.system_prompt, fullPrompt.user_prompt, config.extraction_temperature // 0 for deterministic
        );
        // Validate if enabled
        if (config.enable_validation) {
            if (!extraction_prompt_builder_service_1.default.validateExtractionResult({ extractions: result.extractions })) {
                throw new Error('Invalid extraction result format');
            }
        }
        return {
            extractions: (result.extractions || []),
            tokens: result.totalTokens || 0,
        };
    }
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
    async summarizationPass(extractions, query, config) {
        // Build summarization prompt from extractions
        const userPrompt = this.buildSummarizationPrompt(extractions, query);
        // Call LLM factory with temperature = 0.3 (uses Ollama provider)
        const result = await llm_factory_service_1.default.summarize(this.SUMMARIZATION_SYSTEM_PROMPT, userPrompt, config.summarization_temperature // 0.3 for slight creativity
        );
        // Parse response into short answer and detailed summary
        const lines = result.summary.split('\n').filter((line) => line.trim());
        const shortAnswer = lines[0] || 'No answer generated';
        const detailedSummary = result.summary;
        // Get model info from factory
        const modelInfo = await llm_factory_service_1.default.getModelInfo();
        return {
            summary: {
                short_answer: shortAnswer,
                detailed_summary: detailedSummary,
                model: `${modelInfo.provider}:${modelInfo.model}`,
                tokens_used: result.totalTokens || 0,
                extractions_count: extractions.length,
            },
            tokens: result.totalTokens || 0,
        };
    }
    /**
     * Build summarization prompt from extractions
     *
     * @param extractions - Extracted facts
     * @param query - Structured query
     * @returns Summarization user prompt
     */
    buildSummarizationPrompt(extractions, query) {
        if (extractions.length === 0) {
            return `Query: "${query.original_query}"

No relevant information was extracted from the provided chunks.

Provide a brief response indicating that no information was found.`;
        }
        const extractionsText = extractions
            .map((extraction, i) => {
            const content = JSON.stringify(extraction.content, null, 2);
            const provenance = extraction.provenance;
            return `Extraction ${i + 1}:
Type: ${extraction.type}
Content:
${content}

Source: Artifact ${provenance.artifact_id}, Chunk ${provenance.chunk_id}
Supporting Text: "${provenance.supporting_text}"
`;
        })
            .join('\n\n');
        return `Query: "${query.original_query}"

Extracted Information:
${extractionsText}

Create a concise summary that answers the query. Include:
1. A short answer (first line, under 50 words)
2. A detailed summary with source citations (under 200 words)`;
    }
    /**
     * Get default configuration
     *
     * @returns Default two-pass config
     */
    getDefaultConfig() {
        return { ...this.DEFAULT_CONFIG };
    }
    /**
     * Validate two-pass result
     *
     * @param result - Two-pass result to validate
     * @returns True if valid
     */
    validateResult(result) {
        if (!result.extractions || !Array.isArray(result.extractions)) {
            return false;
        }
        if (!result.summary || !result.summary.short_answer || !result.summary.detailed_summary) {
            return false;
        }
        if (result.total_tokens !== result.pass1_tokens + result.pass2_tokens) {
            return false;
        }
        return true;
    }
    /**
     * Generate answer with retries
     *
     * @param candidates - Retrieval candidates
     * @param query - Structured query
     * @param config - Configuration
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Two-pass result
     */
    async generateAnswerWithRetries(candidates, query, config = {}, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.generateAnswer(candidates, query, config);
            }
            catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delayMs = Math.pow(2, attempt) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
            }
        }
        throw new Error(`Two-pass generation failed after ${maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Explain why two-pass is used
     *
     * @returns Explanation of two-pass approach
     */
    explainTwoPass() {
        return `Two-Pass Generation Approach:

Pass 1: Extraction (Temperature = 0)
  - Deterministic fact extraction
  - Prevents hallucinations
  - Structured JSON output
  - Provenance tracking (char offsets + supporting text)

Pass 2: Summarization (Temperature = 0.3)
  - Natural language generation
  - ONLY from extracted facts
  - Slightly creative for readability
  - Cites sources

Why This Works:
  - Separation of concerns: facts vs. language
  - Pass 1 ensures accuracy (temp=0)
  - Pass 2 ensures readability (temp=0.3)
  - Model cannot invent claims in Pass 2 (only has extractions)

Result: Accurate, readable, grounded answers`;
    }
    /**
     * Get summarization system prompt
     *
     * @returns Summarization system prompt
     */
    getSummarizationSystemPrompt() {
        return this.SUMMARIZATION_SYSTEM_PROMPT;
    }
}
// Export singleton instance
const twoPassGenerator = new TwoPassGenerator();
exports.default = twoPassGenerator;
//# sourceMappingURL=two-pass-generator.service.js.map