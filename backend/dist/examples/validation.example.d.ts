/**
 * Validation Service Usage Examples
 *
 * Demonstrates comprehensive artifact validation:
 * - Required field validation
 * - Type checking
 * - Date validity (ISO 8601, future dates, old dates)
 */
/**
 * Example 1: Valid artifact - all fields present and correct
 */
export declare function exampleValidArtifact(): import("../services/validation.service").ValidationResult;
/**
 * Example 2: Missing required fields
 */
export declare function exampleMissingRequiredFields(): import("../services/validation.service").ValidationResult;
/**
 * Example 3: Invalid field types
 */
export declare function exampleInvalidTypes(): import("../services/validation.service").ValidationResult;
/**
 * Example 4: Invalid date format
 */
export declare function exampleInvalidDateFormat(): import("../services/validation.service").ValidationResult;
/**
 * Example 5: Future date (warning)
 */
export declare function exampleFutureDate(): import("../services/validation.service").ValidationResult;
/**
 * Example 6: Very old date (warning)
 */
export declare function exampleVeryOldDate(): import("../services/validation.service").ValidationResult;
/**
 * Example 7: Date before 1900 (error)
 */
export declare function exampleDateBefore1900(): import("../services/validation.service").ValidationResult;
/**
 * Example 8: Empty required fields
 */
export declare function exampleEmptyFields(): import("../services/validation.service").ValidationResult;
/**
 * Example 9: Invalid artifact type
 */
export declare function exampleInvalidArtifactType(): import("../services/validation.service").ValidationResult;
/**
 * Example 10: Multiple warnings (valid but with issues)
 */
export declare function exampleMultipleWarnings(): import("../services/validation.service").ValidationResult;
/**
 * Example 11: Batch validation
 */
export declare function exampleBatchValidation(): {
    totalCount: number;
    validCount: number;
    invalidCount: number;
    warningCount: number;
    results: import("../services/validation.service").ValidationResult[];
};
/**
 * Example 12: Very long text (warning)
 */
export declare function exampleVeryLongText(): import("../services/validation.service").ValidationResult;
/**
 * Example 13: Simple boolean validation
 */
export declare function exampleBooleanValidation(): void;
/**
 * Run all examples
 */
export declare function runAllExamples(): void;
//# sourceMappingURL=validation.example.d.ts.map