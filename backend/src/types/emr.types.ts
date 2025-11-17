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

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface RawCarePlan {
  id: string;
  patient_id: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  author?: string;
  [key: string]: any;
}

export interface RawMedication {
  id: string;
  patient_id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  prescribed_at: string;
  prescriber?: string;
  [key: string]: any;
}

export interface RawNote {
  id: string;
  patient_id: string;
  title?: string;
  content: string;
  created_at: string;
  author?: string;
  note_type?: string;
  [key: string]: any;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface FetchResult<T> {
  data: T;
  cached: boolean;
  fetchTime: number;
  count: number;
}

export interface FetchAllResult {
  // Tier 1 types
  notes: any[];
  documents: any[];
  medications: any[];
  conditions: any[];
  allergies: any[];
  carePlans: any[];
  // Tier 2 types
  formResponses: any[];
  messages: any[];
  labObservations: any[];
  vitals: any[];
  // Tier 3 types
  appointments: any[];
  superbills: any[];
  insurancePolicies: any[];
  tasks: any[];
  familyHistories: any[];
  // Tier 4 types
  intakeFlows: any[];
  forms: any[];
  cached: boolean;
  fetchTime: number;
  totalCount: number;
}

export interface EMRServiceConfig {
  cacheTTL: number;
  retryAttempts: number;
  retryDelay: number;
  requestTimeout: number;
}
