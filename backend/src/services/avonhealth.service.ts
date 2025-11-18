/**
 * Avon Health API Service
 * Handles OAuth2 authentication and EMR data fetching
 */

import axios, { AxiosInstance } from 'axios';
import type {
  AvonHealthCredentials,
  AvonHealthTokenResponse,
  AvonHealthJWTRequest,
  AvonHealthJWTResponse,
  CarePlan,
  Medication,
  ClinicalNote,
} from '../types';

export class AvonHealthService {
  private client: AxiosInstance;
  private credentials: AvonHealthCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private jwtToken: string | null = null;
  private jwtExpiry: number = 0;

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
   * Step 1: Get OAuth2 Bearer Token (with caching)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('🔐 Step 1: Obtaining OAuth2 bearer token...');
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

      console.log('✅ Bearer token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      console.error('❌ OAuth2 token error:', error.response?.data || error.message);
      throw new Error(`Failed to authenticate with Avon Health API: ${error.message}`);
    }
  }

  /**
   * Step 2: Exchange Bearer Token for JWT Token (with caching)
   */
  private async getJWTToken(): Promise<string> {
    // Return cached JWT if still valid
    if (this.jwtToken && Date.now() < this.jwtExpiry) {
      return this.jwtToken;
    }

    try {
      // First ensure we have a valid bearer token
      const bearerToken = await this.getAccessToken();

      console.log('🔐 Step 2: Exchanging bearer token for JWT token...');
      console.log(`   Account: ${this.credentials.account}`);
      console.log(`   User ID: ${this.credentials.user_id}`);

      const jwtRequest: AvonHealthJWTRequest = {
        account: this.credentials.account,
        user_id: this.credentials.user_id,
      };

      const response = await this.client.post<AvonHealthJWTResponse>(
        '/v2/auth/jwt',
        jwtRequest,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.jwtToken = response.data.jwt_token;
      // Set expiry to 90% of actual expiry to allow for refresh time
      this.jwtExpiry = Date.now() + (response.data.expires_in * 1000 * 0.9);

      console.log('✅ JWT token obtained successfully');
      return this.jwtToken;
    } catch (error: any) {
      console.error('❌ JWT token error:', error.response?.data || error.message);
      throw new Error(`Failed to obtain JWT token: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Avon Health API using JWT token
   */
  private async authenticatedRequest<T>(
    method: 'get' | 'post',
    endpoint: string,
    data?: any
  ): Promise<T> {
    // Use JWT token for EMR endpoints (requires two-step auth)
    const jwtToken = await this.getJWTToken();

    try {
      console.log(`📡 Making ${method.toUpperCase()} request to ${endpoint}`);
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        headers: {
          Authorization: `Bearer ${jwtToken}`,
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
   * Health check - tests full authentication flow
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Testing Avon Health API authentication...');

      // Test Step 1: Get bearer token
      await this.getAccessToken();

      // Test Step 2: Get JWT token
      await this.getJWTToken();

      console.log('✅ Full authentication flow successful');
      return true;
    } catch (error: any) {
      console.error('❌ Authentication flow failed:', error.message);
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
