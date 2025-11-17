import { Artifact, ArtifactType, NormalizationResult } from '../types/artifact.types';
import { ValidationResult } from './validation.service';
declare class NormalizationService {
    /**
     * Normalize a care plan from raw API data
     */
    normalizeCarePlan(rawData: any): Artifact;
    /**
     * Normalize a medication from raw API data
     */
    normalizeMedication(rawData: any): Artifact;
    /**
     * Normalize a clinical note from raw API data
     */
    normalizeNote(rawData: any): Artifact;
    /**
     * Normalize a clinical document from raw API data
     */
    normalizeDocument(rawData: any): Artifact;
    /**
     * Normalize a condition/diagnosis from raw API data
     */
    normalizeCondition(rawData: any): Artifact;
    /**
     * Normalize an allergy from raw API data
     */
    normalizeAllergy(rawData: any): Artifact;
    normalizeFormResponse(rawData: any): Artifact;
    normalizeMessage(rawData: any): Artifact;
    normalizeLabObservation(rawData: any): Artifact;
    normalizeVital(rawData: any): Artifact;
    /**
     * Normalize appointment data
     */
    normalizeAppointment(rawData: any): Artifact;
    /**
     * Normalize superbill data
     */
    normalizeSuperbill(rawData: any): Artifact;
    /**
     * Normalize insurance policy data
     */
    normalizeInsurancePolicy(rawData: any): Artifact;
    /**
     * Normalize task data
     */
    normalizeTask(rawData: any): Artifact;
    /**
     * Normalize family history data
     */
    normalizeFamilyHistory(rawData: any): Artifact;
    /**
     * Normalize intake flow data
     */
    normalizeIntakeFlow(rawData: any): Artifact;
    /**
     * Normalize form data
     */
    normalizeForm(rawData: any): Artifact;
    /**
     * Normalize any artifact with validation
     */
    normalize(rawData: any, type: ArtifactType): NormalizationResult;
    /**
     * Normalize a batch of artifacts
     */
    normalizeBatch(rawDataArray: any[], type: ArtifactType): Artifact[];
    /**
     * Extract ID from raw data
     */
    private extractId;
    /**
     * Extract patient ID from raw data
     */
    private extractPatientId;
    /**
     * Extract author from raw data
     */
    private extractAuthor;
    /**
     * Extract and normalize date to ISO 8601
     */
    private extractDate;
    /**
     * Normalize various date formats to ISO 8601
     */
    private normalizeDate;
    /**
     * Extract title from raw data
     */
    private extractTitle;
    /**
     * Extract text content from raw data (checks multiple possible fields)
     */
    private extractText;
    /**
     * Extract text from nested objects
     */
    private extractTextFromObject;
    /**
     * Extract any meaningful text from the object
     */
    private extractAnyText;
    /**
     * Extract medication-specific title
     */
    private extractMedicationTitle;
    /**
     * Extract medication-specific text
     */
    private extractMedicationText;
    /**
     * Extract condition-specific title
     */
    private extractConditionTitle;
    /**
     * Extract condition-specific text
     */
    private extractConditionText;
    /**
     * Extract allergy-specific title
     */
    private extractAllergyTitle;
    /**
     * Extract allergy-specific text
     */
    private extractAllergyText;
    /**
     * Construct source URL for an artifact
     */
    private constructSourceUrl;
    /**
     * Extract metadata (exclude common fields)
     */
    private extractMeta;
    /**
     * Validate an artifact using the comprehensive validation service
     */
    validateArtifact(artifact: Artifact): ValidationResult;
}
export declare const normalizationService: NormalizationService;
export default normalizationService;
//# sourceMappingURL=normalization.service.d.ts.map