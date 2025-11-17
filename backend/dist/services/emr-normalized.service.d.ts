import { Artifact } from '../types/artifact.types';
import { FilterOptions } from '../types/emr.types';
/**
 * Extended EMR service that returns normalized Artifact objects
 */
declare class EMRNormalizedService {
    /**
     * Fetch and normalize care plans for a patient
     */
    fetchCarePlans(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    /**
     * Fetch and normalize medications for a patient
     */
    fetchMedications(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    /**
     * Fetch and normalize clinical notes for a patient
     */
    fetchNotes(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    /**
     * Fetch and normalize clinical documents for a patient
     */
    fetchDocuments(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    /**
     * Fetch and normalize conditions for a patient
     */
    fetchConditions(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    /**
     * Fetch and normalize allergies for a patient
     */
    fetchAllergies(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchFormResponses(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchMessages(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchLabObservations(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchVitals(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchAppointments(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchSuperbills(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchInsurancePolicies(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchTasks(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchFamilyHistories(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchIntakeFlows(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    fetchForms(patientId: string, options?: FilterOptions): Promise<{
        artifacts: Artifact[];
        cached: boolean;
        fetchTime: number;
    }>;
    /**
     * Fetch and normalize all EMR data for a patient (Tier 1 + Tier 2 + Tier 3 + Tier 4)
     */
    fetchAll(patientId: string): Promise<{
        artifacts: Artifact[];
        byType: {
            notes: Artifact[];
            documents: Artifact[];
            medications: Artifact[];
            conditions: Artifact[];
            allergies: Artifact[];
            carePlans: Artifact[];
            formResponses: Artifact[];
            messages: Artifact[];
            labObservations: Artifact[];
            vitals: Artifact[];
            appointments: Artifact[];
            superbills: Artifact[];
            insurancePolicies: Artifact[];
            tasks: Artifact[];
            familyHistories: Artifact[];
            intakeFlows: Artifact[];
            forms: Artifact[];
        };
        cached: boolean;
        fetchTime: number;
        totalCount: number;
    }>;
    /**
     * Validate all artifacts and return only valid ones
     */
    fetchAllValid(patientId: string): Promise<{
        artifacts: Artifact[];
        invalidCount: number;
        cached: boolean;
        fetchTime: number;
    }>;
}
export declare const emrNormalizedService: EMRNormalizedService;
export default emrNormalizedService;
//# sourceMappingURL=emr-normalized.service.d.ts.map