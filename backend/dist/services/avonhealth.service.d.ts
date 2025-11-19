/**
 * Avon Health API Service
 * Handles OAuth2 authentication and EMR data fetching
 */
import type { AvonHealthCredentials, CarePlan, Medication, ClinicalNote, Patient, Allergy, Condition, Vitals, FamilyHistory, Appointment, Document, FormResponse, InsurancePolicy } from '../types';
export declare class AvonHealthService {
    private client;
    private credentials;
    private accessToken;
    private tokenExpiry;
    private jwtToken;
    private jwtExpiry;
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
     * Make authenticated request to Avon Health API using TWO-KEY authentication
     * Key 1: Bearer token (organization-level)
     * Key 2: JWT token (user-level) in x-jwt header
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
}
//# sourceMappingURL=avonhealth.service.d.ts.map