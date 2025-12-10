/**
 * Avon Health API Service
 * Handles OAuth2 authentication and EMR data fetching
 */
import type { AvonHealthCredentials, CarePlan, Medication, ClinicalNote, Patient, Allergy, Condition, Vitals, FamilyHistory, Appointment, Document, FormResponse, InsurancePolicy, Artifact } from '../types';
export declare class AvonHealthService {
    private client;
    private credentials;
    private accessToken;
    private tokenExpiry;
    private jwtToken;
    private jwtExpiry;
    private artifactCache;
    private patientDataCache;
    private patientCacheTTL;
    private maxPatientCacheSize;
    private patientCacheHits;
    private patientCacheMisses;
    private prefetchedPatients;
    private DEFAULT_RETRY_CONFIG;
    constructor(credentials: AvonHealthCredentials);
    /**
     * Get OAuth2 Bearer Token (with caching)
     * Uses client credentials flow to obtain access token
     */
    private getAccessToken;
    /**
     * Get JWT Token for user-level authentication (with caching)
     * Requires bearer token first
     */
    private getJWTToken;
    /**
     * ENHANCED: Exponential backoff retry wrapper for resilient API calls
     */
    private retryWithBackoff;
    /**
     * Make authenticated request to Avon Health API using TWO-KEY authentication
     * Key 1: Bearer token (organization-level)
     * Key 2: JWT token (user-level) in x-jwt header
     * ENHANCED: Now includes retry logic with exponential backoff
     */
    private authenticatedRequest;
    /**
     * Fetch care plans for a patient
     * API returns data in format: { object: "list", data: [...] }
     * CRITICAL: API returns ALL records across ALL patients - must filter client-side
     */
    getCarePlans(patientId?: string): Promise<CarePlan[]>;
    /**
     * Fetch medications for a patient
     * API returns data in format: { object: "list", data: [...] }
     * CRITICAL: API returns ALL records across ALL patients - must filter client-side
     */
    getMedications(patientId?: string): Promise<Medication[]>;
    /**
     * Fetch clinical notes for a patient
     * API returns data in format: { object: "list", data: [...] }
     * CRITICAL: API returns ALL records across ALL patients - must filter client-side
     */
    getNotes(patientId?: string): Promise<ClinicalNote[]>;
    /**
     * Fetch patient demographics
     * CRITICAL: Returns patient name, age, gender, contact info
     */
    getPatients(patientId?: string): Promise<Patient[]>;
    /**
     * Fetch allergies for a patient
     */
    getAllergies(patientId?: string): Promise<Allergy[]>;
    /**
     * Fetch conditions for a patient
     */
    getConditions(patientId?: string): Promise<Condition[]>;
    /**
     * Fetch vitals for a patient
     */
    getVitals(patientId?: string): Promise<Vitals[]>;
    /**
     * Fetch family history for a patient
     */
    getFamilyHistory(patientId?: string): Promise<FamilyHistory[]>;
    /**
     * Fetch appointments for a patient
     */
    getAppointments(patientId?: string): Promise<Appointment[]>;
    /**
     * Fetch documents for a patient
     */
    getDocuments(patientId?: string): Promise<Document[]>;
    /**
     * Fetch form responses for a patient
     */
    getFormResponses(patientId?: string): Promise<FormResponse[]>;
    /**
     * Fetch insurance policies for a patient
     */
    getInsurancePolicies(patientId?: string): Promise<InsurancePolicy[]>;
    /**
     * Fetch all EMR data for a patient - COMPREHENSIVE
     */
    getAllPatientData(patientId: string): Promise<{
        patient: Patient | null;
        care_plans: CarePlan[];
        medications: Medication[];
        notes: ClinicalNote[];
        allergies: Allergy[];
        conditions: Condition[];
        vitals: Vitals[];
        family_history: FamilyHistory[];
        appointments: Appointment[];
        documents: Document[];
        form_responses: FormResponse[];
        insurance_policies: InsurancePolicy[];
    }>;
    /**
     * Health check - tests TWO-KEY authentication
     */
    healthCheck(): Promise<boolean>;
    /**
     * Test patient data retrieval with different patient_id patterns
     * Helps debug 401 errors by trying common patient_id formats
     */
    testPatientIdFormats(baseId?: string): Promise<void>;
    /**
     * Normalize a CarePlan to spec-compliant Artifact format
     * Flattens nested sections into searchable text
     */
    private normalizeCarePlan;
    /**
     * Normalize a Medication to spec-compliant Artifact format
     */
    private normalizeMedication;
    /**
     * Normalize a ClinicalNote to spec-compliant Artifact format
     * Flattens nested sections/answers into searchable text
     */
    private normalizeClinicalNote;
    /**
     * Get normalized artifacts for a patient (with caching)
     * Returns all artifacts in spec-compliant Artifact format
     */
    getNormalizedArtifacts(patientId: string): Promise<Artifact[]>;
    /**
     * Get a single normalized artifact by ID (with caching)
     */
    getNormalizedArtifact(artifactId: string, type: 'care_plan' | 'medication' | 'note'): Promise<Artifact | null>;
    /**
     * Configure cache settings
     */
    configureCaching(config: {
        ttlSeconds?: number;
        maxSize?: number;
    }): void;
    /**
     * Get cached patient data (with automatic cache invalidation)
     */
    getCachedPatientData(patientId: string): Promise<Artifact[]>;
    /**
     * Prefetch patient data (for warmup)
     */
    prefetchPatientData(patientId: string): Promise<void>;
    /**
     * Invalidate cache for a specific patient or all patients
     */
    invalidateCache(patientId?: string): void;
    /**
     * Warmup cache with frequently accessed patients
     */
    warmupCache(patientIds: string[]): Promise<void>;
    /**
     * Clear the artifact cache (useful for testing)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        artifact_cache: {
            size: number;
            max: number;
        };
        patient_cache: {
            size: number;
            max: number;
            hits: number;
            misses: number;
            hit_rate: string;
            ttl_seconds: number;
        };
    };
}
//# sourceMappingURL=avonhealth.service.d.ts.map