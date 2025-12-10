/**
 * Response Validation Service
 *
 * Validates and corrects LLM responses to eliminate hallucinations.
 * Implements research-backed techniques including:
 * - Numerical accuracy verification
 * - Citation verification
 * - Temporal query validation
 * - Count consistency enforcement
 * PHASE 2 Enhancements:
 * - date-fns for robust temporal filtering
 * - Citation verification pipeline
 */
interface ValidationContext {
    query: string;
    response: string;
    structuredExtractions: any[];
    provenance: any[];
    patientData?: any;
}
interface ValidationResult {
    isValid: boolean;
    correctedResponse?: string;
    issues: string[];
    confidence: number;
}
export declare class ValidationService {
    /**
     * Main validation entry point
     * Validates and corrects response against ground truth
     */
    validateAndCorrectResponse(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Validates numerical accuracy against ground truth
     * Fixes hallucinated counts for medications, conditions, allergies
     */
    private validateNumericalAccuracy;
    /**
     * Validates temporal queries (past vs current medications)
     * Ensures past medication queries don't mention active medications
     */
    private validateTemporalQuery;
    /**
     * Validates count consistency between reported counts and extracted entities
     * Ensures when LLM says "2 medications", it actually lists 2 medication names
     */
    private validateCountConsistency;
    /**
     * Validates that all claims in the response are supported by provenance
     * Implements citation verification
     */
    verifyCitations(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Extract atomic claims from response text
     */
    private extractClaims;
    /**
     * Check if a claim is supported by provenance artifacts
     */
    private isClaimSupported;
    /**
     * PHASE 2: Enhanced Temporal Filtering with date-fns
     * Filters artifacts by date range based on query temporal expressions
     */
    filterArtifactsByTimeWindow(artifacts: any[], query: string): {
        filtered: any[];
        time_window?: {
            start: Date;
            end: Date;
            expression: string;
        };
    };
}
export declare const validationService: ValidationService;
export {};
//# sourceMappingURL=validation.service.d.ts.map