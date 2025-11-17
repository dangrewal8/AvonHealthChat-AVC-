/**
 * Artifact Validation Service
 * Comprehensive validation for normalized Artifact objects
 *
 * Per ChatGPT Requirement: "Validation: Ensure all required fields are present, Type checking, Date validity"
 */
import { Artifact } from '../types/artifact.types';
/**
 * Validation error/warning interface
 */
export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
    value?: any;
}
/**
 * Validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}
/**
 * Artifact Validator Class
 * Validates artifacts for required fields, type correctness, and date validity
 */
declare class ArtifactValidator {
    /**
     * Comprehensive validation of an artifact
     * Returns detailed validation result with errors and warnings
     */
    validate(artifact: any): ValidationResult;
    /**
     * Simple boolean validation for artifacts
     * Returns true if artifact has no errors
     */
    validateArtifact(artifact: Artifact): boolean;
    /**
     * Validate required fields are present and non-empty
     */
    validateRequired(artifact: any): ValidationError[];
    /**
     * Validate date fields
     * Checks ISO 8601 format, future dates, and very old dates
     */
    validateDates(artifact: any): {
        errors: ValidationError[];
        warnings: ValidationError[];
    };
    /**
     * Validate field types
     */
    validateTypes(artifact: any): ValidationError[];
    /**
     * Additional validation checks
     */
    private validateAdditional;
    /**
     * Check if a string is a valid ISO 8601 date
     */
    private isValidISODate;
    /**
     * Batch validation
     * Validates multiple artifacts and returns a summary
     */
    validateBatch(artifacts: any[]): {
        totalCount: number;
        validCount: number;
        invalidCount: number;
        warningCount: number;
        results: ValidationResult[];
    };
    /**
     * Get validation summary for logging
     */
    getValidationSummary(result: ValidationResult): string;
    /**
     * Format validation errors for display
     */
    formatErrors(errors: ValidationError[]): string;
    /**
     * Format validation warnings for display
     */
    formatWarnings(warnings: ValidationError[]): string;
}
export declare const artifactValidator: ArtifactValidator;
export default artifactValidator;
//# sourceMappingURL=validation.service.d.ts.map