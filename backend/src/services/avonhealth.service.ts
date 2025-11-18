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
   * Get OAuth2 Bearer Token (with caching)
   * Uses client credentials flow to obtain access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('🔐 Obtaining OAuth2 access token...');
      const response = await this.client.post<AvonHealthTokenResponse>(
        '/v2/auth/token',
        {
          grant_type: 'client_credentials',
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 90% of actual expiry to allow for refresh time
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000 * 0.9);

      console.log('✅ Access token obtained successfully');
      console.log(`   Expires in: ${response.data.expires_in} seconds (~${Math.round(response.data.expires_in / 3600)} hours)`);
      return this.accessToken;
    } catch (error: any) {
      console.error('❌ OAuth2 token error:', error.response?.data || error.message);
      throw new Error(`Failed to authenticate with Avon Health API: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Avon Health API using bearer token
   */
  private async authenticatedRequest<T>(
    method: 'get' | 'post',
    endpoint: string,
    data?: any
  ): Promise<T> {
    // Get bearer token from /v2/auth/token
    const token = await this.getAccessToken();

    try {
      console.log(`📡 Making ${method.toUpperCase()} request to ${endpoint}`);
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      console.log(`✅ Request successful: ${endpoint}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Avon Health API error (${endpoint}):`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.response?.data?.message || error.message}`);
      console.error(`   Details:`, error.response?.data);

      if (error.response?.status === 401) {
        console.error('   ⚠️  Authentication failed - check credentials and token');
        console.error('   ⚠️  Ensure account and user_id are correct');
      }

      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Fetch care plans for a patient
   *
   * NOTE: patient_id might be different from user_id used in JWT auth
   * Common patterns:
   * - patient_id could be: user_id, "patient_" + user_id, or a separate ID
   * - Check API documentation or try user_id first
   */
  async getCarePlans(patientId: string): Promise<CarePlan[]> {
    console.log(`🔍 Fetching care plans for patient_id: ${patientId}`);
    if (patientId === this.credentials.user_id) {
      console.log(`   ℹ️  Using user_id as patient_id`);
    } else {
      console.log(`   ℹ️  Patient ID differs from user_id (${this.credentials.user_id})`);
    }
    return this.authenticatedRequest<CarePlan[]>(
      'get',
      `/v2/care_plans?patient_id=${patientId}`
    );
  }

  /**
   * Fetch medications for a patient
   */
  async getMedications(patientId: string): Promise<Medication[]> {
    console.log(`🔍 Fetching medications for patient_id: ${patientId}`);
    return this.authenticatedRequest<Medication[]>(
      'get',
      `/v2/medications?patient_id=${patientId}`
    );
  }

  /**
   * Fetch clinical notes for a patient
   */
  async getNotes(patientId: string): Promise<ClinicalNote[]> {
    console.log(`🔍 Fetching notes for patient_id: ${patientId}`);
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
   * Health check - tests authentication
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Testing Avon Health API authentication...');

      // Test: Get bearer token from /v2/auth/token
      await this.getAccessToken();

      console.log('✅ Authentication successful');
      return true;
    } catch (error: any) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  /**
   * Test patient data retrieval with different patient_id patterns
   * Helps debug 401 errors by trying common patient_id formats
   */
  async testPatientIdFormats(baseId?: string): Promise<void> {
    const testId = baseId || this.credentials.user_id;

    console.log('\n🧪 Testing different patient_id formats...');
    console.log(`   Base ID: ${testId}`);

    const testPatterns = [
      { name: 'user_id as-is', id: testId },
      { name: 'patient_ prefix', id: `patient_${testId}` },
      { name: 'user_ prefix', id: `user_${testId}` },
      { name: 'numeric only', id: testId.replace(/\D/g, '') },
    ];

    for (const pattern of testPatterns) {
      try {
        console.log(`\n   Testing: ${pattern.name} (${pattern.id})`);
        await this.getCarePlans(pattern.id);
        console.log(`   ✅ SUCCESS with ${pattern.name}`);
        console.log(`   → Use patient_id: ${pattern.id}`);
        return; // Stop on first success
      } catch (error: any) {
        console.log(`   ❌ Failed with ${pattern.name}: ${error.message}`);
      }
    }

    console.log('\n   ⚠️  All patterns failed. Check Avon Health API documentation for correct patient_id format');
  }
}
