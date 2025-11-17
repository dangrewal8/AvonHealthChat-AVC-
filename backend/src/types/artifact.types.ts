export type ArtifactType =
  // Tier 1 - Critical Medical Data
  | 'note'          // ✅ Stage 1: 662 records
  | 'document'      // ✅ Stage 1: 718 records (lab reports, imaging, referrals)
  | 'medication'    // ✅ Stage 1: 155 records
  | 'condition'     // ✅ Stage 1: 201 records (diagnoses, ICD-10 codes)
  | 'allergy'       // ✅ Stage 1: 204 records (allergens, reactions)
  | 'care_plan'     // ✅ Stage 1: 82 records
  // Tier 2 - Patient Interactions & Lab Data
  | 'form_response' // ✅ Stage 2: 748 records (forms, questionnaires, surveys)
  | 'message'       // ✅ Stage 2: 891 records (patient-provider messages)
  | 'lab_observation' // ✅ Stage 2: 419 records (lab results, vitals observations)
  | 'vital'         // ✅ Stage 2: 199 records (vital signs measurements)
  // Tier 3 - Administrative & Scheduling
  | 'appointment'   // 🆕 Stage 3: 46 records (appointments, visits, encounters)
  | 'superbill'     // 🆕 Stage 3: 177 records (billing codes, claims)
  | 'insurance_policy' // 🆕 Stage 3: 122 records (insurance information)
  | 'task'          // 🆕 Stage 3: 20 records (care tasks, action items)
  | 'family_history' // 🆕 Stage 3: 7 records (family medical history)
  // Tier 4 - Configuration & Templates
  | 'intake_flow'   // 🆕 Stage 4: Configuration for patient registration flows
  | 'form';         // 🆕 Stage 4: Form templates/definitions

export interface Artifact {
  id: string;
  type: ArtifactType;
  patient_id: string;
  author?: string;
  occurred_at: string; // ISO 8601
  title?: string;
  text: string;
  source: string; // URL
  meta?: Record<string, any>;
}

// Re-export validation types from validation service
// Note: These are defined in validation.service.ts and re-exported here for convenience
export type { ValidationError, ValidationResult } from '../services/validation.service';

export interface NormalizationResult {
  artifact: Artifact;
  validation: import('../services/validation.service').ValidationResult;
}
