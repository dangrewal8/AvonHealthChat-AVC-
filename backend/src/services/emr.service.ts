import { AxiosError } from 'axios';
import createAuthenticatedClient from '../middleware/auth.middleware';
import config from '../config/env.config';
import {
  ArtifactType,
  FilterOptions,
  CacheEntry,
  FetchResult,
  FetchAllResult,
  EMRServiceConfig,
} from '../types/emr.types';

class EMRService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly client = createAuthenticatedClient();
  private readonly config: EMRServiceConfig;

  constructor() {
    this.config = {
      cacheTTL: config.cache.enabled ? config.cache.ttlSeconds * 1000 : 0, // Convert to ms
      retryAttempts: 3,
      retryDelay: 1000,
      requestTimeout: 10000, // 10 seconds
    };

    // Clean expired cache entries every minute
    if (config.cache.enabled) {
      setInterval(() => this.cleanExpiredCache(), 60000);
    }
  }

  /**
   * Fetch care plans for a patient
   */
  async fetchCarePlans(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('care_plan', '/v2/care_plans', patientId, options);
  }

  /**
   * Fetch medications for a patient
   */
  async fetchMedications(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('medication', '/v2/medications', patientId, options);
  }

  /**
   * Fetch clinical notes for a patient
   */
  async fetchNotes(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('note', '/v2/notes', patientId, options);
  }

  /**
   * Fetch clinical documents for a patient
   */
  async fetchDocuments(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('document', '/v2/documents', patientId, options);
  }

  /**
   * Fetch conditions/diagnoses for a patient
   */
  async fetchConditions(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('condition', '/v2/conditions', patientId, options);
  }

  /**
   * Fetch allergies for a patient
   */
  async fetchAllergies(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('allergy', '/v2/allergies', patientId, options);
  }

  /**
   * Fetch form responses for a patient
   */
  async fetchFormResponses(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('form_response', '/v2/form_responses', patientId, options);
  }

  /**
   * Fetch messages for a patient
   */
  async fetchMessages(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('message', '/v2/messages', patientId, options);
  }

  /**
   * Fetch lab observations for a patient
   */
  async fetchLabObservations(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('lab_observation', '/v2/lab_observations', patientId, options);
  }

  /**
   * Fetch vitals for a patient
   */
  async fetchVitals(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('vital', '/v2/vitals', patientId, options);
  }

  /**
   * Fetch appointments for a patient
   */
  async fetchAppointments(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('appointment', '/v2/appointments', patientId, options);
  }

  /**
   * Fetch superbills for a patient
   */
  async fetchSuperbills(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('superbill', '/v2/superbills', patientId, options);
  }

  /**
   * Fetch insurance policies for a patient
   */
  async fetchInsurancePolicies(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('insurance_policy', '/v2/insurance_policies', patientId, options);
  }

  /**
   * Fetch tasks for a patient
   */
  async fetchTasks(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('task', '/v2/tasks', patientId, options);
  }

  /**
   * Fetch family history for a patient
   */
  async fetchFamilyHistories(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('family_history', '/v2/family_histories', patientId, options);
  }

  /**
   * Fetch intake flows (patient registration form flows)
   */
  async fetchIntakeFlows(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('intake_flow', '/v2/intake_flows', patientId, options);
  }

  /**
   * Fetch forms (form templates/definitions)
   */
  async fetchForms(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('form', '/v2/forms', patientId, options);
  }

  /**
   * Fetch all EMR data for a patient (Tier 1 + Tier 2 + Tier 3 + Tier 4)
   */
  async fetchAll(patientId: string): Promise<FetchAllResult> {
    const startTime = Date.now();

    console.log(`[EMR Service] Fetching all data for patient ${patientId}`);

    try {
      // Fetch all Tier 1 + Tier 2 + Tier 3 + Tier 4 data in parallel
      const [
        notesResult,
        documentsResult,
        medicationsResult,
        conditionsResult,
        allergiesResult,
        carePlansResult,
        formResponsesResult,
        messagesResult,
        labObservationsResult,
        vitalsResult,
        appointmentsResult,
        superbillsResult,
        insurancePoliciesResult,
        tasksResult,
        familyHistoriesResult,
        intakeFlowsResult,
        formsResult,
      ] = await Promise.all([
        this.fetchNotes(patientId),
        this.fetchDocuments(patientId),
        this.fetchMedications(patientId),
        this.fetchConditions(patientId),
        this.fetchAllergies(patientId),
        this.fetchCarePlans(patientId),
        this.fetchFormResponses(patientId),
        this.fetchMessages(patientId),
        this.fetchLabObservations(patientId),
        this.fetchVitals(patientId),
        this.fetchAppointments(patientId),
        this.fetchSuperbills(patientId),
        this.fetchInsurancePolicies(patientId),
        this.fetchTasks(patientId),
        this.fetchFamilyHistories(patientId),
        this.fetchIntakeFlows(patientId),
        this.fetchForms(patientId),
      ]);

      const fetchTime = Date.now() - startTime;

      const allResults = [
        notesResult,
        documentsResult,
        medicationsResult,
        conditionsResult,
        allergiesResult,
        carePlansResult,
        formResponsesResult,
        messagesResult,
        labObservationsResult,
        vitalsResult,
        appointmentsResult,
        superbillsResult,
        insurancePoliciesResult,
        tasksResult,
        familyHistoriesResult,
        intakeFlowsResult,
        formsResult,
      ];

      const cached = allResults.every((r) => r.cached);
      const totalCount = allResults.reduce((sum, r) => sum + r.count, 0);

      console.log(
        `[EMR Service] ✓ Fetched all Tier 1 + Tier 2 + Tier 3 + Tier 4 data for patient ${patientId} (${totalCount} total items, cached: ${cached}, ${fetchTime}ms)`
      );

      return {
        notes: notesResult.data,
        documents: documentsResult.data,
        medications: medicationsResult.data,
        conditions: conditionsResult.data,
        allergies: allergiesResult.data,
        carePlans: carePlansResult.data,
        formResponses: formResponsesResult.data,
        messages: messagesResult.data,
        labObservations: labObservationsResult.data,
        vitals: vitalsResult.data,
        appointments: appointmentsResult.data,
        superbills: superbillsResult.data,
        insurancePolicies: insurancePoliciesResult.data,
        tasks: tasksResult.data,
        familyHistories: familyHistoriesResult.data,
        intakeFlows: intakeFlowsResult.data,
        forms: formsResult.data,
        cached,
        fetchTime,
        totalCount,
      };
    } catch (error) {
      console.error(`[EMR Service] Failed to fetch all data for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[EMR Service] Cache cleared (${size} entries removed)`);
  }

  /**
   * Clear cache for a specific patient
   */
  clearPatientCache(patientId: string): void {
    const keys = Array.from(this.cache.keys()).filter((key) =>
      key.includes(`:${patientId}:`)
    );
    keys.forEach((key) => this.cache.delete(key));
    console.log(`[EMR Service] Cleared cache for patient ${patientId} (${keys.length} entries)`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, Math.floor((entry.expiresAt - now) / 1000)),
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Generic fetch method with caching, retry logic, and error handling
   */
  private async fetchData(
    type: ArtifactType,
    endpoint: string,
    patientId: string,
    options?: FilterOptions,
    attempt: number = 1
  ): Promise<FetchResult<any[]>> {
    const startTime = Date.now();

    // Check cache first
    if (config.cache.enabled) {
      const cached = this.getFromCache(type, patientId, options);
      if (cached) {
        const fetchTime = Date.now() - startTime;
        console.log(
          `[EMR Service] ✓ Cache hit for ${type}:${patientId} (${cached.length} items, ${fetchTime}ms)`
        );
        return {
          data: cached,
          cached: true,
          fetchTime,
          count: cached.length,
        };
      }
    }

    try {
      console.log(
        `[EMR Service] Fetching ${type} for patient ${patientId} (attempt ${attempt}/${this.config.retryAttempts})`
      );

      // Build query parameters
      const params: any = {
        user_id: patientId,
        account: config.avon.account, // Required by API
      };
      if (options?.dateFrom) params.from = options.dateFrom;
      if (options?.dateTo) params.to = options.dateTo;
      if (options?.limit) params.limit = options.limit;
      if (options?.offset) params.offset = options.offset;

      // Make the request with timeout
      const response = await this.client.get(endpoint, {
        params,
        timeout: this.config.requestTimeout,
      });

      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      const fetchTime = Date.now() - startTime;

      console.log(
        `[EMR Service] ✓ Fetched ${type} for patient ${patientId} (${data.length} items, ${fetchTime}ms)`
      );

      // Store in cache
      if (config.cache.enabled && data.length > 0) {
        this.setInCache(type, patientId, options, data);
      }

      return {
        data,
        cached: false,
        fetchTime,
        count: data.length,
      };
    } catch (error) {
      return this.handleFetchError(error, type, endpoint, patientId, options, attempt);
    }
  }

  /**
   * Handle errors with retry logic
   */
  private async handleFetchError(
    error: any,
    type: ArtifactType,
    endpoint: string,
    patientId: string,
    options: FilterOptions | undefined,
    attempt: number
  ): Promise<FetchResult<any[]>> {
    const axiosError = error as AxiosError;

    // Check if we should retry
    const shouldRetry =
      attempt < this.config.retryAttempts &&
      (!axiosError.response || axiosError.response.status >= 500);

    if (shouldRetry) {
      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      console.log(
        `[EMR Service] Fetch failed for ${type}:${patientId}, retrying in ${delay}ms... (attempt ${attempt}/${this.config.retryAttempts})`
      );
      await this.sleep(delay);
      return this.fetchData(type, endpoint, patientId, options, attempt + 1);
    }

    // No more retries, throw detailed error
    if (axiosError.response) {
      const status = axiosError.response.status;
      const errorData = axiosError.response.data;

      console.error(`[EMR Service] Failed to fetch ${type} for patient ${patientId}:`, {
        status,
        error: errorData,
      });

      if (status === 404) {
        throw new Error(`Patient ${patientId} not found or no ${type} data available`);
      } else if (status === 429) {
        throw new Error(
          `Rate limit exceeded for ${type} endpoint. Please retry after a delay.`
        );
      } else if (status === 401) {
        throw new Error(`Authentication failed for ${type} endpoint`);
      } else if (status === 403) {
        throw new Error(`Access forbidden for patient ${patientId}`);
      } else {
        throw new Error(
          `Failed to fetch ${type}: ${status} - ${JSON.stringify(errorData)}`
        );
      }
    } else if (axiosError.code === 'ECONNABORTED') {
      throw new Error(
        `Request timeout (${this.config.requestTimeout}ms) for ${type}:${patientId}`
      );
    } else {
      throw new Error(`Network error fetching ${type}: ${axiosError.message}`);
    }
  }

  /**
   * Get data from cache
   */
  private getFromCache(
    type: ArtifactType,
    patientId: string,
    options?: FilterOptions
  ): any[] | null {
    const cacheKey = this.generateCacheKey(type, patientId, options);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  private setInCache(
    type: ArtifactType,
    patientId: string,
    options: FilterOptions | undefined,
    data: any[]
  ): void {
    const cacheKey = this.generateCacheKey(type, patientId, options);
    const now = Date.now();

    const entry: CacheEntry<any[]> = {
      data,
      timestamp: now,
      expiresAt: now + this.config.cacheTTL,
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * Generate cache key in format: {type}:{patientId}:{timestamp}
   * For consistent caching, we round timestamp to minute
   */
  private generateCacheKey(
    type: ArtifactType,
    patientId: string,
    options?: FilterOptions
  ): string {
    // Round to nearest minute for cache key consistency
    const roundedTime = Math.floor(Date.now() / 60000) * 60000;

    // Include filter options in cache key
    const optionsKey = options
      ? `:${options.dateFrom || ''}:${options.dateTo || ''}:${options.limit || ''}:${
          options.offset || ''
        }`
      : '';

    return `${type}:${patientId}:${roundedTime}${optionsKey}`;
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[EMR Service] Cleaned ${removed} expired cache entries`);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const emrService = new EMRService();
export default emrService;
