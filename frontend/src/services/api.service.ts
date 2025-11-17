import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import apiConfig, { API_ENDPOINTS } from '../config/api.config';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[API] Response from ${response.config.url}:`, response.status);
        return response;
      },
      async (error: AxiosError) => {
        console.error('[API] Response error:', error.message);

        if (error.response) {
          console.error('[API] Error response:', {
            status: error.response.status,
            data: error.response.data,
          });
        }

        if (error.code === 'ECONNABORTED') {
          console.error('[API] Request timeout');
        }

        return Promise.reject(error);
      }
    );
  }

  async healthCheck(): Promise<any> {
    const response = await this.client.get(API_ENDPOINTS.health);
    return response.data;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService;
