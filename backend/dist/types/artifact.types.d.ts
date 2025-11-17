export type ArtifactType = 'note' | 'document' | 'medication' | 'condition' | 'allergy' | 'care_plan' | 'form_response' | 'message' | 'lab_observation' | 'vital' | 'appointment' | 'superbill' | 'insurance_policy' | 'task' | 'family_history' | 'intake_flow' | 'form';
export interface Artifact {
    id: string;
    type: ArtifactType;
    patient_id: string;
    author?: string;
    occurred_at: string;
    title?: string;
    text: string;
    source: string;
    meta?: Record<string, any>;
}
export type { ValidationError, ValidationResult } from '../services/validation.service';
export interface NormalizationResult {
    artifact: Artifact;
    validation: import('../services/validation.service').ValidationResult;
}
//# sourceMappingURL=artifact.types.d.ts.map