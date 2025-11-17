/**
 * Normalization Service Usage Examples
 *
 * This file demonstrates how to use the artifact normalization service
 * to convert raw EMR data into standardized Artifact format.
 */
/**
 * Example 1: Normalize a care plan
 */
export declare function exampleNormalizeCarePlan(): import("../types/artifact.types").Artifact;
/**
 * Example 2: Normalize a medication
 */
export declare function exampleNormalizeMedication(): import("../types/artifact.types").Artifact;
/**
 * Example 3: Normalize a clinical note
 */
export declare function exampleNormalizeNote(): import("../types/artifact.types").Artifact;
/**
 * Example 4: Handle missing fields with defaults
 */
export declare function exampleMissingFields(): void;
/**
 * Example 5: Date format conversion
 */
export declare function exampleDateConversion(): void;
/**
 * Example 6: Text extraction from nested objects
 */
export declare function exampleNestedText(): void;
/**
 * Example 7: Validation with errors
 */
export declare function exampleValidation(): import("../types/artifact.types").NormalizationResult;
/**
 * Example 8: Batch normalization
 */
export declare function exampleBatchNormalization(): import("../types/artifact.types").Artifact[];
/**
 * Example 9: Handle various text field locations
 */
export declare function exampleTextExtraction(): void;
/**
 * Example 10: Integration with EMR service
 */
export declare function exampleIntegrationWithEMR(): Promise<import("../types/artifact.types").Artifact[]>;
/**
 * Example 11: Medication-specific normalization
 */
export declare function exampleMedicationNormalization(): import("../types/artifact.types").Artifact[];
/**
 * Example 12: Source URL construction
 */
export declare function exampleSourceUrls(): void;
//# sourceMappingURL=normalization.example.d.ts.map