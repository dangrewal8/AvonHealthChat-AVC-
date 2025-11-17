"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerGenerationError = void 0;
const two_pass_generator_service_1 = __importDefault(require("./two-pass-generator.service"));
/**
 * Answer Generation Agent Error
 */
class AnswerGenerationError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AnswerGenerationError';
    }
}
exports.AnswerGenerationError = AnswerGenerationError;
/**
 * Answer Generation Agent Class
 *
 * Orchestrates two-pass generation with validation
 */
class AnswerGenerationAgent {
    /**
     * Generate answer from candidates and query
     *
     * @param candidates - Retrieved candidates
     * @param query - Structured query
     * @returns Generated answer with validated extractions
     */
    async generate(candidates, query) {
        const startTime = Date.now();
        try {
            // Validation: Check inputs
            if (!candidates || candidates.length === 0) {
                throw new AnswerGenerationError('No candidates provided for answer generation', 'NO_CANDIDATES');
            }
            if (!query || !query.original_query) {
                throw new AnswerGenerationError('Invalid query provided', 'INVALID_QUERY');
            }
            // Step 1: Run two-pass generation
            const twoPassResult = await two_pass_generator_service_1.default.generateAnswer(candidates, query);
            // Step 2: Validate extractions
            const validationResult = this.validateExtractions(twoPassResult.extractions, candidates);
            if (!validationResult.valid) {
                throw new AnswerGenerationError('Extraction validation failed', 'VALIDATION_FAILED', { errors: validationResult.errors });
            }
            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                console.warn('Answer generation warnings:', validationResult.warnings);
            }
            // Step 3: Build complete answer
            const generationTime = Date.now() - startTime;
            return {
                short_answer: twoPassResult.summary.short_answer,
                detailed_summary: twoPassResult.summary.detailed_summary,
                structured_extractions: twoPassResult.extractions,
                model: twoPassResult.summary.model,
                total_tokens: twoPassResult.total_tokens,
                generation_time_ms: generationTime,
            };
        }
        catch (error) {
            if (error instanceof AnswerGenerationError) {
                throw error;
            }
            throw new AnswerGenerationError(`Answer generation failed: ${error.message}`, 'GENERATION_FAILED', { originalError: error });
        }
    }
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
    validateExtractions(extractions, candidates) {
        const errors = [];
        const warnings = [];
        // Check if extractions exist
        if (!extractions || extractions.length === 0) {
            warnings.push('No extractions found');
            return { valid: true, errors, warnings };
        }
        // Build candidate lookup map
        const candidateMap = new Map();
        candidates.forEach(candidate => {
            candidateMap.set(candidate.chunk.chunk_id, candidate);
        });
        // Validate each extraction
        extractions.forEach((extraction, index) => {
            // 1. Check provenance exists
            if (!extraction.provenance) {
                errors.push(`Extraction ${index}: Missing provenance`);
                return;
            }
            const { artifact_id, chunk_id, char_offsets, supporting_text } = extraction.provenance;
            // 2. Check required provenance fields
            if (!artifact_id) {
                errors.push(`Extraction ${index}: Missing artifact_id`);
            }
            if (!chunk_id) {
                errors.push(`Extraction ${index}: Missing chunk_id`);
            }
            if (!char_offsets || char_offsets.length !== 2) {
                errors.push(`Extraction ${index}: Invalid char_offsets`);
                return;
            }
            if (!supporting_text) {
                errors.push(`Extraction ${index}: Missing supporting_text`);
            }
            // 3. Check char_offsets are valid
            const [start, end] = char_offsets;
            if (start < 0 || end < start) {
                errors.push(`Extraction ${index}: Invalid char_offsets [${start}, ${end}]`);
            }
            // 4. Check artifact exists in candidates
            const candidate = candidateMap.get(chunk_id);
            if (!candidate) {
                errors.push(`Extraction ${index}: Chunk ${chunk_id} not found in candidates`);
                return;
            }
            // 5. Verify supporting_text matches chunk content at offsets
            const chunkContent = candidate.chunk.content;
            if (end > chunkContent.length) {
                errors.push(`Extraction ${index}: char_offsets [${start}, ${end}] exceed chunk length ${chunkContent.length}`);
                return;
            }
            const extractedText = chunkContent.substring(start, end);
            if (extractedText !== supporting_text) {
                warnings.push(`Extraction ${index}: Supporting text mismatch (expected "${extractedText}", got "${supporting_text}")`);
            }
            // 6. Verify artifact_id matches
            if (candidate.chunk.artifact_id !== artifact_id) {
                errors.push(`Extraction ${index}: artifact_id mismatch (chunk has ${candidate.chunk.artifact_id}, extraction has ${artifact_id})`);
            }
        });
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate provenance for a single extraction
     *
     * @param extraction - Extraction to validate
     * @param candidates - Retrieved candidates
     * @returns True if provenance is valid
     */
    validateProvenance(extraction, candidates) {
        if (!extraction.provenance) {
            return false;
        }
        const { chunk_id, char_offsets } = extraction.provenance;
        if (!chunk_id || !char_offsets) {
            return false;
        }
        // Find candidate
        const candidate = candidates.find(c => c.chunk.chunk_id === chunk_id);
        if (!candidate) {
            return false;
        }
        // Validate char_offsets
        const [start, end] = char_offsets;
        if (start < 0 || end < start || end > candidate.chunk.content.length) {
            return false;
        }
        return true;
    }
    /**
     * Check if char offsets are valid for a chunk
     *
     * @param chunk_id - Chunk ID
     * @param char_offsets - Character offsets [start, end]
     * @param candidates - Retrieved candidates
     * @returns True if offsets are valid
     */
    checkCharOffsets(chunk_id, char_offsets, candidates) {
        const candidate = candidates.find(c => c.chunk.chunk_id === chunk_id);
        if (!candidate) {
            return false;
        }
        const [start, end] = char_offsets;
        const chunkLength = candidate.chunk.content.length;
        return start >= 0 && end > start && end <= chunkLength;
    }
    /**
     * Verify artifact exists in candidates
     *
     * @param artifact_id - Artifact ID
     * @param candidates - Retrieved candidates
     * @returns True if artifact exists
     */
    verifyArtifactExists(artifact_id, candidates) {
        return candidates.some(c => c.chunk.artifact_id === artifact_id);
    }
    /**
     * Get extraction statistics
     *
     * @param extractions - Extractions to analyze
     * @returns Statistics object
     */
    getExtractionStats(extractions) {
        const stats = {
            total: extractions.length,
            by_type: {},
            with_provenance: 0,
            avg_supporting_text_length: 0,
        };
        let totalSupportingTextLength = 0;
        extractions.forEach(extraction => {
            // Count by type
            stats.by_type[extraction.type] = (stats.by_type[extraction.type] || 0) + 1;
            // Count with provenance
            if (extraction.provenance && extraction.provenance.supporting_text) {
                stats.with_provenance++;
                totalSupportingTextLength += extraction.provenance.supporting_text.length;
            }
        });
        if (stats.with_provenance > 0) {
            stats.avg_supporting_text_length = Math.round(totalSupportingTextLength / stats.with_provenance);
        }
        return stats;
    }
    /**
     * Format answer for display
     *
     * @param answer - Generated answer
     * @returns Formatted string
     */
    formatAnswer(answer) {
        let formatted = '';
        formatted += '═'.repeat(80) + '\n';
        formatted += 'ANSWER\n';
        formatted += '═'.repeat(80) + '\n\n';
        formatted += `${answer.short_answer}\n\n`;
        formatted += '─'.repeat(80) + '\n';
        formatted += 'DETAILS\n';
        formatted += '─'.repeat(80) + '\n\n';
        formatted += `${answer.detailed_summary}\n\n`;
        formatted += '─'.repeat(80) + '\n';
        formatted += 'EXTRACTIONS\n';
        formatted += '─'.repeat(80) + '\n\n';
        answer.structured_extractions.forEach((extraction, i) => {
            formatted += `[${i + 1}] ${extraction.type}\n`;
            formatted += `    Content: ${JSON.stringify(extraction.content)}\n`;
            formatted += `    Source: ${extraction.provenance.artifact_id} / ${extraction.provenance.chunk_id}\n`;
            formatted += `    Text: "${extraction.provenance.supporting_text}"\n\n`;
        });
        formatted += '─'.repeat(80) + '\n';
        formatted += 'METADATA\n';
        formatted += '─'.repeat(80) + '\n\n';
        formatted += `Model: ${answer.model}\n`;
        formatted += `Tokens: ${answer.total_tokens}\n`;
        formatted += `Generation Time: ${answer.generation_time_ms}ms\n`;
        return formatted;
    }
    /**
     * Explain answer generation process
     *
     * @returns Explanation string
     */
    explain() {
        return `Answer Generation Agent Process:

1. Input Validation
   - Verify candidates exist
   - Check query is valid

2. Two-Pass Generation
   - Pass 1: Extract facts (temp=0)
   - Pass 2: Summarize (temp=0.3)

3. Extraction Validation
   - Check provenance exists
   - Validate char_offsets
   - Verify supporting_text matches
   - Ensure artifact_ids exist

4. Answer Assembly
   - Combine short answer + detailed summary
   - Include validated extractions
   - Track performance metrics

5. Return Complete Answer
   - short_answer (under 50 words)
   - detailed_summary (under 200 words)
   - structured_extractions with provenance
   - model, tokens, generation time`;
    }
}
// Export singleton instance
const answerGenerationAgent = new AnswerGenerationAgent();
exports.default = answerGenerationAgent;
//# sourceMappingURL=answer-generation-agent.service.js.map