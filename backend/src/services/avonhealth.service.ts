/**
 * Avon Health API Service
 * Handles OAuth2 authentication and EMR data fetching
 */

import axios, { AxiosInstance } from 'axios';
import type {
  AvonHealthCredentials,
  AvonHealthTokenResponse,
  CarePlan,
  Medication,
  ClinicalNote,
} from '../types';

export class AvonHealthService {
  private client: AxiosInstance;
  private credentials: AvonHealthCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: AvonHealthCredentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: credentials.base_url,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get OAuth2 access token (with caching)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.client.post<AvonHealthTokenResponse>(
        '/oauth2/token',
        {
          grant_type: 'client_credentials',
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 90% of actual expiry to allow for refresh time
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000 * 0.9);

      return this.accessToken;
    } catch (error: any) {
      console.error('OAuth2 token error:', error.message);
      throw new Error(`Failed to authenticate with Avon Health API: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Avon Health API
   */
  private async authenticatedRequest<T>(
    method: 'get' | 'post',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      console.error(`Avon Health API error (${endpoint}):`, error.message);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Fetch care plans for a patient
   */
  async getCarePlans(patientId: string): Promise<CarePlan[]> {
    return this.authenticatedRequest<CarePlan[]>(
      'get',
      `/v2/care_plans?patient_id=${patientId}`
    );
  }

  /**
   * Fetch medications for a patient
   */
  async getMedications(patientId: string): Promise<Medication[]> {
    return this.authenticatedRequest<Medication[]>(
      'get',
      `/v2/medications?patient_id=${patientId}`
    );
  }

  /**
   * Fetch clinical notes for a patient
   */
  async getNotes(patientId: string): Promise<ClinicalNote[]> {
    return this.authenticatedRequest<ClinicalNote[]>(
      'get',
      `/v2/notes?patient_id=${patientId}`
    );
  }

  /**
   * Fetch all EMR data for a patient
   */
  async getAllPatientData(patientId: string): Promise<{
    care_plans: CarePlan[];
    medications: Medication[];
    notes: ClinicalNote[];
  }> {
    try {
      const [carePlans, medications, notes] = await Promise.all([
        this.getCarePlans(patientId),
        this.getMedications(patientId),
        this.getNotes(patientId),
      ]);

      return {
        care_plans: carePlans,
        medications: medications,
        notes: notes,
      };
    } catch (error: any) {
      console.error('Failed to fetch patient data:', error.message);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}
