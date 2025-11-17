"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Citation Validator Class
 *
 * Validates all citations are supported by source text
 */
class CitationValidator {
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
    validate(extractions, candidates) {
        const errors = [];
        const warnings = [];
        // Build candidate lookup map
        const candidateMap = new Map();
        candidates.forEach(candidate => {
            candidateMap.set(candidate.chunk.chunk_id, candidate);
        });
        // Validate each extraction
        extractions.forEach((extraction, extractionIndex) => {
            // Check 1: Extraction has provenance
            if (!extraction.provenance) {
                errors.push({
                    extraction_index: extractionIndex,
                    error_type: 'missing_provenance',
                    message: `Extraction ${extractionIndex} missing provenance`,
                });
                return;
            }
            // Validate provenance
            const provenance = extraction.provenance;
            // Check 2: Artifact ID exists in candidates
            const candidate = candidateMap.get(provenance.chunk_id);
            if (!candidate) {
                errors.push({
                    extraction_index: extractionIndex,
                    provenance_index: 0,
                    error_type: 'invalid_artifact_id',
                    message: `Chunk ${provenance.chunk_id} not found in candidates`,
                    details: {
                        chunk_id: provenance.chunk_id,
                        artifact_id: provenance.artifact_id,
                    },
                });
                return;
            }
            // Check 3: Artifact ID matches chunk's artifact ID
            if (candidate.chunk.artifact_id !== provenance.artifact_id) {
                errors.push({
                    extraction_index: extractionIndex,
                    provenance_index: 0,
                    error_type: 'invalid_artifact_id',
                    message: `Artifact ID mismatch: chunk has ${candidate.chunk.artifact_id}, provenance has ${provenance.artifact_id}`,
                    details: {
                        expected: candidate.chunk.artifact_id,
                        actual: provenance.artifact_id,
                    },
                });
            }
            // Check 4: Char offsets are valid
            if (!this.validateCharOffsets(provenance.char_offsets, candidate.chunk.content)) {
                errors.push({
                    extraction_index: extractionIndex,
                    provenance_index: 0,
                    error_type: 'invalid_offsets',
                    message: `Invalid char offsets [${provenance.char_offsets[0]}, ${provenance.char_offsets[1]}] for chunk length ${candidate.chunk.content.length}`,
                    details: {
                        offsets: provenance.char_offsets,
                        text_length: candidate.chunk.content.length,
                    },
                });
                return;
            }
            // Check 5: Supporting text matches chunk text at offsets
            const textMatchResult = this.validateTextMatch(provenance.supporting_text, candidate.chunk.content, provenance.char_offsets);
            if (!textMatchResult.valid) {
                errors.push({
                    extraction_index: extractionIndex,
                    provenance_index: 0,
                    error_type: 'text_mismatch',
                    message: `Supporting text does not match chunk text at offsets`,
                    details: {
                        expected: textMatchResult.extracted,
                        actual: provenance.supporting_text,
                        offsets: provenance.char_offsets,
                    },
                });
            }
            // Check for warnings (whitespace/case differences)
            if (textMatchResult.warning) {
                warnings.push({
                    extraction_index: extractionIndex,
                    provenance_index: 0,
                    warning_type: textMatchResult.warning_type,
                    message: textMatchResult.warning_message,
                });
            }
        });
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            validated_count: extractions.length,
            error_count: errors.length,
            warning_count: warnings.length,
        };
    }
    /**
     * Validate provenance
     *
     * @param provenance - Provenance to validate
     * @param chunk - Chunk to validate against
     * @returns True if provenance is valid
     */
    validateProvenance(provenance, chunk) {
        // Check required fields
        if (!provenance.artifact_id || !provenance.chunk_id) {
            return false;
        }
        // Check artifact ID matches
        if (provenance.artifact_id !== chunk.artifact_id) {
            return false;
        }
        // Check chunk ID matches
        if (provenance.chunk_id !== chunk.chunk_id) {
            return false;
        }
        // Check char offsets are valid
        if (!this.validateCharOffsets(provenance.char_offsets, chunk.content)) {
            return false;
        }
        // Check supporting text matches
        const textMatch = this.validateTextMatch(provenance.supporting_text, chunk.content, provenance.char_offsets);
        return textMatch.valid;
    }
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
    validateCharOffsets(offsets, text) {
        const [start, end] = offsets;
        return start >= 0 && end <= text.length && start < end;
    }
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
    validateTextMatch(supportingText, chunkText, offsets) {
        const extracted = chunkText.substring(offsets[0], offsets[1]);
        // Exact match (ideal)
        if (extracted === supportingText) {
            return { valid: true };
        }
        // Trimmed match (acceptable with warning)
        if (extracted.trim() === supportingText.trim()) {
            return {
                valid: true,
                warning: true,
                warning_type: 'whitespace_mismatch',
                warning_message: 'Supporting text matches after trimming whitespace',
            };
        }
        // Case-insensitive match (acceptable with warning)
        if (extracted.toLowerCase() === supportingText.toLowerCase()) {
            return {
                valid: true,
                warning: true,
                warning_type: 'case_mismatch',
                warning_message: 'Supporting text matches with different case',
            };
        }
        // No match
        return {
            valid: false,
            extracted,
        };
    }
    /**
     * Get validation summary
     *
     * @param result - Validation result
     * @returns Summary string
     */
    getValidationSummary(result) {
        let summary = '';
        summary += 'Citation Validation Summary:\n';
        summary += '═'.repeat(60) + '\n\n';
        summary += `Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}\n`;
        summary += `Validated: ${result.validated_count} extractions\n`;
        summary += `Errors: ${result.error_count}\n`;
        summary += `Warnings: ${result.warning_count}\n\n`;
        if (result.errors.length > 0) {
            summary += 'Errors:\n';
            summary += '─'.repeat(60) + '\n';
            result.errors.forEach((error, i) => {
                summary += `  ${i + 1}. [Extraction ${error.extraction_index}] ${error.error_type}: ${error.message}\n`;
            });
            summary += '\n';
        }
        if (result.warnings.length > 0) {
            summary += 'Warnings:\n';
            summary += '─'.repeat(60) + '\n';
            result.warnings.forEach((warning, i) => {
                summary += `  ${i + 1}. [Extraction ${warning.extraction_index}] ${warning.warning_type}: ${warning.message}\n`;
            });
            summary += '\n';
        }
        return summary;
    }
    /**
     * Check if all extractions have provenance
     *
     * @param extractions - Extractions to check
     * @returns True if all have provenance
     */
    allHaveProvenance(extractions) {
        return extractions.every(e => e.provenance !== undefined && e.provenance !== null);
    }
    /**
     * Get extractions without provenance
     *
     * @param extractions - Extractions to check
     * @returns Indices of extractions without provenance
     */
    getExtractionsWithoutProvenance(extractions) {
        const indices = [];
        extractions.forEach((extraction, index) => {
            if (!extraction.provenance) {
                indices.push(index);
            }
        });
        return indices;
    }
    /**
     * Validate single extraction
     *
     * @param extraction - Extraction to validate
     * @param candidates - Retrieved candidates
     * @returns Validation result for single extraction
     */
    validateSingle(extraction, candidates) {
        return this.validate([extraction], candidates);
    }
    /**
     * Get error types summary
     *
     * @param errors - Citation errors
     * @returns Count of each error type
     */
    getErrorTypesSummary(errors) {
        const summary = {
            invalid_artifact_id: 0,
            invalid_offsets: 0,
            text_mismatch: 0,
            missing_provenance: 0,
        };
        errors.forEach(error => {
            summary[error.error_type]++;
        });
        return summary;
    }
    /**
     * Explain validation process
     *
     * @returns Explanation string
     */
    explain() {
        return `Citation Validation Process:

1. Provenance Check
   - Ensure extraction has provenance
   - Error if missing

2. Artifact ID Validation
   - Check chunk_id exists in candidates
   - Check artifact_id matches chunk's artifact_id
   - Error if not found or mismatch

3. Char Offsets Validation
   - Check start >= 0
   - Check end <= text length
   - Check start < end
   - Error if invalid

4. Text Matching Validation
   - Extract text at offsets from chunk
   - Compare with supporting_text
   - Exact match: ✅
   - Trimmed match: ✅ with warning
   - Case mismatch: ✅ with warning
   - No match: ❌ error

Result:
- valid = true if no errors
- errors[] = all validation errors
- warnings[] = non-critical issues`;
    }
}
// Export singleton instance
const citationValidator = new CitationValidator();
exports.default = citationValidator;
//# sourceMappingURL=citation-validator.service.js.map