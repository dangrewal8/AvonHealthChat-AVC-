/**
 * Citation Validator Service
 *
 * Validates citations to ensure all are valid and supported by source text.
 *
 * Features:
 * - Artifact ID validation
 * - Char offset validation
 * - Text matching validation
 * - Provenance validation
 * - Comprehensive error reporting
 *
 */
import { Extraction, ExtractionProvenance } from './extraction-prompt-builder.service';
import { RetrievalCandidate } from './retriever-agent.service';
import { Chunk } from './metadata-filter.service';
/**
 * Citation error types
 */
export type CitationErrorType = 'invalid_artifact_id' | 'invalid_offsets' | 'text_mismatch' | 'missing_provenance';
/**
 * Citation warning types
 */
export type CitationWarningType = 'whitespace_mismatch' | 'partial_match' | 'case_mismatch';
/**
 * Citation error
 */
export interface CitationError {
    extraction_index: number;
    provenance_index?: number;
    error_type: CitationErrorType;
    message: string;
    details?: any;
}
/**
 * Citation warning
 */
export interface CitationWarning {
    extraction_index: number;
    provenance_index?: number;
    warning_type: CitationWarningType;
    message: string;
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: CitationError[];
    warnings: CitationWarning[];
    validated_count: number;
    error_count: number;
    warning_count: number;
}
/**
 * Citation Validator Class
 *
 * Validates all citations are supported by source text
 */
declare class CitationValidator {
    /**
     * Validate all extractions
     *
     * Checks:
     * - Artifact ID exists in candidates
     * - Char offsets are within text bounds
     * - Supporting text matches chunk text at offsets
     * - All extractions have provenance
     *
     * @param extractions - Extractions to validate
     * @param candidates - Retrieved candidates
     * @returns Validation result
     */
    validate(extractions: Extraction[], candidates: RetrievalCandidate[]): ValidationResult;
    /**
     * Validate provenance
     *
     * @param provenance - Provenance to validate
     * @param chunk - Chunk to validate against
     * @returns True if provenance is valid
     */
    validateProvenance(provenance: ExtractionProvenance, chunk: Chunk): boolean;
    /**
     * Validate char offsets
     *
     * Checks:
     * - start >= 0
     * - end <= text.length
     * - start < end
     *
     * @param offsets - Character offsets [start, end]
     * @param text - Text to validate against
     * @returns True if offsets are valid
     */
    validateCharOffsets(offsets: [number, number], text: string): boolean;
    /**
     * Validate text match
     *
     * Checks if supporting text matches chunk text at offsets.
     * Returns detailed result with warnings for minor issues.
     *
     * @param supportingText - Supporting text from extraction
     * @param chunkText - Chunk text
     * @param offsets - Character offsets [start, end]
     * @returns Detailed validation result
     */
    validateTextMatch(supportingText: string, chunkText: string, offsets: [number, number]): {
        valid: boolean;
        extracted?: string;
        warning?: boolean;
        warning_type?: CitationWarningType;
        warning_message?: string;
    };
    /**
     * Get validation summary
     *
     * @param result - Validation result
     * @returns Summary string
     */
    getValidationSummary(result: ValidationResult): string;
    /**
     * Check if all extractions have provenance
     *
     * @param extractions - Extractions to check
     * @returns True if all have provenance
     */
    allHaveProvenance(extractions: Extraction[]): boolean;
    /**
     * Get extractions without provenance
     *
     * @param extractions - Extractions to check
     * @returns Indices of extractions without provenance
     */
    getExtractionsWithoutProvenance(extractions: Extraction[]): number[];
    /**
     * Validate single extraction
     *
     * @param extraction - Extraction to validate
     * @param candidates - Retrieved candidates
     * @returns Validation result for single extraction
     */
    validateSingle(extraction: Extraction, candidates: RetrievalCandidate[]): ValidationResult;
    /**
     * Get error types summary
     *
     * @param errors - Citation errors
     * @returns Count of each error type
     */
    getErrorTypesSummary(errors: CitationError[]): Record<CitationErrorType, number>;
    /**
     * Explain validation process
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const citationValidator: CitationValidator;
export default citationValidator;
//# sourceMappingURL=citation-validator.service.d.ts.map