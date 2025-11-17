/**
 * Medical Prompt Templates Service
 *
 * Specialized prompt templates optimized for medical Q&A with Meditron.
 *
 * Features:
 * - Medical-specific prompt engineering
 * - Citation and provenance tracking
 * - Safety disclaimers
 * - Evidence-based response requirements
 * - Clinical entity extraction
 * - Treatment plan analysis
 *
 * Designed for use with Meditron (medical LLM) via Ollama.
 */
/**
 * Medical disclaimer configuration
 */
export interface MedicalDisclaimer {
    enabled: boolean;
    shortForm: string;
    longForm: string;
}
/**
 * Prompt template options
 */
export interface PromptOptions {
    includeDisclaimer?: boolean;
    requireCitations?: boolean;
    requireConfidenceLevel?: boolean;
    maxTokens?: number;
    temperature?: number;
}
/**
 * Clinical entity types to extract
 */
export declare enum ClinicalEntityType {
    MEDICATION = "medication",
    DIAGNOSIS = "diagnosis",
    PROCEDURE = "procedure",
    LAB_RESULT = "lab_result",
    VITAL_SIGN = "vital_sign",
    ALLERGY = "allergy",
    SYMPTOM = "symptom"
}
/**
 * Treatment plan component
 */
export interface TreatmentPlanComponent {
    medications?: boolean;
    procedures?: boolean;
    followUp?: boolean;
    patientEducation?: boolean;
    labOrders?: boolean;
}
/**
 * Medical Prompt Templates Service
 */
declare class MedicalPromptTemplatesService {
    /**
     * Default medical disclaimer
     */
    private readonly DEFAULT_DISCLAIMER;
    /**
     * Medical question answering prompt with citations
     *
     * Optimized for Meditron to answer clinical questions based on retrieved context.
     * Requires citations to source artifacts and includes confidence levels.
     *
     * @param question - Medical question to answer
     * @param context - Array of context chunks with artifact IDs
     * @param options - Prompt options
     * @returns Formatted prompt for Meditron
     *
     * @example
     * const prompt = medicalQA(
     *   "What medications is the patient taking for hypertension?",
     *   ["Artifact ID: art_001\nContent: Patient prescribed lisinopril 10mg daily..."]
     * );
     */
    medicalQA(question: string, context: string[], options?: PromptOptions): string;
    /**
     * Clinical entity extraction prompt
     *
     * Extracts structured clinical entities from medical text.
     * Returns JSON with standardized medical terminology.
     *
     * @param text - Clinical text to extract from
     * @param entityTypes - Types of entities to extract (default: all)
     * @param options - Prompt options
     * @returns Formatted prompt for entity extraction
     *
     * @example
     * const prompt = extractClinicalEntities(
     *   "Patient presents with hypertension. Prescribed lisinopril 10mg daily.",
     *   [ClinicalEntityType.DIAGNOSIS, ClinicalEntityType.MEDICATION]
     * );
     */
    extractClinicalEntities(text: string, entityTypes?: ClinicalEntityType[], _options?: PromptOptions): string;
    /**
     * Medical record summarization prompt
     *
     * Summarizes medical records in standard clinical format.
     * Uses SOAP (Subjective, Objective, Assessment, Plan) structure.
     *
     * @param record - Full medical record or note
     * @param format - Summary format (default: 'soap')
     * @param options - Prompt options
     * @returns Formatted prompt for summarization
     *
     * @example
     * const prompt = summarizeMedicalRecord(
     *   "Patient presents with...",
     *   'soap'
     * );
     */
    summarizeMedicalRecord(record: string, format?: 'soap' | 'brief' | 'detailed', _options?: PromptOptions): string;
    /**
     * Treatment plan analysis prompt
     *
     * Analyzes treatment plans for completeness, safety, and evidence-based recommendations.
     *
     * @param plan - Treatment plan text
     * @param components - Which components to analyze
     * @param options - Prompt options
     * @returns Formatted prompt for treatment plan analysis
     *
     * @example
     * const prompt = analyzeTreatmentPlan(
     *   "Start metformin 500mg BID...",
     *   { medications: true, followUp: true }
     * );
     */
    analyzeTreatmentPlan(plan: string, components?: TreatmentPlanComponent, _options?: PromptOptions): string;
    /**
     * Differential diagnosis prompt
     *
     * Generates differential diagnosis based on symptoms and findings.
     * Prioritizes by likelihood and includes supporting evidence.
     *
     * @param presentation - Patient presentation (symptoms, signs, findings)
     * @param maxDiagnoses - Maximum number of differential diagnoses (default: 5)
     * @param options - Prompt options
     * @returns Formatted prompt for differential diagnosis
     *
     * @example
     * const prompt = differentialDiagnosis(
     *   "65yo M with chest pain, diaphoresis, SOB...",
     *   5
     * );
     */
    differentialDiagnosis(presentation: string, maxDiagnoses?: number, _options?: PromptOptions): string;
    /**
     * Medication reconciliation prompt
     *
     * Reconciles medication lists to identify discrepancies, duplications, and interactions.
     *
     * @param currentMeds - Current medication list
     * @param reportedMeds - Patient-reported medications
     * @param options - Prompt options
     * @returns Formatted prompt for medication reconciliation
     *
     * @example
     * const prompt = medicationReconciliation(
     *   "lisinopril 10mg daily, metformin 500mg BID",
     *   "blood pressure pill, diabetes medicine"
     * );
     */
    medicationReconciliation(currentMeds: string, reportedMeds: string, _options?: PromptOptions): string;
    /**
     * Lab result interpretation prompt
     *
     * Interprets lab results in clinical context, noting abnormalities and clinical significance.
     *
     * @param labResults - Lab results with values and reference ranges
     * @param clinicalContext - Patient's clinical context (diagnoses, medications)
     * @param options - Prompt options
     * @returns Formatted prompt for lab interpretation
     *
     * @example
     * const prompt = labResultInterpretation(
     *   "HbA1c: 8.2% (ref: 4.0-5.6%)",
     *   "Patient with Type 2 DM on metformin"
     * );
     */
    labResultInterpretation(labResults: string, clinicalContext?: string, _options?: PromptOptions): string;
    /**
     * Build system prompt based on task type
     *
     * @param taskType - Type of medical task
     * @returns System prompt for the task
     */
    private buildSystemPrompt;
    /**
     * Build context block from context chunks
     *
     * @param context - Array of context strings (with artifact IDs)
     * @returns Formatted context block
     */
    private buildContextBlock;
    /**
     * Build JSON schema for entity extraction
     *
     * @param entityTypes - Types of entities to extract
     * @returns JSON schema as string
     */
    private buildEntityExtractionSchema;
    /**
     * Get summary format instructions
     *
     * @param format - Summary format type
     * @returns Format-specific instructions
     */
    private getSummaryFormatInstructions;
    /**
     * Get medical disclaimer
     *
     * @param format - 'short' or 'long'
     * @returns Disclaimer text
     */
    getMedicalDisclaimer(format?: 'short' | 'long'): string;
    /**
     * Append disclaimer to response
     *
     * @param response - Generated response
     * @param format - Disclaimer format
     * @returns Response with disclaimer appended
     */
    appendDisclaimer(response: string, format?: 'short' | 'long'): string;
}
declare const medicalPromptTemplates: MedicalPromptTemplatesService;
export default medicalPromptTemplates;
//# sourceMappingURL=medical-prompt-templates.service.d.ts.map