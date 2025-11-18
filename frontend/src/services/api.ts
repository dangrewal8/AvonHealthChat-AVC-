/**
 * API Service Layer
 *
 * Class-based API client with interceptors for backend communication.
 *
 * Features:
 * - Axios instance with default configuration
 * - Request/response interceptors
 * - Automatic error transformation
 * - Timeout handling (10 seconds)
 * - Type-safe methods
 *
 * Tech Stack: axios + TypeScript
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  UIResponse,
  QueryRequest,
  QueryHistoryItem,
  APIError,
} from '../types';

/**
 * Transformed error interface
 */
interface TransformedError {
  message: string;
  recovery_suggestion?: string;
  code?: string;
  status?: number;
}

/**
 * APIClient Class (Prompt 69 Specification)
 *
 * Provides a centralized API client with interceptors for error handling.
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    // Create axios instance with defaults
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
      timeout: 300000, // 5 minutes (RAG queries with Ollama can take 2-3 minutes)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor (for future auth tokens, etc.)
    this.client.interceptors.request.use(
      (config) => {
        // Add any request modifications here (e.g., auth tokens)
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Success response - pass through
        return response;
      },
      (error: AxiosError) => {
        // Transform error for consistent handling
        const transformedError = this.transformError(error);
        return Promise.reject(transformedError);
      }
    );
  }

  /**
   * Transform axios error to consistent error format
   */
  private transformError(error: AxiosError): TransformedError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;

      return {
        message: data.error?.user_message || data.message || 'An error occurred',
        recovery_suggestion:
          data.error?.recovery_suggestion || 'Please try again or contact support',
        code: data.error?.code || `HTTP_${error.response.status}`,
        status: error.response.status,
      };
    } else if (error.request) {
      // No response received (network error)
      return {
        message: 'Unable to connect to server',
        recovery_suggestion: 'Please check your internet connection and try again',
        code: 'NETWORK_ERROR',
      };
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      return {
        message: 'Request timeout',
        recovery_suggestion: 'The server is taking too long to respond. Please try again.',
        code: 'TIMEOUT_ERROR',
      };
    } else {
      // Other errors
      return {
        message: error.message || 'An unexpected error occurred',
        recovery_suggestion: 'Please try again',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Search / Query the RAG system
   *
   * @param query - Search query string
   * @param patientId - Patient ID
   * @param options - Optional query options
   * @returns Promise with UIResponse data
   */
  async search(
    query: string,
    patientId: string,
    options?: { detail_level?: number; max_results?: number }
  ): Promise<{ data: UIResponse }> {
    const response = await this.client.post<UIResponse>('/api/query', {
      query,
      patient_id: patientId,
      options,
    });

    return { data: response.data };
  }

  /**
   * Get recent queries for a patient
   *
   * @param patientId - Patient ID
   * @param limit - Number of queries to return (default: 10)
   * @returns Promise with query history
   */
  async getRecentQueries(patientId: string, limit: number = 10) {
    const response = await this.client.get(
      `/api/queries/recent?patient_id=${patientId}&limit=${limit}`
    );

    return response;
  }

  /**
   * Health check endpoint
   *
   * @returns Promise with health status
   */
  async getHealth() {
    const response = await this.client.get('/health');
    return response;
  }

  /**
   * Index patient data
   *
   * @param patientId - Patient ID to index
   * @param forceReindex - Force reindex even if already indexed
   * @returns Promise with index result
   */
  async indexPatient(patientId: string, forceReindex: boolean = false) {
    const response = await this.client.post(`/api/index/${patientId}`, {
      force_reindex: forceReindex,
    });

    return response;
  }

  /**
   * Get axios instance (for advanced usage)
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing/advanced usage
export { APIClient };

/**
 * Legacy Function-Based API (Backward Compatibility)
 *
 * These functions wrap the class-based API for backward compatibility
 * with existing code.
 */

/**
 * Query the RAG system (Legacy)
 *
 * @param request - Query request
 * @returns UI response
 */
export async function queryRAG(request: QueryRequest): Promise<UIResponse> {
  try {
    const response = await apiClient.search(
      request.query,
      request.patient_id,
      request.options
    );
    return response.data;
  } catch (error: any) {
    // Re-throw as Error for backward compatibility
    throw new Error(error.message || 'Failed to query RAG system');
  }
}

/**
 * Get recent queries for a patient (Legacy)
 *
 * @param patientId - Patient ID
 * @param limit - Number of queries to return
 * @returns Query history
 */
export async function getRecentQueries(
  patientId: string,
  limit: number = 10
): Promise<QueryHistoryItem[]> {
  try {
    const response = await apiClient.getRecentQueries(patientId, limit);
    return response.data.queries || response.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch query history');
  }
}

/**
 * Health check (Legacy)
 *
 * @returns Health status
 */
export async function healthCheck(): Promise<{ status: string }> {
  try {
    const response = await apiClient.getHealth();
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || 'Server is not responding');
  }
}

/**
 * Index patient data (Legacy)
 *
 * @param patientId - Patient ID to index
 * @param forceReindex - Force reindex even if already indexed
 * @returns Index result
 */
export async function indexPatient(
  patientId: string,
  forceReindex: boolean = false
): Promise<any> {
  try {
    const response = await apiClient.indexPatient(patientId, forceReindex);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to index patient data');
  }
}

// Default export
export default {
  queryRAG,
  getRecentQueries,
  healthCheck,
  indexPatient,
  apiClient,
};
