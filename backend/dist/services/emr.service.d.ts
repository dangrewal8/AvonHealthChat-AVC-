import { FilterOptions, FetchResult, FetchAllResult } from '../types/emr.types';
declare class EMRService {
    private cache;
    private readonly client;
    private readonly config;
    constructor();
    /**
     * Fetch care plans for a patient
     */
    fetchCarePlans(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch medications for a patient
     */
    fetchMedications(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch clinical notes for a patient
     */
    fetchNotes(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch clinical documents for a patient
     */
    fetchDocuments(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch conditions/diagnoses for a patient
     */
    fetchConditions(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch allergies for a patient
     */
    fetchAllergies(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch form responses for a patient
     */
    fetchFormResponses(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch messages for a patient
     */
    fetchMessages(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch lab observations for a patient
     */
    fetchLabObservations(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch vitals for a patient
     */
    fetchVitals(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch appointments for a patient
     */
    fetchAppointments(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch superbills for a patient
     */
    fetchSuperbills(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch insurance policies for a patient
     */
    fetchInsurancePolicies(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch tasks for a patient
     */
    fetchTasks(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch family history for a patient
     */
    fetchFamilyHistories(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch intake flows (patient registration form flows)
     */
    fetchIntakeFlows(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch forms (form templates/definitions)
     */
    fetchForms(patientId: string, options?: FilterOptions): Promise<FetchResult<any[]>>;
    /**
     * Fetch all EMR data for a patient (Tier 1 + Tier 2 + Tier 3 + Tier 4)
     */
    fetchAll(patientId: string): Promise<FetchAllResult>;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Clear cache for a specific patient
     */
    clearPatientCache(patientId: string): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        entries: Array<{
            key: string;
            expiresIn: number;
        }>;
    };
    /**
     * Generic fetch method with caching, retry logic, and error handling
     */
    private fetchData;
    /**
     * Handle errors with retry logic
     */
    private handleFetchError;
    /**
     * Get data from cache
     */
    private getFromCache;
    /**
     * Store data in cache
     */
    private setInCache;
    /**
     * Generate cache key in format: {type}:{patientId}:{timestamp}
     * For consistent caching, we round timestamp to minute
     */
    private generateCacheKey;
    /**
     * Clean expired cache entries
     */
    private cleanExpiredCache;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
}
export declare const emrService: EMRService;
export default emrService;
//# sourceMappingURL=emr.service.d.ts.map