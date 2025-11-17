export type ArtifactType = 'note' | 'document' | 'medication' | 'condition' | 'allergy' | 'care_plan' | 'form_response' | 'message' | 'lab_observation' | 'vital' | 'appointment' | 'superbill' | 'insurance_policy' | 'task' | 'family_history' | 'intake_flow' | 'form';
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
    notes: any[];
    documents: any[];
    medications: any[];
    conditions: any[];
    allergies: any[];
    carePlans: any[];
    formResponses: any[];
    messages: any[];
    labObservations: any[];
    vitals: any[];
    appointments: any[];
    superbills: any[];
    insurancePolicies: any[];
    tasks: any[];
    familyHistories: any[];
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
//# sourceMappingURL=emr.types.d.ts.map